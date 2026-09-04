# ARCHITECTURE.md — System Architecture

## パターン
**React SPA + Cloudflare Pages Functions（Edge Runtime）**
- フロントエンド: React SPA（Vite ビルド）
- バックエンド: Cloudflare Pages Functions（Hono + tRPC）
- DB: Neon PostgreSQL（Drizzle ORM + HTTP接続）
- 状態管理: Zustand（ローカルUI状態）+ TanStack Query（サーバーキャッシュ）

## レイヤー構造

```
┌─────────────────────────────────────────────────────┐
│                   フロントエンド (React)               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Components  │  │ Custom Hooks │  │  Zustand  │  │
│  │  (UI層)      │  │ (ビジネスロジック)│  │  Stores   │  │
│  └──────┬───────┘  └──────┬───────┘  └────┬──────┘  │
│         │                  │               │          │
│         └──────────────────┴───────────────┘          │
│                            │                          │
│                    tRPC Client                        │
│              (httpBatchLink → /api/trpc)              │
└────────────────────────────┬────────────────────────-─┘
                             │ HTTP
┌────────────────────────────▼────────────────────────-─┐
│              バックエンド (Cloudflare Pages Functions)  │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Hono Router (functions/api/[[route]].ts)  │  │
│  │  /api/auth/* → Better Auth                       │  │
│  │  /api/bgm/*  → R2 Streaming                     │  │
│  │  /api/trpc/* → tRPC Fetch Handler               │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                  │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │           tRPC Router (src/app/routers/)          │  │
│  │   appRouter: { todos, pomodoro }                  │  │
│  │   Context: { user, db, schema }                   │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                  │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │              Drizzle ORM                          │  │
│  │         (drizzle-orm/neon-http)                   │  │
│  └──────────────────┬───────────────────────────────┘  │
└────────────────────-┼──────────────────────────────────┘
                      │ HTTPS (Neon HTTP API)
              ┌───────▼────────┐
              │ Neon PostgreSQL │
              └────────────────┘
```

## データフロー

### 認証フロー
```
ユーザー → LoginButton → authClient.signIn.social({ provider: 'google' })
    → /api/auth/* → Better Auth → Google OAuth
    → セッション作成 → フロントエンドリダイレクト
    → useAuth() で session 取得 → MigrateDialog（ゲストデータがある場合）
```

### ゲスト → ログイン移行
```
ゲストモード: localTodos(localStorage) → ログイン → MigrateDialog
    → "Migrate" 選択: todos.create × N (tRPC) → storage.clearTodos()
    → "Skip & Clear" 選択: ローカルデータ破棄
```

### Todoデータフロー（ログイン状態）
```
TodoInput → useTodos.addTodo() → tRPC todos.create mutation
    → /api/trpc → tRPC Router → Drizzle → Neon DB
    → invalidate todos query → TodoList 再レンダリング
```

### タイマーフロー
```
TimerControls → useTimer.start/pause/reset/skip()
    → useTimerStore（Zustand）状態更新
    → useTimer の setInterval でカウントダウン
    → remainingSecs === 0 → onSessionComplete コールバック
    → usePomodoro.handleSessionComplete() → tRPC pomodoro.createSession mutation
    → 次セッションタイプへ自動遷移
```

### BGMフロー
```
BgmPlayer → useBgm() → HTMLAudioElement
    → /api/bgm/{filename} → Cloudflare R2 → オーディオストリーミング
    → localStorage に再生状態永続化
```

## 二層 API 設計

| API | エンドポイント | 用途 | 認証 |
|-----|------------|------|------|
| REST (Hono) | `/api/auth/*`, `/api/bgm/*`, `/api/health` | OAuth、ファイル配信 | Better Auth |
| tRPC | `/api/trpc/*` | Todo・Pomodoroデータ | protectedProcedure |

## ゲストモード vs ログイン状態の分岐

`useTodos` での実装例:
```typescript
const todos = user
  ? (todosQuery.data ?? [])        // ログイン: tRPC で DB から取得
  : localTodos                      // ゲスト: localStorage から取得

const addTodo = async (title: string) => {
  if (user) {
    await createMutation.mutateAsync({ title })  // DB に追加
  } else {
    storage.addTodo({ title })                   // localStorage に追加
  }
}
```

## Zustand Stores

| Store | ファイル | 状態 | 永続化 |
|-------|---------|------|--------|
| `useTimerStore` | `src/core/store/timer.ts` | isActive, sessionType, remainingSecs, pomodoroCount | sessionType, remainingSecs, pomodoroCount |
| `useTodosStore` | `src/core/store/todos.ts` | localTodos, selectedTodoId, loading, error | localTodos, selectedTodoId |
| `useUiStore` | `src/core/store/ui.ts` | toasts[] | なし |
| `useAuthStore` | `src/core/store/auth.ts` | 型定義のみ（AuthUser型） | N/A |

## tRPC ルーター定義

```
appRouter (src/app/routers/root.ts)
├── todos (src/app/routers/todos.ts)
│   ├── getAll  — Query, protectedProcedure
│   ├── create  — Mutation, input: { title: string }
│   ├── update  — Mutation, input: { id, title?, completed?, completedPomodoros? }
│   └── delete  — Mutation, input: { id: string }
└── pomodoro (src/app/routers/pomodoro.ts)
    ├── getSessions   — Query, 最新30件逆順
    ├── createSession — Mutation, input: { todoId?, type, startedAt, durationSecs }
    └── completeSession — Mutation, input: { id: string }
```

## エントリーポイント

| 対象 | ファイル |
|------|---------|
| フロントエンド React エントリー | `src/main.tsx` |
| メインアプリコンポーネント | `src/App.tsx` |
| tRPC Provider・QueryClient | `src/lib/trpc.tsx` |
| Hono REST バックエンド | `functions/api/[[route]].ts` |
| tRPC バックエンドハンドラー | `functions/api/trpc/[[route]].ts` |
| Better Auth サーバー | `functions/lib/auth.ts` |
| DB インスタンス | `functions/lib/db.ts` |
| DBスキーマ | `functions/lib/schema.ts` |

## コンポーネント階層（概要）

```
App.tsx
├── Header（LoginButton + todayFocusMinutes）
├── main（Bento Grid 12列）
│   ├── Timer Card（8列×2行）→ TimerDisplay + TimerControls
│   ├── Current Task（2列×1行）→ CurrentTaskCard
│   ├── BGM Player（2列×1行）→ BgmPlayer
│   ├── Stats（4列×1行）→ StatsCard
│   └── Todo List（12列×1行）→ TodoList（TodoInput + TodoItem×N）
├── Footer
├── MigrateDialog（ゲスト→ログイン時）
└── ページルート（/verify-email, /reset-password）
```
