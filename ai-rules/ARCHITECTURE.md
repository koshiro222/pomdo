# アーキテクチャ詳細

## 技術スタック

| 層 | 技術 | 理由 |
|----|------|------|
| フロントエンド | Vite + React + TypeScript | 標準構成 |
| スタイル | Tailwind CSS v4 + shadcn/ui | |
| API | Hono on Cloudflare Pages Functions | 軽量・Edge Runtime 対応 |
| DB | Neon (サーバーレス PostgreSQL) | 無料枠・スケーラブル |
| ORM | Drizzle ORM | TypeScript 親和性・SQL ライク |
| ホスティング | Cloudflare Pages | 静的 + Functions を一体で配信 |
| 認証 | Google OAuth + JWT (HS256, Web Crypto API) | |

## ディレクトリ構成

```
functions/
  api/
    [[route]].ts   # Hono エントリポイント（basePath: /api）
src/
  lib/             # ユーティリティ（JWT, API クライアント等）
  hooks/           # カスタムフック（useTodos, usePomodoro, useTimer, useBgm）
  components/      # UI コンポーネント
public/
  audio/           # BGM 音源（著作権フリー lo-fi）
```

## 重要な設計決定と理由

### 認証: Web Crypto API 直接実装

`@hono/oauth-providers` は内部で Node.js 依存ライブラリを使用しており Edge Runtime で動作しない。
JWT の署名・検証は `crypto.subtle`（Web Crypto API）を使って `functions/lib/jwt.ts` に実装する。

### Neon 接続: HTTP ドライバー

Edge Runtime は TCP ソケットが使えないため `@neondatabase/serverless` の TCP 接続モードは不可。
`drizzle-orm/neon-http` を使う。

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

Cloudflare Pages Functions から参照するため `.dev.vars`（ローカル）と Pages ダッシュボード（本番）に設定する。

## DBスキーマ（概要）

```sql
users           -- Google OAuth ユーザー（id, google_id, email, name, ...）
todos           -- タスク（id, user_id nullable, title, completed, ...）
pomodoro_sessions -- セッション記録（id, user_id, todo_id nullable, type, duration, ...）
```
