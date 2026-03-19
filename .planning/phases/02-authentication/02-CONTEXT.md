# Phase 2: Authentication - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

管理者権限を判定し、API の保護を可能にする。Better Auth で admin ロールを実装し、tRPC ミドルウェアで権限チェックを行う。

このフェーズでは認証機能の追加ではなく、既存の Better Auth 設定への role 機能の統合が中心。

</domain>

<decisions>
## Implementation Decisions

### adminロールの実装方法

- **方式**: Better Auth 組み込み role 機能を使用
- **role 値**: `admin` / `user` の2値（シンプルな2種類）
- **データ型**: enum('admin', 'user') — Drizzle で型安全に定義
- **デフォルト**: 新規ユーザーは全て `'user'` ロールで開始

**実装内容**:
- `users` テーブルに `role` カラムを追加
- Better Auth の `user` schema に `role` フィールドを追加
- Better Auth 側で role 許可設定（permissions）を実装

### 初期管理者の登録方法

- **方式**: マイグレーション SQL に含める（バージョン管理可能、再現可能）
- **対象**: 開発者の Google アカウントメールアドレスを admin に固定
- **2人目以降**: 今回は実装しない（DB 直接操作や別フェーズで対応）

**実装内容**:
- マイグレーション SQL 内で特定メールアドレスのユーザーを admin に更新
- ロール追加と初期管理者登録を同一マイグレーションで完結

### tRPCでの権限チェック構造

- **方式**: ミドルウェアで一元管理
- **プロシージャ構造**: `adminProcedure`（管理者用）と `protectedProcedure`（ログインユーザー用）の2種類
- **エラー処理**: 未認証時は `UNAUTHORIZED(401)`、非管理者時は `FORBIDDEN(403)` を使い分け

**実装内容**:
- tRPC ミドルウェアで `ctx.user.role` をチェック
- `adminProcedure` は role === 'admin' のみ通過
- `protectedProcedure` はログイン済みユーザーなら通過
- 権限なし時は `TRPCError` を throw

### クライアント側の権限参照

- **方式**: useAuth フックを拡張し、クライアント側でも role を保持
- **UI 表示**: 条件レンダリングで管理ボタンを表示
- **型安全**: authClient の型定義を拡張し、role を TypeScript で型安全に参照

**実装内容**:
- `src/lib/auth.ts` または新規 hooks で `useAuth` を拡張
- `authClient.signIn/useSession` の戻り値型に `role` を追加
- `isAdmin()` 判定関数を用意し、Header 等で条件レンダリング

### Claude's Discretion

- Better Auth の role/permission 設定の詳細なオプション
- マイグレーション SQL のフォーマット
- tRPC ミドルウェアの実装詳細
- クライアント側型拡張の具体的な実装方法

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 認証要件

- `.planning/REQUIREMENTS.md` §Authentication — AUTH-01, AUTH-02, AUTH-03, API-08要件定義
- `.planning/REQUIREMENTS.md` §Backend API — 管理者のみのAPIエンドポイント定義

### 既存実装

- `functions/lib/auth.ts` — Better Auth インスタンス作成パターン
- `functions/middleware/auth.ts` — Hono ミドルウェアパターン（セッション確認）
- `functions/lib/schema.ts` — Drizzle スキーマ定義パターン（users テーブル）
- `src/app/routers/_shared.ts` — tRPC スキーマ定義パターン

### プロジェクト設定

- `.planning/PROJECT.md` — Better Auth 既存情報、Edge Runtime 制約
- `ai-rules/ARCHITECTURE.md` — プロジェクト全体のアーキテクチャ決定

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Better Auth インスタンス**: `functions/lib/auth.ts` で `createAuthInstance()` として実装済み
  - Google OAuth 設定済み
  - Drizzle アダプタ設定済み
  - 現在は role 機能未使用

- **Hono ミドルウェア**: `functions/middleware/auth.ts` でセッション確認ミドルウェア実装済み
  - `c.set('user', session.user)` パターン

- **Drizzle スキーマ**: `functions/lib/schema.ts` に `users` テーブル定義済み
  - `pgTable()`, `uuid()`, `text()`, `.notNull()` パターン
  - `snake_case` カラム名

- **tRPC ルーター**: `src/app/routers/` に既存ルーター
  - `root.ts` でルーター統合

### Established Patterns

- PostgreSQL方言（`drizzle-orm/pg-core`）
- スキーマファイル: `./functions/lib/schema.ts`
- マイグレーション出力先: `./drizzle`
- マイグレーション生成: `npm run db:generate`
- マイグレーション適用: `npm run db:migrate`

### Integration Points

- `functions/lib/auth.ts` — Better Auth 設定に role/permission 追加
- `functions/lib/schema.ts` — `users` テーブルに `role` カラム追加
- `src/app/routers/` — `adminProcedure` ミドルウェア新規作成
- `src/lib/auth.ts` — クライアント側 authClient 型拡張

</code_context>

<specifics>
## Specific Ideas

- 開発者のメールアドレスは事前に確認し、マイグレーションにハードコード
- 管理者ボタンは Header コンポーネントに追加、`isAdmin()` で条件レンダリング
- tRPC エラーは日本語メッセージで返す（ユーザー向け）

</specifics>

<deferred>
## Deferred Ideas

- 2人目以降の管理者追加機能 — 将来のフェーズまたは DB 直接操作で対応
- 管理者用の UI によるユーザー権限変更画面 — Phase 6 以降で検討
- 複数ロール（moderator 等）の実装 — 必要時に追加

</deferred>

---

*Phase: 02-authentication*
*Context gathered: 2026-03-20*
