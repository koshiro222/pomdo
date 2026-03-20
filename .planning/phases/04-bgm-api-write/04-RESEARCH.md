# Phase 04: BGM API - Write - Research

**Researched:** 2026-03-20
**Domain:** tRPC mutations, R2 operations, Edge Runtime file handling
**Confidence:** HIGH

## Summary

Phase 04では、管理者のみがBGMトラックを追加・更新・削除できるtRPC mutationを実装する。ファイルアップロードはBase64エンコード方式でtRPC mutation経由で行い、R2バケット`pomdo-bgm`に保存する。DB操作にはDrizzle ORM、認可には既存の`adminProcedure`ミドルウェアを使用する。

**Primary recommendation:** CONTEXT.mdの決定（Base64方式、10MB上限、UUID自動生成）に従い、既存のtodosRouterパターンを参考にcreate/update/delete mutationを実装する。R2操作はCloudflare Workers API（`put()`, `delete()`）を使用し、エラーハンドリングは`TRPCError`で統一する。

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @trpc/server | ^11.0.0 | tRPC mutation実装 | プロジェクトで既に使用、型安全なRPC |
| drizzle-orm | ^0.45.1 | DB操作（bgmTracksテーブル） | プロジェクトのORM、PostgreSQL方言 |
| zod | (dep) | 入力バリデーションスキーマ | tRPCと統合済み |

### Infrastructure
| Component | Purpose | Why Standard |
|-----------|---------|--------------|
| Cloudflare R2 | MP3ファイル保存 | `pomdo-bgm`バケット既存、Workers APIで操作 |
| adminProcedure | 管理者権限チェック | Phase 02で実装済み、FORBDEDエラーをthrow |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto.randomUUID() | Web Crypto API | ファイル名生成（UUID） | Edge Runtime標準API |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Base64 tRPC | Multipart form data | Base64は33%増加するが、実装がシンプルで既存インフラ活用可能。MultipartはHono REST APIが必要で複雑。 |

**Installation:**
```bash
# すべての依存関係は既にインストール済み
npm install # 必要に応じて
```

**Version verification:**
- @trpc/server: ^11.0.0（package.json確認済み）
- drizzle-orm: ^0.45.1（package.json確認済み）
- zod: dependenciesに明示なし（@trpc/serverのpeer dependencyとして利用）

## Architecture Patterns

### Recommended Project Structure
```
src/app/routers/
├── bgm.ts              # 既存ルーターにcreate/update/delete追加
├── _shared.ts          # Zodスキーマ定義追加
└── context.ts          # adminProcedure使用（既存）

functions/lib/
└── schema.ts           # bgmTracksスキーマ（既存）
```

### Pattern 1: tRPC mutation with adminProcedure
**What:** 管理者専用のmutationを作成するパターン
**When to use:** 管理者のみが実行できる操作（create/update/delete）
**Example:**
```typescript
// Source: src/app/routers/context.ts（既存実装）
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'ログインが必要です' })
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: '管理者権限が必要です' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

// 使用例
create: adminProcedure
  .input(createBgmTrackSchema)
  .mutation(async ({ ctx, input }) => {
    // DB・R2操作
  })
```

### Pattern 2: R2 file operations in Edge Runtime
**What:** Cloudflare Workers APIでR2バケットを操作
**When to use:** ファイルのアップロード・削除
**Example:**
```typescript
// Source: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
// R2 put (upload)
const buffer = Buffer.from(base64String, 'base64')
await env.BGM_BUCKET.put(filename, buffer, {
  httpMetadata: { contentType: 'audio/mpeg' }
})

// R2 delete
await env.BGM_BUCKET.delete(filename)
```

### Pattern 3: UUID filename generation
**What:** Web Crypto APIでランダムなファイル名を生成
**When to use:** ユニークなファイル名が必要な場合
**Example:**
```typescript
// Edge Runtime標準API
const filename = `${crypto.randomUUID()}.mp3`
// 例: "a1b2c3d4-e5f6-7890-abcd-ef1234567890.mp3"
```

### Anti-Patterns to Avoid
- **`new Error()`を直接throw**: tRPCでは`TRPCError`を使用しないとINTERNAL_SERVER_ERROR(500)になる
- **R2削除失敗時にDB削除をロールバック**: CONTEXT.mdの決定通り、DB削除は進める（整合性優先）
- **ファイルサイズチェックのみ**: クライアント側チェックはUX向上だが、サーバー側でも必ず再チェックする

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ファイル名衝突解決 | カスタムロジック | `crypto.randomUUID()` | UUID標準は衝突可能性が極めて低い、実装シンプル |
| Base64デコード | 手動実装 | `Buffer.from(str, 'base64')` | Node.js/Edge Runtime標準API |
| バリデーション | if文チェック | Zodスキーマ | tRPCと統済、型安全、エラーメッセージ国際化対応 |
| 管理者権限チェック | セッションから直接判定 | `adminProcedure`ミドルウェア | 既存実装、DRY原則、エラー統一 |

**Key insight:** Edge Runtime制約下ではNode.js API（crypto, fs）が使えないため、Web Crypto APIとR2 Workers APIを使用する。手動実装はバグの温床になりやすい。

## Common Pitfalls

### Pitfall 1: ファイルサイズ超過の検出漏れ
**What goes wrong:** クライアント側で10MBチェックしていても、サーバー側ではBase64エンコードで約13MBに増加していることに気づかない。
**Why it happens:** Base64エンコードは元サイズの約4/3倍になる。
**How to avoid:** サーバー側でBase64デコード後のサイズをチェックする。
**Warning signs:** デプロイ後に大きなファイルがアップロードできてしまう。

### Pitfall 2: R2削除失敗時の不整合
**What goes wrong:** DB削除後にR2削除が失敗すると、R2にゴミファイルが残る。
**Why it happens:** ネットワークエラーやR2サービスの一時的障害。
**How to avoid:** CONTEXT.mdの決定通り、R2削除失敗時もDB削除は進める。ゴミファイルは手動で対処する運用にする。
**Warning signs:** 削除操作後に「ファイルが見つからない」エラーが頻発。

### Pitfall 3: TRPCErrorのcode指定ミス
**What goes wrong:** `new Error()`をthrowすると500エラーになり、クライアントで適切にハンドリングできない。
**Why it happens:** tRPCは`TRPCError`のみを正しく処理する。
**How to avoid:** 必ず`TRPCError`を使用し、codeを正しく指定する（UNAUTHORIZED, FORBIDDEN, NOT_FOUND, BAD_REQUEST, INTERNAL_SERVER_ERROR）。
**Warning signs:** エラーメッセージが一律「Internal Server Error」になる。

### Pitfall 4: 非管理者のmutation実行
**What goes wrong:** 一般ユーザーが管理者用APIを呼べてしまう。
**Why it happens:** `publicProcedure`や`protectedProcedure`を誤って使用。
**How to avoid:**管理者専用エンドポイントには必ず`adminProcedure`を使用する。
**Warning signs:** テストで403エラーが発生しない。

## Code Examples

Verified patterns from official sources:

### R2 file upload with Base64
```typescript
// Source: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
// Base64デコード
const buffer = Buffer.from(input.fileBase64, 'base64')

// R2にアップロード
await env.BGM_BUCKET.put(filename, buffer, {
  httpMetadata: { contentType: 'audio/mpeg' }
})
```

### DB insert with returning
```typescript
// Source: src/app/routers/todos.ts（既存実装パターン）
const [created] = await db
  .insert(ctx.schema.bgmTracks)
  .values({
    title: input.title,
    artist: input.artist,
    color: input.color,
    filename: generatedFilename,
    tier: input.tier ?? 'free',
  })
  .returning()

return created
```

### DB update with partial fields
```typescript
// Source: src/app/routers/todos.ts（既存実装パターン）
const updateData: Record<string, unknown> = {}
if (input.title !== undefined) updateData.title = input.title
if (input.artist !== undefined) updateData.artist = input.artist
if (input.color !== undefined) updateData.color = input.color
if (input.tier !== undefined) updateData.tier = input.tier

const [updated] = await db
  .update(ctx.schema.bgmTracks)
  .set(updateData)
  .where(eq(ctx.schema.bgmTracks.id, input.id))
  .returning()

return updated
```

### Transaction-like delete (DB → R2)
```typescript
// Source: CONTEXT.mdの決定
// 1. DBから削除
await db
  .delete(ctx.schema.bgmTracks)
  .where(eq(ctx.schema.bgmTracks.id, input.id))

// 2. R2から削除（失敗してもDB削除は確定）
try {
  await env.BGM_BUCKET.delete(filename)
} catch (error) {
  // ログ記録のみ、DB削除はロールバックしない
  console.error(`R2 delete failed for ${filename}:`, error)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| multipart/form-data + Hono REST | Base64 + tRPC mutation | 2026-03-20（CONTEXT.md決定） | 実装シンプル、型安全、既存adminProcedure活用可能 |

**Deprecated/outdated:**
- multipart/form-data方式は検討したが、今回のスコープでは採用せず（CONTEXT.md参照）

## Open Questions

なし。CONTEXT.mdですべての実装決定が完了している。

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 + Playwright ^1.58.2 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test && npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-03 | 管理者がトラック追加 | unit | `npm test -- --run bgm` | ❌ Wave 0 |
| API-03 | 非管理者の追加は403 | unit | `npm test -- --run bgm` | ❌ Wave 0 |
| API-03 | ファイルサイズ超過で400 | unit | `npm test -- --run bgm` | ❌ Wave 0 |
| API-04 | 管理者がトラック更新 | unit | `npm test -- --run bgm` | ❌ Wave 0 |
| API-05 | 管理者がトラック削除 | unit | `npm test -- --run bgm` | ❌ Wave 0 |
| API-06 | R2ファイルアップロード | manual-only | - | - |
| API-07 | R2ファイル削除 | manual-only | - | - |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/bgm.test.ts` — tRPC mutationsの単体テスト
- [ ] `tests/unit/helpers/r2-mock.ts` — R2バケットのモック
- [ ] `tests/unit/helpers/trpc-context.ts` — tRPCテスト用コンテキスト

R2操作はCloudflare Workers環境に依存するため、ローカルでの完全な自動テストは困難。R2操作は手動テスト（本番環境またはWrangler local）で検証し、DB操作・認可ロジックはユニットテストでカバーする。

## Sources

### Primary (HIGH confidence)
- Cloudflare R2 Workers API reference (2026-01-29) - https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- tRPC concepts documentation - https://trpc.io/docs/concepts
- プロジェクト既存コード - `src/app/routers/todos.ts`, `src/app/routers/context.ts`, `functions/api/bgm.ts`

### Secondary (MEDIUM confidence)
- CONTEXT.md (2026-03-20) - ユーザー決定済みの実装方針
- package.json - 依存関係バージョン確認
- wrangler.toml - R2バインディング設定確認

### Tertiary (LOW confidence)
- なし（WebSearchは結果が得られなかったため、公式ドキュメントと既存コードに依存）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 既存コードで確認済み、公式ドキュメントと一致
- Architecture: HIGH - todos.tsの実装パターンが確認済み、R2 APIは公式ドキュメントで確認
- Pitfalls: MEDIUM - 一般的なtRPC/R2の落とし穴は把握しているが、Edge Runtime特有の問題は実際に実装してみないと分からない場合がある

**Research date:** 2026-03-20
**Valid until:** 30日（安定した技術スタックのため）
