# Phase 3: BGM API - Read - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

BGMトラック取得APIを実装し、既存プレイヤーの移行準備を整える。tRPCルーター `bgm` を作成し、`getAll` クエリで全トラックを取得可能にする。

音源ファイルは既存のR2バケット `pomdo-bgm` に保存済みで、DBにはトラック情報のみを保存する。

</domain>

<decisions>
## Implementation Decisions

### アクセス制限

- **方式**: publicProcedureを使用
- **認証不要**: ログインなしで全員（ゲスト含む）がBGM取得可能
- **理由**: BGMは全ユーザー共通の集中作業用リソース。ゲストモードが既存機能のため。

### レスポンス形式

- **型互換**: 既存 `Track` 型（`useBgm.ts`）と完全互換
- **src生成**: DBの `filename` から `/api/bgm/filename` を生成
- **返却フィールド**: `{ id, title, src, artist?, color?, tier, createdAt, updatedAt }`

**既存Track型との対応:**
```typescript
// 既存（useBgm.ts）
{ id, title, src, artist?, color? }

// API返却（追加フィールド含む）
{ id, title, src, artist?, color?, tier, createdAt, updatedAt }
```

### フィルタリング（tier）

- **tierパラメータ**: オプション
- **未指定時**: 全トラック（free + premium）返却
- **指定時**: 指定tierのみ返却（例: `tier?: "free" | "premium"`）
- **理由**: 将来の有料プラン対応のため、フィルタ機能を用意。現在は全トラック公開。

### Claude's Discretion

- エラーハンドリングの詳細（DB接続エラー等）
- ソート順序の指定（作成日順、タイトル順等）
- レスポンスのキャッシュ戦略
- Zodスキーマの詳細定義

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API要件

- `.planning/REQUIREMENTS.md` §Backend API — API-01, API-02要件定義

### データベース

- `.planning/phases/01-database/01-CONTEXT.md` — bgm_tracksテーブル構造、既存トラック移行データ
- `functions/lib/schema.ts` — bgm_tracksスキーマ定義（id, title, artist, color, filename, tier, createdAt, updatedAt）

### 既存実装

- `src/hooks/useBgm.ts` — 既存Track型定義、ハードコードされたTRACKS配列
- `src/app/routers/todos.ts` — tRPCルーター実装パターン参考（getAll query構造）
- `functions/api/bgm.ts` — BGM配信API（R2からストリーミング、`/api/bgm/filename`）

### tRPC設定

- `src/app/routers/context.ts` — publicProcedure, protectedProcedureミドルウェア定義
- `src/app/routers/root.ts` — ルーター統合パターン

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **bgmTracksスキーマ**: `functions/lib/schema.ts` に定義済み
  - `pgTable("bgm_tracks", ...)`
  - カラム: id, title, artist, color, filename, tier, createdAt, updatedAt

- **tRPCミドルウェア**: `src/app/routers/context.ts` に `publicProcedure` 実装済み
  - `initTRPC.context<Context>().create({ transformer: superjson })`

- **既存ルーターパターン**: `src/app/routers/todos.ts` が `getAll` クエリ実装参考
  ```typescript
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const todos = await db.select().from(ctx.schema.todos).where(...)
    return todos
  })
  ```

### Established Patterns

- PostgreSQL方言（`drizzle-orm/pg-core`）
- tRPCルーター配置: `src/app/routers/{name}.ts`
- ルーター統合: `src/app/routers/root.ts` で `router({ bgm: bgmRouter })`
- Zodスキーマ: `src/app/routers/_shared.ts` で型定義

### Integration Points

- 新規ルーター作成: `src/app/routers/bgm.ts`
- `src/app/routers/root.ts` に `bgm: bgmRouter` 追加
- Phase 5で `useBgm.ts` から tRPC `bgm.getAll` 呼び出し

</code_context>

<specifics>
## Specific Ideas

- `src` フィールドは `/api/bgm/filename` 形式（既存BGM配信APIと一致）
- 既存トラックの移行データはPhase 1のマイグレーションで投入済み
- 全ユーザー（ゲスト含む）がBGMを取得・再生できる

</specifics>

<deferred>
## Deferred Ideas

なし — Read APIの範囲内でのみ議論

</deferred>

---

*Phase: 03-bgm-api-read*
*Context gathered: 2026-03-20*
