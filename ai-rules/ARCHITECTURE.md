# アーキテクチャ詳細

## 技術スタック

| 層 | 技術 | 理由 |
|----|------|------|
| フロントエンド | Vite + React + TypeScript | 標準構成 |
| スタイル | Tailwind CSS v4 + shadcn/ui | |
| 状態管理 | Zustand | グローバル状態（auth, timer, todos, ui） |
| API（tRPC） | tRPC v11 + TanStack Query | 型安全なAPI通信 |
| API（REST） | Hono on Cloudflare Pages Functions | 認証・OAuth コールバック用 |
| DB | Neon (サーバーレス PostgreSQL) | 無料枠・スケーラブル |
| ORM | Drizzle ORM | TypeScript 親和性・SQL ライク |
| ホスティング | Cloudflare Pages | 静的 + Functions を一体で配信 |
| 認証 | Google OAuth + JWT (HS256, Web Crypto API) | |

## ディレクトリ構成

```
functions/
  api/
    [[route]].ts          # Hono REST API エントリポイント（basePath: /api）
    trpc/
      [[route]].ts        # tRPC エントリポイント（endpoint: /api/trpc）
  lib/
    db.ts                 # Drizzle DB クライアント生成
    schema.ts             # DB スキーマ定義
    hmac.ts               # HMAC ユーティリティ
  middleware/
    auth.ts               # JWT 検証ミドルウェア
src/
  app/
    routers/              # tRPC ルーター定義（auth, todos, pomodoro, root）
    types.ts
  core/
    store/                # Zustand ストア（auth, timer, todos, ui）
  hooks/                  # カスタムフック（useTodos, usePomodoro, useTimer, useBgm, useAuth）
  components/             # UI コンポーネント
  lib/
    trpc.tsx              # tRPC クライアント設定
    utils.ts
public/
  audio/                  # BGM 音源（.gitignore 対象、手動配置）
  bg/                     # 背景画像（.gitignore 対象、手動配置）
```

## API 2系統の使い分け

| 系統 | エンドポイント | 用途 |
|------|--------------|------|
| REST (Hono) | `/api/auth/*`, `/api/health` | Google OAuth コールバック、ヘルスチェック |
| tRPC | `/api/trpc/*` | Todo CRUD、Pomodoro、auth.me |

tRPC はフロントエンドから `httpBatchLink` でバッチリクエストされる（`batch=1` クエリパラメータ）。

## 重要な設計決定と理由

### 認証: Web Crypto API 直接実装

`@hono/oauth-providers` は Node.js 依存のため Edge Runtime 不可。
JWT 署名・検証は `crypto.subtle` を使って `functions/lib/hmac.ts` に実装。

### Neon 接続: HTTP ドライバー

Edge Runtime は TCP ソケット不可。`drizzle-orm/neon-http` を使う。

```typescript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const db = drizzle(neon(env.DATABASE_URL))
```

### ゲストモード

未ログインユーザーも全機能を使える。データは localStorage に保存。
ログイン後にサーバーへ移行するマイグレーションダイアログを表示する。
`useTodos` フックが認証状態に応じてストレージ先を切り替える。

### BGM

音源は `public/audio/` に配置し Cloudflare Pages で静的配信。
ブラウザの Autoplay Policy により、BGM はユーザー操作（タイマー開始等）のイベントハンドラー内でのみ再生開始できる。

## 環境変数

```
DATABASE_URL=           # Neon から取得
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=             # 64 文字以上のランダム文字列
GOOGLE_REDIRECT_URI=http://localhost:8788/api/auth/google/callback
APP_URL=http://localhost:5173
```

ローカル: `.dev.vars` / 本番: Cloudflare Pages ダッシュボードのシークレット

## DBスキーマ（概要）

```sql
users             -- Google OAuth ユーザー（id, google_id, email, name, ...）
todos             -- タスク（id, user_id nullable, title, completed, ...）
pomodoro_sessions -- セッション記録（id, user_id, todo_id nullable, type, duration, ...）
```
