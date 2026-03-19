# INTEGRATIONS.md — External Services & APIs

## Google OAuth 2.0
- **用途**: ソーシャルログイン（唯一の実装済みOAuthプロバイダー）
- **実装**: Better Auth の Google プロバイダー（`functions/lib/auth.ts`）
- **フロー**: `authClient.signIn.social({ provider: 'google' })` → `/api/auth/*` → Better Auth → Google → リダイレクト
- **環境変数**:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI` — `http://localhost:8788/api/auth/google/callback`（開発）

## Neon PostgreSQL
- **用途**: メインデータベース（ユーザー・Todo・Pomodoroセッション）
- **プロバイダー**: Neon サーバーレスPostgreSQL
- **リージョン**: `ap-southeast-1.aws.neon.tech`（東南アジア）
- **接続方式**: `drizzle-orm/neon-http`（HTTP API — Edge Runtime のTCP制限を回避）
- **環境変数**: `DATABASE_URL` — `postgresql://...@ap-southeast-1.aws.neon.tech/...`
- **スキーマファイル**: `functions/lib/schema.ts`
- **DB インスタンス**: `functions/lib/db.ts`

### データベーステーブル
| テーブル | 用途 |
|---------|------|
| `users` | ユーザー情報（id, email, name, image） |
| `sessions` | Better Auth セッション管理 |
| `accounts` | OAuthアカウント（Google等） |
| `verifications` | メール検証トークン |
| `todos` | TodoアイテムCRUD |
| `pomodoroSessions` | Pomodoroセッション記録 |

## Cloudflare Pages
- **用途**: フロントエンドホスティング + バックエンドFunctions
- **設定ファイル**: `wrangler.toml`
- **ビルド出力**: `dist/`
- **互換性**: `compatibility_date = "2025-01-01"`, `nodejs_compat` フラグ

## Cloudflare R2 (Object Storage)
- **用途**: BGM音声ファイルの保存・配信
- **バケット名**: `pomdo-bgm`
- **バインディング名**: `BGM_BUCKET`
- **アクセス**: `functions/api/bgm.ts` でR2からストリーミング
- **エンドポイント**: `GET /api/bgm/*`
- **設定** (`wrangler.toml`):
  ```toml
  [[r2_buckets]]
  binding = "BGM_BUCKET"
  bucket_name = "pomdo-bgm"
  ```

## Better Auth
- **用途**: 認証フレームワーク（セッション・JWT・OAuth管理）
- **バージョン**: 1.5.4
- **サーバーインスタンス**: `functions/lib/auth.ts`
- **クライアントインスタンス**: `src/lib/auth.ts`（`createAuthClient`）
- **環境変数**:
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL` — `http://localhost:8788`（開発）
- **エンドポイント**: `/api/auth/*`（Hono REST ルーターが Better Auth にプロキシ）

## 未実装の統合
| サービス | 用途 | 状態 |
|---------|------|------|
| メール送信サービス | パスワードリセット・メール検証 | ⚠️ TODO (Issue #120) — 現状は console.log のみ |

## 環境変数一覧

### バックエンド（`.dev.vars` — Cloudflare Workers）
| 変数 | 用途 |
|------|------|
| `DATABASE_URL` | Neon PostgreSQL接続文字列 |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth シークレット |
| `GOOGLE_REDIRECT_URI` | OAuth コールバックURL |
| `JWT_SECRET` | JWT署名シークレット（レガシー） |
| `BETTER_AUTH_SECRET` | Better Auth シークレット |
| `BETTER_AUTH_URL` | Better Auth ベースURL |
| `APP_URL` | APIベースURL |
| `FRONTEND_URL` | フロントエンドURL（CORS許可） |

### フロントエンド（Vite 環境変数）
- `VITE_API_URL` — APIエンドポイント（存在する場合）

## API エンドポイント構成
```
REST (Hono) — functions/api/[[route]].ts
  POST /api/auth/*          → Better Auth OAuth フロー
  GET  /api/health          → DB接続チェック
  GET  /api/hello           → ヘルスチェック
  GET  /api/bgm/*           → BGM ストリーミング（R2）

tRPC — functions/api/trpc/[[route]].ts
  POST /api/trpc/todos.getAll
  POST /api/trpc/todos.create
  POST /api/trpc/todos.update
  POST /api/trpc/todos.delete
  POST /api/trpc/pomodoro.getSessions
  POST /api/trpc/pomodoro.createSession
  POST /api/trpc/pomodoro.completeSession
```
