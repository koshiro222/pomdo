# STACK.md — Technology Stack

## Language & Runtime
- **TypeScript** 5.9.3 — フロントエンド・バックエンド共通
- **Node.js** — ローカル開発環境（Vite/Wrangler）
- **Cloudflare Workers (Edge Runtime)** — 本番バックエンド実行環境
  - `nodejs_compat` フラグ有効
  - Node.js API（crypto, fs, net）使用不可 → Web Crypto API / Neon HTTP を使用

## Frontend
- **React** 19.2.0 — UIフレームワーク
- **Vite** 7.3.1 — ビルドツール・開発サーバー（ポート5173）
- **Tailwind CSS** 4.2.1 — ユーティリティCSSフレームワーク（@tailwindcss/vite プラグイン）
- **Framer Motion** 12.35.1 — アニメーションライブラリ
- **Radix UI** 1.4.3 — ヘッドレスUIコンポーネント
- **Lucide React** 0.575.0 — アイコンライブラリ
- **class-variance-authority** 0.7.1 — CSSクラス生成
- **tailwind-merge** 3.5.0 — Tailwindクラスマージング
- **clsx** 2.1.1 — 条件付きクラス管理

## State Management
- **Zustand** 5.0.11 — クライアントUI状態管理（persist ミドルウェアで localStorage 永続化）
- **TanStack React Query** 5.90.21 — サーバー状態管理（tRPC と統合）

## Backend
- **Hono** 4.12.3 — Webフレームワーク（Edge Runtime 対応、basePath `/api`）
- **tRPC** 11.0.0 — 型安全API層（`@trpc/server`, `@trpc/react-query`, `@trpc/client`）
- **SuperJSON** 2.2.6 — JSON シリアライザー（Date/Map/Set対応）

## Authentication
- **Better Auth** 1.5.4 — 認証フレームワーク
  - Drizzle ORM アダプター（PostgreSQL）
  - Google OAuth 2.0 プロバイダー
  - メール/パスワード認証（メール送信は未実装 → Issue #120）
  - JWT は `better-auth` 内部で Web Crypto API を使用

## Database
- **PostgreSQL** — リレーショナルDB（Neon サーバーレス）
- **Drizzle ORM** 0.45.1 — TypeScript ORM
  - ドライバ: `drizzle-orm/neon-http`（HTTP経由、Edge Runtime対応）
- **@neondatabase/serverless** 1.0.2 — Neon クライアント
- **Drizzle Kit** 0.31.9 — マイグレーションツール

## Infrastructure
- **Cloudflare Pages** — フロントエンドホスティング + Functions（バックエンド）
- **Cloudflare R2** — BGM音声ファイルストレージ（バケット: `pomdo-bgm`）
- **Wrangler** 4.69.0 — Cloudflare CLI（ローカル開発: ポート8788）

## Testing
- **Vitest** 4.0.18 — ユニットテストランナー
- **@testing-library/react** 16.3.2 — React テストユーティリティ
- **jsdom** 28.1.0 — DOM エミュレータ
- **@vitest/coverage-v8** 4.0.18 — カバレッジ測定
- **Playwright** 1.58.2 — E2Eテスト（Chromium/Firefox/WebKit）

## Dev Tools
- **ESLint** 9.39.1 — TypeScript ESLint推奨 + React Hooks + React Refresh
- **Concurrently** 9.2.1 — 複数プロセス並行実行
- **Shadcn** 3.8.5 — UIコンポーネントCLI

## TypeScript Configuration
```json
// tsconfig.app.json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedSideEffectImports": true,
  "target": "ES2022",
  "module": "ESNext"
}
```

## Path Aliases
```json
"@/*": ["./src/*"]
```

## Key Commands
```bash
npm run dev        # Vite (5173) + Wrangler Pages Dev (8788) 同時起動
npm run dev:vite   # Vite のみ
npm run build      # tsc -b && vite build → dist/
npm test           # Vitest ユニットテスト
npm run db:generate  # Drizzle マイグレーションファイル生成
npm run db:migrate   # マイグレーション適用
```
