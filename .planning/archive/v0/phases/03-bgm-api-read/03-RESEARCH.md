# Phase 3: BGM API - Read - Research

**Researched:** 2026-03-20
**Domain:** tRPC Query + Drizzle ORM Read Pattern
**Confidence:** HIGH

## Summary

tRPCルーター `bgm` を作成し、`getAll` クエリで全BGMトラックを取得するRead APIを実装します。認証不要の `publicProcedure` を使用し、ゲストユーザーも含む全ユーザーがBGMを取得可能にします。Drizzle ORMの `select()` で `bgm_tracks` テーブルからデータを取得し、Zodスキーマでバリデーションを行います。フィルタリング（tier）とソート順序をオプションで提供し、既存 `useBgm.ts` の `Track` 型と互換性のあるレスポンス形式を維持します。

**Primary recommendation:** 既存の `todosRouter` パターンを踏襲し、`publicProcedure.query()` でシンプルに実装する。複雑なフィルタリングは将来の拡張に委ね、現時点では `db.select().from(schema.bgmTracks)` の基本パターンに集中する。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **アクセス制限**: publicProcedureを使用
  - 認証不要: ログインなしで全員（ゲスト含む）がBGM取得可能
  - 理由: BGMは全ユーザー共通の集中作業用リソース。ゲストモードが既存機能のため。

- **レスポンス形式**: 既存 `Track` 型（`useBgm.ts`）と完全互換
  - src生成: DBの `filename` から `/api/bgm/filename` を生成
  - 返却フィールド: `{ id, title, src, artist?, color?, tier, createdAt, updatedAt }`
  - 既存Track型対応: `{ id, title, src, artist?, color? }` → APIは追加フィールドを含む

- **フィルタリング（tier）**: オプション
  - 未指定時: 全トラック（free + premium）返却
  - 指定時: 指定tierのみ返却（例: `tier?: "free" | "premium"`）
  - 理由: 将来の有料プラン対応のため、フィルタ機能を用意。現在は全トラック公開。

### Claude's Discretion

- エラーハンドリングの詳細（DB接続エラー等）
- ソート順序の指定（作成日順、タイトル順等）
- レスポンスのキャッシュ戦略
- Zodスキーマの詳細定義

### Deferred Ideas (OUT OF SCOPE)

なし — Read APIの範囲内でのみ議論

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-01 | tRPC ルーター `bgm` を作成 | 既存ルーターパターン（todosRouter）を踏襲し、publicProcedureで実装 |
| API-02 | `getAll` クエリ — 全トラック取得（tierでフィルタ可能） | Drizzleのselect()とwhere()、Zodのinputスキーマで実装 |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @trpc/server | 11.0.0 (latest: 11.13.4) | TypeScript RPC | publicProcedureパターンで認証不要エンドポイント実装 |
| drizzle-orm | 0.45.1 | Database ORM | select().from()でbgm_tracksテーブル読み取り |
| zod | 4.3.6 | Schema validation | tRPC input/outputの型定義とバリデーション |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| superjson | 2.2.6 | JSON serialization | tRPC transformerとして既定義済み（日付型自動変換） |
| vitest | 4.0.18 | Unit testing | tRPCルーターの単体テスト |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| publicProcedure | protectedProcedure | ゲストモードが既存機能のため、認証不要が要件 |
| db.select().from() | db.query.bgmTracks.findMany() | select()はシンプルで、リレーション不要な今回に最適 |

**Installation:**
```bash
# 既存のバージョンで十分（追加インストール不要）
npm list @trpc/server drizzle-orm zod
```

**Version verification:**
```bash
npm view @trpc/server version  # 11.13.4 (installed: 11.0.0)
npm view drizzle-orm version   # 0.45.1 (latest: 0.45.1 installed)
npm view zod version           # 4.3.6 (latest: 4.3.6 installed)
```

インストール済みバージョンは最新版に近く、追加パッケージは不要。

## Architecture Patterns

### Recommended Project Structure
```
src/app/routers/
├── bgm.ts              # (新規) bgmRouter: getAll query
├── context.ts          # (既存) publicProcedure, protectedProcedure, adminProcedure
├── root.ts             # (更新) appRouterにbgm: bgmRouterを追加
└── _shared.ts          # (更新) bgmTrackSchema等を追加

functions/lib/
├── schema.ts           # (既存) bgmTracksテーブル定義済み
└── db.ts               # (既存) Drizzle DBインスタンス

tests/unit/
└── bgm.test.ts         # (新規) bgmRouterの単体テスト
```

### Pattern 1: tRPC Public Query with Drizzle Select
**What:** 認証不要のクエリでDBから全トラック取得
**When to use:** 全ユーザー（ゲスト含む）がアクセスする公開データ取得時
**Example:**
```typescript
// Source: 既存コードベースの todosRouter パターン (src/app/routers/todos.ts)
import { z } from 'zod'
import { router, publicProcedure } from './context'
import { eq } from 'drizzle-orm'

export const bgmRouter = router({
  getAll: publicProcedure
    .input(z.object({
      tier: z.enum(['free', 'premium']).optional(), // オプションのフィルタ
    }).optional())
    .query(async ({ ctx, input }) => {
      const { db } = ctx

      // 基本クエリ
      let query = db.select().from(ctx.schema.bgmTracks)

      // tierフィルタ（指定時のみ）
      if (input?.tier) {
        query = query.where(eq(ctx.schema.bgmTracks.tier, input.tier))
      }

      const tracks = await query

      // srcフィールドを生成（/api/bgm/filename）
      return tracks.map(track => ({
        ...track,
        src: `/api/bgm/${track.filename}`,
      }))
    }),
})
```

**重要:**
- `publicProcedure` で認証不要
- `input` はオプション全体（`.optional()`）→ tier未指定時も `getAll()` 呼び出し可能
- `map()` で `src` フィールドを生成（既存 `useBgm.ts` 互換）

### Pattern 2: Zod Schema for Track Response
**What:** tRPCレスポンスの型定義とバリデーション
**When to use:** クライアント側で型安全にトラックデータを使用する場合
**Example:**
```typescript
// Source: 既存コードベースの _shared.ts パターン (src/app/routers/_shared.ts)
import { z } from 'zod'

export const bgmTrackSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  src: z.string(), // /api/bgm/filename
  artist: z.string().optional(),
  color: z.string().optional(),
  tier: z.enum(['free', 'premium']),
  createdAt: z.string().datetime(), // superjsonでDate→string変換
  updatedAt: z.string().datetime(),
})

export type BgmTrack = z.infer<typeof bgmTrackSchema>
```

### Pattern 3: Router Integration in root.ts
**What:** appRouterにbgmRouterを統合
**When to use:** 新規ルーターをtRPCエンドポイントに追加する場合
**Example:**
```typescript
// Source: 既存コードベース (src/app/routers/root.ts)
import { router } from './context'
import { todosRouter } from './todos'
import { pomodoroRouter } from './pomodoro'
import { bgmRouter } from './bgm' // 追加

export const appRouter = router({
  todos: todosRouter,
  pomodoro: pomodoroRouter,
  bgm: bgmRouter, // 追加
})

export type AppRouter = typeof appRouter
```

### Pattern 4: Drizzle Select with Where Clause
**What:** 条件付きSELECTクエリの構築
**When to use:** オプションのフィルタリングを実装する場合
**Example:**
```typescript
// Source: Drizzle ORM公式パターン + 既存コードベース
import { eq, desc, asc } from 'drizzle-orm'

// 基本クエリ
let query = db.select().from(schema.bgmTracks)

// オプションのフィルタ
if (input?.tier) {
  query = query.where(eq(schema.bgmTracks.tier, input.tier))
}

// オプションのソート（Claude's discretion）
if (input?.sortBy === 'createdAt') {
  query = query.orderBy(desc(schema.bgmTracks.createdAt))
} else if (input?.sortBy === 'title') {
  query = query.orderBy(asc(schema.bgmTracks.title))
}

const tracks = await query
```

### Anti-Patterns to Avoid
- **protectedProcedureの誤用:** ゲストモードが既存機能のため、認証不要のpublicProcedureを使用
- **ネストしたルーター:** シングルレベルの `bgm.getAll` で十分、ネストは複雑化のみ
- **手動のJSONシリアライズ:** superjson transformerが既定義済み、Date型は自動変換
- **空配列の特別扱い:** トラック0件は空配列を返すのが正しい、404やnullは不適切

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| スキーマバリデーション | 独自のバリデーションロジック | Zod + tRPC input | 型安全、自動生成、DRY |
| JSONシリアライゼーション | 手動でDate→string変換 | superjson transformer | 既定義済み、日付型自動変換 |
| クエリビルダー | 文字列結合でSQL構築 | Drizzle ORMのselect().where() | SQLインジェクション防止、型安全 |
| エラーハンドリング | try-catch + 手動エラーレスポンス | TRPCError | tRPC標準エラー形式、自動HTTPステータス |

**Key insight:** tRPC + Drizzle + Zod の組み合わせは、型安全性と開発効率のために設計されている。これらを再構築する価値はない。

## Common Pitfalls

### Pitfall 1: tierフィルタのオプションハンドリング
**What goes wrong:** `input?.tier` チェックを忘れ、未指定時にクエリが失敗
**Why it happens:** Zodの `.optional()` は `undefined` を許容するが、クエリ側でのチェックが必要
**How to avoid:**
```typescript
// 良い例
if (input?.tier) {
  query = query.where(eq(schema.bgmTracks.tier, input.tier))
}

// 悪い例（tier未指定時にエラー）
query = query.where(eq(schema.bgmTracks.tier, input.tier)) // input.tierはundefinedの可能性
```
**Warning signs:** `tier` 未指定時に "Cannot read property 'tier' of undefined"

### Pitfall 2: srcフィールドの生成漏れ
**What goes wrong:** レスポンスに `src` が含まれず、フロントエンドでオーディオ再生が不可
**Why it happens:** DBに `src` カラムがなく、動的生成が必要
**How to avoid:**
```typescript
// 必ずmapでsrcを生成
return tracks.map(track => ({
  ...track,
  src: `/api/bgm/${track.filename}`,
}))
```
**Warning signs:** フロントエンドで `audio.src` がundefined、または "Failed to load resource"

### Pitfall 3: 日付型のシリアライゼーション
**What goes wrong:** `createdAt` がDateオブジェクトのままJSON化され、クライアントでパースエラー
**Why it happens:** superjson transformerを使用しているが、レスポンス構造が正しくない
**How to avoid:** tRPCの初期化時に `transformer: superjson` が設定されていることを確認（既存コードで設定済み）
**Warning signs:** クライアントで "Unexpected token o in JSON at position 1"

### Pitfall 4: 空配列 vs 404
**What goes wrong:** トラック0件時に404エラーを返す
**Why it happens:** REST APIの慣習をtRPCに適用しようとする
**How to avoid:** トラック0件は空配列 `[]` を返すのが正しい。404はリソース自体が存在しない場合のみ。
**Warning signs:** フロントエンドで "Cannot read property 'map' of undefined"

### Pitfall 5: 型定義の不一致
**What goes wrong:** クライアント側の `Track` 型とAPIレスポンスが不一致
**Why it happens:** 既存 `useBgm.ts` の `Track` 型とAPIレスポンスのズレ
**How to avoid:** APIレスポンスは既存 `Track` 型のスーパーセット（追加フィールド許容）にする
```typescript
// 既存Track型（useBgm.ts）
{ id, title, src, artist?, color? }

// APIレスポンス（追加フィールド含む）
{ id, title, src, artist?, color?, tier, createdAt, updatedAt }
```
**Warning signs:** TypeScriptエラー "Property 'tier' does not exist on type 'Track'"

## Code Examples

Verified patterns from official sources:

### tRPC Public Query with Input
```typescript
// Source: 既存コードベース (src/app/routers/todos.ts)
import { z } from 'zod'
import { router, publicProcedure } from './context'
import { eq } from 'drizzle-orm'

export const bgmRouter = router({
  getAll: publicProcedure
    .input(z.object({
      tier: z.enum(['free', 'premium']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { db } = ctx

      let query = db.select().from(ctx.schema.bgmTracks)

      if (input?.tier) {
        query = query.where(eq(ctx.schema.bgmTracks.tier, input.tier))
      }

      const tracks = await query

      return tracks.map(track => ({
        ...track,
        src: `/api/bgm/${track.filename}`,
      }))
    }),
})
```

### Zod Schema for BGM Track
```typescript
// Source: 既存コードベース (src/app/routers/_shared.ts)
import { z } from 'zod'

export const bgmTrackSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  src: z.string().url(),
  artist: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  tier: z.enum(['free', 'premium']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type BgmTrack = z.infer<typeof bgmTrackSchema>
```

### Drizzle Select with Optional Where
```typescript
// Source: Drizzle ORM公式 + 既存コードベース
import { eq } from 'drizzle-orm'

// フィルタなし
const allTracks = await db.select().from(schema.bgmTracks)

// フィルタあり
const freeTracks = await db.select()
  .from(schema.bgmTracks)
  .where(eq(schema.bgmTracks.tier, 'free'))

// 条件付きフィルタ
let query = db.select().from(schema.bgmTracks)
if (tierFilter) {
  query = query.where(eq(schema.bgmTracks.tier, tierFilter))
}
const tracks = await query
```

### Router Integration
```typescript
// Source: 既存コードベース (src/app/routers/root.ts)
import { router } from './context'
import { bgmRouter } from './bgm'

export const appRouter = router({
  // 既存ルーター
  todos: todosRouter,
  pomodoro: pomodoroRouter,
  // 新規追加
  bgm: bgmRouter,
})
```

### Client-side Usage (Phase 5準備)
```typescript
// Source: tRPC React Queryパターン（Phase 5で実装）
import { trpc } from '@/utils/trpc'

export function useBgm() {
  const { data: tracks, isLoading, error } = trpc.bgm.getAll.useQuery()

  return {
    tracks: tracks ?? [],
    isLoading,
    error,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| REST API /api/bgm/tracks | tRPC bgm.getAll | 2024-11 (tRPC v11) | 型安全性、自動スキーマ生成、バリデーション |
| 手動JSONパース | superjson transformer | tRPC v10+ | Date型自動変換、シリアライゼーションの一元管理 |
| SQL文字列構築 | Drizzle ORM query builder | 2023+ | SQLインジェクション防止、型安全なクエリ |

**Deprecated/outdated:**
- REST API: tRPCに移行済み、混合は避けるべき
- 手動バリデーション: Zod + tRPC inputに統合
- 生SQL: Drizzle ORMの抽象化を使用

## Open Questions

なし。既存コードベースのパターンと公式ドキュメントで全項目が解決済み。

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Playwright |
| Config file | `vitest.config.ts` / `playwright.config.ts` |
| Quick run command | `npm test` (Vitest unit tests) |
| Full suite command | `npm run test:e2e` (Playwright E2E) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | bgmRouterが定義され、getAllクエリが存在する | unit | `npm test -- bgm.test.ts` | ❌ Wave 0 |
| API-02 | getAllが全トラックを返す（tierフィルタ付き） | unit | `npm test -- bgm.test.ts` | ❌ Wave 0 |
| API-02 | tierフィルタが正しく動作する | unit | `npm test -- bgm.test.ts` | ❌ Wave 0 |
| API-02 | レスポンスにsrcフィールドが含まれる | unit | `npm test -- bgm.test.ts` | ❌ Wave 0 |
| API-01 | ゲストユーザーがBGMを取得できる | e2e | `npm run test:e2e -- bgm.spec.ts` | ✅ 既存（拡張必要） |

### Sampling Rate
- **Per task commit:** `npm test` (Vitest単体テスト)
- **Per wave merge:** `npm run test:e2e` (Playwright E2Eテスト)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/bgm.test.ts` — bgmRouterの単体テスト（API-01, API-02）
  - getAllが全トラックを返す
  - tierフィルタが正しく動作する
  - srcフィールドが正しく生成される
  - 空配列が正しく返される
  - DBエラー時のエラーハンドリング
- [ ] `tests/e2e/bgm-api.spec.ts` — BGM APIのE2Eテスト（拡張）
  - ゲストモードでBGM取得
  - ログイン状態でBGM取得
  - tRPCエンドポイント `/api/trpc/bgm.getAll` の直接呼び出し

**注:** 既存のE2Eテスト（`tests/e2e/bgm.spec.ts`）はUIレベルのテストで、API直接呼び出しのテストは別途追加が必要。

## Sources

### Primary (HIGH confidence)
- `/Users/koshiro/develop/pomdo/src/app/routers/todos.ts` — 既存のtRPCルーターパターン（getAll query）
- `/Users/koshiro/develop/pomdo/src/app/routers/context.ts` — publicProcedure定義
- `/Users/koshiro/develop/pomdo/src/app/routers/root.ts` — ルーター統合パターン
- `/Users/koshiro/develop/pomdo/src/app/routers/_shared.ts` — Zodスキーマパターン
- `/Users/koshiro/develop/pomdo/functions/lib/schema.ts` — bgmTracksテーブル定義
- `/Users/koshiro/develop/pomdo/src/hooks/useBgm.ts` — 既存Track型とsrcフィールド要件
- `/Users/koshiro/develop/pomdo/tests/e2e/bgm.spec.ts` — 既存E2Eテストパターン
- `/Users/koshiro/develop/pomdo/vitest.config.ts` — Vitest設定

### Secondary (MEDIUM confidence)
- [tRPC v11 Documentation](https://trpc.io/docs) — publicProcedure, query, input patterns（既存コードベースで検証済み）
- [Drizzle ORM PostgreSQL Documentation](https://orm.drizzle.team/docs/overview) — select(), where(), eq()（既存コードベースで検証済み）
- [Zod Documentation](https://zod.dev/) — スキーマ定義とバリデーション（既存コードベースで検証済み）

### Tertiary (LOW confidence)
- なし（WebSearchは結果なし。既存コードベースと公式ドキュメントで十分）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - インストール済みバージョンを確認し、既存コードベースで検証
- Architecture: HIGH - 既存ルーターパターン（todosRouter）を分析し、適用可能
- Pitfalls: HIGH - 既存のtRPC/Drizzle使用パターンから一般的な問題を抽出

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (30日 - 安定したライブラリのため)
