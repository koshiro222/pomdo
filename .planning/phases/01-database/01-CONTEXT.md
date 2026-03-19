# Phase 1: Database - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

BGMトラック管理に必要なデータベース基盤を構築する。`bgm_tracks` テーブルを作成し、Drizzleスキーマ定義とマイグレーションを完了する。

音源ファイルは既存のR2バケット `pomdo-bgm` に保存済みで、DBにはトラック情報のみを保存する。

</domain>

<decisions>
## Implementation Decisions

### テーブル設計

**カラム構造:**
- `id`: uuid, PRIMARY KEY, defaultRandom()
- `title`: text(32), NOT NULL
- `artist`: text(32), OPTIONAL
- `color`: text, OPTIONAL — hex形式（例: `#3b82f6`）
- `filename`: text(32), UNIQUE, NOT NULL — R2キー（例: `bgm/lofi-01.mp3`）
- `tier`: text, enum(["free", "premium"]), NOT NULL, default("free")
- `createdAt`: timestamp, NOT NULL, defaultNow()
- `updatedAt`: timestamp, NOT NULL, defaultNow()

**既存トラックの移行データ:**
- title/artist/color: 既存値を維持
  - "Lo-Fi Study 01", "Chill Beats", "#3b82f6"
  - "Lo-Fi Study 02", "Relax Sounds", "#8b5cf6"
- tier: 既存トラックは `"free"` 固定
- filename: R2キー形式（`bgm/lofi-01.mp3`）

### マイグレーション戦略

- **既存トラック移行**: マイグレーションSQL内にINSERT文を含める（2件）
- **ファイル名**: `0005_bgm_tracks.sql`（既存連番継続: 0000〜0004が存在）
- **適用タイミング**: 即時適用（本番DBへ）
- **将来拡張**: 非破壊的マルチステップマイグレーション

### スキーマ検証

- **確認方法**: Drizzle Studio (`npx drizzle-kit studio`)
- **接続先**: 本番環境（DATABASE_URL）
- **テストデータ**: 既存トラック2件
- **制約検証**: 制約違反テスト実施（UNIQUE, NOT NULL, enum）
- **結果保存**: なし

### Claude's Discretion

- マイグレーションSQLの詳細なフォーマット
- Drizzle Studioの具体的な操作手順

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### データベース

- `.planning/REQUIREMENTS.md` §Database — DB-01, DB-02, DB-03要件定義
- `.planning/REQUIREMENTS.md` §Frontend - Player — 既存トラック定義(`useBgm.ts`)

### プロジェクト設定

- `drizzle.config.ts` — Drizzle構成（schema: `./functions/lib/schema.ts`, out: `./drizzle`）
- `functions/lib/schema.ts` — 既存テーブル定義パターン（users, sessions, accounts, todos, pomodoro_sessions）

### 既存実装

- `src/hooks/useBgm.ts` — 現在のハードコードされたトラック定義とTrack型
- `.planning/PROJECT.md` — R2バケット `pomdo-bgm` 既存情報、Edge Runtime制約

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Drizzleスキーマパターン**: `functions/lib/schema.ts` に既存の `pgTable` 定義
  - `pgTable()`, `uuid()`, `text()`, `timestamp()`, `.notNull()`, `.defaultRandom()`
  - 命名規則: `snake_case` カラム名（例: `created_at`）

- **マイグレーション構造**: `drizzle/*.sql` ファイル
  - 既存: `0000_calm_shriek.sql` 〜 `0004_migrate_google_users_to_accounts.sql`
  - `meta/` ディレクトリにメタデータ

- **既存トラック定義**: `src/hooks/useBgm.ts`
  ```typescript
  export type Track = {
    id: string
    title: string
    src: string
    artist?: string
    color?: string
  }
  ```

### Established Patterns

- PostgreSQL方言（`drizzle-orm/pg-core`）
- スキーマファイル: `./functions/lib/schema.ts`
- マイグレーション出力先: `./drizzle`
- マイグレーション生成: `npm run db:generate`
- マイグレーション適用: `npm run db:migrate`

### Integration Points

- 新規テーブル: `functions/lib/schema.ts` に `bgm_tracks` を追加
- 既存テーブルとは独立（外部キーなし）
- tRPCルーターとの連携は Phase 3/4

</code_context>

<specifics>
## Specific Ideas

- 既存トラックのfilenameは `bgm/lofi-01.mp3`, `bgm/lofi-02.mp3` とする（R2キー形式）
- colorは既実装と互換のhex形式（`#3b82f6`）
- Drizzle Studioは `npx drizzle-kit studio` で起動、本番DBに接続して確認

</specifics>

<deferred>
## Deferred Ideas

なし — データベース設計の範囲内でのみ議論

</deferred>

---

*Phase: 01-database*
*Context gathered: 2026-03-20*
