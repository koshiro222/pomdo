# STRUCTURE.md — Directory Layout & Organization

## トップレベル構造

```
pomdo/
├── src/                     # フロントエンド（React + TypeScript）
├── functions/               # バックエンド（Cloudflare Pages Functions）
├── tests/                   # E2Eテスト（Playwright）
├── public/                  # 静的アセット
├── ai-rules/                # AIアシスタント向けドキュメント
├── .planning/               # GSD プランニングドキュメント
├── dist/                    # ビルド出力（gitignore）
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── wrangler.toml            # Cloudflare 設定
├── drizzle.config.ts        # Drizzle ORM 設定
├── tsconfig.json
├── tsconfig.app.json        # フロントエンド用
├── tsconfig.node.json       # Node.js ツール用
└── eslint.config.js
```

## src/ — フロントエンド

```
src/
├── main.tsx                 # React エントリーポイント（tRPC Provider ラップ）
├── App.tsx                  # ルートコンポーネント（Bento Grid レイアウト）
│
├── components/              # UIコンポーネント（機能別分類）
│   ├── auth/
│   │   └── LoginButton.tsx
│   ├── bgm/
│   │   └── BgmPlayer.tsx
│   ├── dialogs/
│   │   ├── LoginDialog.tsx  # Google/メール認証ダイアログ
│   │   └── MigrateDialog.tsx # ゲスト→ログイン移行ダイアログ
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── pages/               # ルートページコンポーネント
│   │   ├── VerifyEmailPage.tsx
│   │   └── ResetPasswordPage.tsx
│   ├── stats/
│   │   └── StatsCard.tsx    # 本日のフォーカス分表示
│   ├── tasks/
│   │   └── CurrentTaskCard.tsx
│   ├── timer/
│   │   ├── TimerDisplay.tsx
│   │   ├── TimerControls.tsx
│   │   └── TimerRing.tsx    # SVGリング進捗表示
│   ├── todos/
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   └── TodoInput.tsx
│   └── ui/
│       └── checkbox.tsx     # shadcn/ui ベースの汎用コンポーネント
│
├── hooks/                   # カスタムフック（ビジネスロジック）
│   ├── useAuth.ts           # 認証状態・ログイン/ログアウト
│   ├── useTimer.ts          # タイマー制御・セッション完了コールバック
│   ├── useTodos.ts          # Todo CRUD（ゲスト/ログイン分岐）
│   ├── usePomodoro.ts       # Pomodoroセッション管理
│   └── useBgm.ts            # BGM再生制御
│
├── core/
│   └── store/               # Zustand ストア
│       ├── timer.ts         # タイマー状態（isActive, sessionType, remainingSecs）
│       ├── todos.ts         # ローカルTodo状態
│       ├── ui.ts            # UI状態（toasts）
│       └── auth.ts          # 認証型定義（AuthUser）
│
├── app/
│   └── routers/             # tRPC ルーター定義
│       ├── root.ts          # appRouter（todos + pomodoro）
│       ├── context.ts       # tRPC コンテキスト・protectedProcedure
│       ├── _shared.ts       # 共通 Zod スキーマ
│       ├── todos.ts         # todos ルーター
│       └── pomodoro.ts      # pomodoro ルーター
│
├── lib/                     # ユーティリティ・設定
│   ├── trpc.tsx             # tRPC Provider・QueryClient 初期化
│   ├── auth.ts              # Better Auth クライアントインスタンス
│   ├── storage.ts           # localStorage ラッパー
│   ├── animation.ts         # Framer Motion バリアント定義
│   └── utils.ts             # 汎用ユーティリティ（cn等）
│
└── test/
    └── setup.ts             # Vitest セットアップ（localStorage モック等）
```

## functions/ — バックエンド

```
functions/
├── api/
│   ├── [[route]].ts         # Hono REST ルーター（ベース `/api`）
│   ├── trpc/
│   │   └── [[route]].ts     # tRPC fetchRequestHandler
│   ├── auth.ts              # Better Auth OAuth フロー
│   ├── bgm.ts               # BGM R2 ストリーミング
│   ├── todos.ts             # REST Todo API（未使用 - tRPC優先）
│   └── pomodoro.ts          # REST Pomodoro API（未使用 - tRPC優先）
├── lib/
│   ├── db.ts                # Drizzle ORM + Neon HTTP インスタンス
│   ├── schema.ts            # PostgreSQL スキーマ定義
│   └── auth.ts              # Better Auth サーバーインスタンス
└── middleware/
    └── auth.ts              # 認証ミドルウェア（セッション取得）
```

## tests/ — E2Eテスト

```
tests/
├── global-setup.ts          # テストユーザー作成・初期化
└── e2e/
    ├── helpers/
    │   └── auth.ts          # 認証ヘルパー・テストユーザー定数
    ├── auth.spec.ts         # 認証フローE2E
    ├── timer.spec.ts        # タイマー操作E2E
    ├── todo.spec.ts         # TodoCRUD E2E
    ├── migration.spec.ts    # ゲスト→ログイン移行E2E
    └── bgm.spec.ts          # BGM再生E2E
```

## ai-rules/ — ドキュメント

```
ai-rules/
├── ARCHITECTURE.md          # アーキテクチャ詳細
├── WORK_FLOW.md             # 作業ワークフロー
├── TESTING.md               # テスト手順
├── COMMIT_AND_PR_GUIDELINES.md
├── ISSUE_GUIDELINES.md
└── TROUBLESHOOTING.md
```

## 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| Reactコンポーネント | PascalCase | `TodoItem.tsx`, `BgmPlayer.tsx` |
| カスタムフック | camelCase + `use` プレフィックス | `useTimer.ts`, `useTodos.ts` |
| Zustand ストア | camelCase + `Store` サフィックス | `timer.ts` → `useTimerStore` |
| 型/インターフェース | PascalCase + `interface` | `TimerState`, `UseTimerReturn` |
| ユーティリティ | camelCase | `utils.ts`, `storage.ts` |
| E2Eテスト | kebab-case + `.spec.ts` | `auth.spec.ts` |
| ユニットテスト | 対象ファイル + `.test.ts` | `useTimer.test.ts` |

## Key File Locations

| 目的 | パス |
|------|------|
| Reactエントリー | `src/main.tsx` |
| ルートコンポーネント | `src/App.tsx` |
| tRPC設定 | `src/lib/trpc.tsx` |
| 認証クライアント | `src/lib/auth.ts` |
| localStorage API | `src/lib/storage.ts` |
| tRPCルーター定義 | `src/app/routers/root.ts` |
| Honoバックエンド | `functions/api/[[route]].ts` |
| tRPCバックエンド | `functions/api/trpc/[[route]].ts` |
| DBスキーマ | `functions/lib/schema.ts` |
| Better Auth設定 | `functions/lib/auth.ts` |
| 環境変数（開発） | `.dev.vars`（gitignore） |
| Cloudflare設定 | `wrangler.toml` |
