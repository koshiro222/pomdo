# Directory Structure

## Overview

Pomdo is a full-stack Cloudflare Pages application. The project uses a monorepo-style layout where frontend code lives in `src/` and backend (Cloudflare Functions) in `functions/`.

## Top-Level Layout

```
pomdo/
├── src/                    # React frontend (Vite)
├── functions/              # Cloudflare Pages Functions (backend API)
├── tests/                  # E2E tests (Playwright)
├── drizzle/                # DB migration files
├── public/                 # Static assets (images, audio)
├── ai-rules/               # AI assistant rules & architecture docs
├── .planning/              # GSD planning artifacts
├── dist/                   # Build output (gitignored)
├── index.html              # SPA entry point
├── vite.config.ts          # Vite build configuration
├── vitest.config.ts        # Unit test configuration
├── playwright.config.ts    # E2E test configuration
├── wrangler.toml           # Cloudflare Pages deployment config
├── drizzle.config.ts       # Drizzle ORM config
├── tsconfig.json           # TypeScript root config
├── tsconfig.app.json       # Frontend TypeScript config
└── package.json
```

## Frontend: `src/`

```
src/
├── main.tsx                # React app entry point
├── App.tsx                 # Root component (layout, providers)
├── app/
│   └── routers/            # tRPC client-side router definitions
│       ├── root.ts         # Root router (combines all routers)
│       ├── todos.ts        # Todo tRPC procedures (client)
│       ├── pomodoro.ts     # Pomodoro tRPC procedures (client)
│       ├── context.ts      # tRPC context type
│       └── _shared.ts      # Shared types/utilities
├── components/
│   ├── auth/
│   │   └── LoginButton.tsx
│   ├── bgm/
│   │   └── BgmPlayer.tsx
│   ├── dialogs/
│   │   ├── LoginDialog.tsx
│   │   └── MigrateDialog.tsx  # Guest→auth data migration
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── pages/
│   │   ├── ResetPasswordPage.tsx
│   │   └── VerifyEmailPage.tsx
│   ├── stats/
│   │   └── StatsCard.tsx
│   ├── tasks/
│   │   └── CurrentTaskCard.tsx
│   ├── timer/
│   │   ├── TimerDisplay.tsx
│   │   ├── TimerControls.tsx
│   │   └── TimerRing.tsx
│   ├── todos/
│   │   ├── TodoInput.tsx
│   │   ├── TodoItem.tsx
│   │   └── TodoList.tsx
│   └── ui/
│       └── checkbox.tsx    # shadcn/ui components
├── core/
│   └── store/              # Zustand global state stores
│       ├── auth.ts         # Authentication state
│       ├── timer.ts        # Pomodoro timer state (persisted)
│       ├── todos.ts        # Todo list state (persisted)
│       └── ui.ts           # UI/dialog state
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Authentication actions
│   ├── useBgm.ts           # BGM playback control
│   ├── usePomodoro.ts      # Pomodoro session logic
│   ├── useTimer.ts         # Timer countdown logic
│   ├── useTimer.test.ts    # Co-located unit test
│   └── useTodos.ts         # Todo CRUD operations
├── lib/
│   ├── auth.ts             # Auth utility helpers
│   ├── storage.ts          # localStorage guest data helpers
│   ├── trpc.tsx            # tRPC client setup
│   ├── utils.ts            # General utilities (cn, etc.)
│   └── animation.ts        # Animation helpers
└── test/
    └── setup.ts            # Vitest global setup (jsdom, localStorage mock)
```

## Backend: `functions/`

Cloudflare Pages Functions — runs on Cloudflare Workers (Edge Runtime).

```
functions/
├── api/
│   ├── [[route]].ts        # Catch-all REST API via Hono (basePath: /api)
│   │                       # Handles: health check, auth, bgm proxy
│   ├── auth.ts             # Google OAuth callback & JWT issuance
│   ├── bgm.ts              # BGM audio proxy (Cloudflare R2 planned)
│   ├── pomodoro.ts         # Pomodoro REST endpoints (legacy)
│   ├── todos.ts            # Todos REST endpoints (legacy)
│   └── trpc/
│       └── [[route]].ts    # tRPC server adapter (endpoint: /api/trpc)
├── lib/
│   ├── auth.ts             # JWT verify helper
│   ├── db.ts               # Drizzle + Neon HTTP client setup
│   └── schema.ts           # Drizzle ORM table definitions
└── middleware/
    └── auth.ts             # Hono auth middleware
```

## Tests: `tests/`

```
tests/
├── e2e/                    # Playwright E2E tests
│   ├── auth.spec.ts        # Google OAuth login flow
│   ├── bgm.spec.ts         # BGM player
│   ├── migration.spec.ts   # Guest→auth data migration
│   ├── timer.spec.ts       # Pomodoro timer
│   └── todo.spec.ts        # Todo CRUD
├── helpers/
│   └── auth.ts             # E2E auth helpers (signIn, cleanupTodos)
└── global-setup.ts         # Playwright global setup
```

## Database: `drizzle/`

```
drizzle/
├── meta/                   # Drizzle migration metadata
└── *.sql                   # Migration SQL files
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `wrangler.toml` | Cloudflare Pages project name, build output dir, compatibility date |
| `vite.config.ts` | SPA build, path alias `@` → `src/` |
| `vitest.config.ts` | Unit test: jsdom env, globals, coverage |
| `playwright.config.ts` | E2E: chromium/firefox/webkit, baseURL 5173 |
| `drizzle.config.ts` | DB connection, schema path |
| `components.json` | shadcn/ui configuration |

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| React components | PascalCase | `TodoItem.tsx`, `TimerDisplay.tsx` |
| Hooks | camelCase with `use` prefix | `useTimer.ts`, `useBgm.ts` |
| Stores | camelCase with `use` + `Store` suffix | `useTimerStore`, `useTodosStore` |
| Types/interfaces | PascalCase | `SessionType`, `Todo` |
| API routes | kebab-case URL paths | `/api/trpc`, `/api/auth/google` |
| E2E test files | kebab-case + `.spec.ts` | `timer.spec.ts` |
| Unit test files | co-located + `.test.ts` | `useTimer.test.ts` |

## Where to Add New Code

| What | Where |
|------|-------|
| New React component | `src/components/{feature}/` |
| New Zustand store | `src/core/store/{name}.ts` |
| New custom hook | `src/hooks/use{Name}.ts` |
| New tRPC procedure | `src/app/routers/{name}.ts` + `functions/api/trpc/[[route]].ts` |
| New REST endpoint | `functions/api/[[route]].ts` (Hono route) |
| New DB table | `functions/lib/schema.ts` + `npm run db:generate` |
| New E2E test | `tests/e2e/{feature}.spec.ts` |
| New unit test | Co-locate with source: `src/hooks/use{Name}.test.ts` |
| shadcn/ui component | `src/components/ui/{name}.tsx` |
