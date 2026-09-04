# Phase 4: BGM API - Write - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

管理者がBGMを追加・削除・更新できるAPIを実装する。tRPC mutationでR2へのファイルアップロード、DBのトラック情報操作を行う。

音源ファイルはR2バケット`pomdo-bgm`に保存、DBにはトラック情報（title, artist, color, filename, tier）を保存する。

</domain>

<decisions>
## Implementation Decisions

### ファイルアップロード方式

- **方式**: tRPC mutation（Base64エンコード）
- **理由**: 実装がシンプル、既存の`adminProcedure`がそのまま使える、型安全
- **ファイルサイズ**: 10MB上限 → Base64で約13MB
- **将来の拡張性**: 複数ファイル同時アップロードが必要ならHono REST方式に移行

**実装内容:**
```
create(input: { fileBase64: string, title, artist?, color?, tier? })
filenameはサーバー側で自動生成（UUID）
```

### バリデーション

- **場所**: クライアント + サーバー両方
- **ファイルサイズ**: 10MB上限
- **文字数制限**: title 32文字、artist 32文字（DBスキーマ準拠）

**理由**: UX向上（クライアント事前チェック）+ セキュリティ（サーバー再チェック）

### ファイル名生成

- **方式**: 自動生成（UUID + `.mp3`）
- **形式**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.mp3`
- **衝突時**: 衝突しない（UUIDの特性）

**理由**: ユーザーはtitleのみ入力すればOK、実装シンプル、管理画面でtitle表示されるためファイル名の可読性は不要

### update mutation

- **更新可能フィールド**: title, artist, color, tier
- **更新不可フィールド**: id, filename, createdAt, updatedAt
- **ファイル置換**: 別途検討（このフェーズでは実装しない）

### delete mutation

- **削除対象**: DBレコード + R2ファイル両方
- **順序**: DB削除 → R2削除
- **R2削除失敗時**: DB削除は進める（整合性優先、ゴミは手動で対処）

**理由**: ゴミデータを残さない、整合性を維持

### エラーハンドリング

- **方式**: 原因ごとに個別の`TRPCError`をthrow
- **エラーメッセージ**: 日本語で具体的な原因を説明

**エラーパターン:**
- ファイルサイズ超過: `BAD_REQUEST` / "ファイルサイズは10MB以下にしてください"
- R2アップロード失敗: `INTERNAL_SERVER_ERROR` / "ファイルのアップロードに失敗しました"
- トラック不在: `NOT_FOUND` / "トラックが見つかりません"

### Claude's Discretion

- ソート順序の指定（作成日順、タイトル順等）
- レスポンスのキャッシュ戦略
- Zodスキーマの詳細定義
- エラーメッセージの文言調整

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API要件

- `.planning/REQUIREMENTS.md` §Backend API — API-03, API-04, API-05, API-06, API-07要件定義

### データベース

- `.planning/phases/01-database/01-CONTEXT.md` — bgm_tracksテーブル構造
- `functions/lib/schema.ts` — bgmTracksスキーマ定義（id, title, artist, color, filename, tier, createdAt, updatedAt）

### 認証

- `.planning/phases/02-authentication/02-CONTEXT.md` — adminロール、adminProcedureミドルウェア
- `src/app/routers/context.ts` — adminProcedure実装

### 既存実装

- `src/app/routers/bgm.ts` — getAllクエリ実装済み、ルーター構造
- `src/app/routers/todos.ts` — create/update/delete mutationパターン参考
- `src/app/routers/_shared.ts` — Zodスキーマ定義パターン
- `functions/api/bgm.ts` — R2取得API（R2バケット操作参考）

### R2操作

- `functions/api/[[route]].ts` — Bindings定義（BGM_BUCKET: R2Bucket）
- Cloudflare R2ドキュメント — put(), delete()メソッド

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **bgmRouter**: `src/app/routers/bgm.ts` に定義済み（getAllのみ）
  - `router({ getAll: publicProcedure... })`
  - ここにcreate/update/deleteを追加

- **adminProcedure**: `src/app/routers/context.ts` に実装済み
  ```typescript
  export const adminProcedure = t.procedure.use(({ ctx, next }) => {
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN', message: '管理者権限が必要です' })
    }
    return next()
  })
  ```

- **tRPCミドルウェア**: publicProcedure, protectedProcedure, adminProcedure
- **R2バケット**: `functions/api/[[route]].ts` で`BGM_BUCKET: R2Bucket`バインding済み

- **todosRouterパターン**: create/update/deleteの実装参考
  ```typescript
  create: protectedProcedure.input(newTodoSchema).mutation(async ({ ctx, input }) => {
    const [created] = await db.insert(ctx.schema.todos).values(...).returning()
    return created
  })
  ```

### Established Patterns

- PostgreSQL方言（`drizzle-orm/pg-core`）
- スキーマファイル: `./functions/lib/schema.ts`
- tRPCルーター配置: `src/app/routers/{name}.ts`
- Zodスキーマ: `src/app/routers/_shared.ts` で型定義
- エラーハンドリング: `TRPCError`使用

### Integration Points

- `src/app/routers/bgm.ts` — create/update/delete mutation追加
- `src/app/routers/_shared.ts` — create/update/deleteのinputスキーマ追加
- `src/app/routers/context.ts` — adminProcedure使用（既存）

</code_context>

<specifics>
## Specific Ideas

- filenameはサーバー側でUUIDで自動生成（例: `a1b2c3d4-e5f6-7890-abcd-ef1234567890.mp3`）
- ユーザーはtitleのみ入力すればOK
- ファイルサイズは10MB上限（Base64で約13MB）
- titleは32文字、artistは32文字（DBスキーマ準拠）
- tierフィールドのデフォルト値は`"free"`
- R2バケット名は`pomdo-bgm`（既存）
- エラーメッセージは日本語で具体的に

</specifics>

<deferred>
## Deferred Ideas

- ファイル置換機能（createで上書き、またはreplace mutation）— 必要時に追加
- 複数ファイル同時アップロード — 必要ならHono REST方式に移行
- バッチ削除 — 単一削除で十分

</deferred>

---

*Phase: 04-bgm-api-write*
*Context gathered: 2026-03-20*
