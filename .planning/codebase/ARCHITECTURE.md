# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Hybrid client-server with dual-API design

**Key Characteristics:**
- Frontend-first state management with localStorage fallback for guest mode
- Dual API systems: tRPC for domain operations (todos, pomodoro), Hono REST for auth/health
- Zustand stores as single source of truth with persistence middleware
- Type-safe end-to-end with tRPC + TypeScript
- Optional authentication - full app functionality without login

## Layers

**Presentation Layer:**
- Purpose: React components rendering UI with Tailwind CSS + shadcn/ui
- Location: `src/components/`
- Contains: Page layout (Header, Footer), cards (Timer, Todos, Stats, BGM), dialogs (Login, Migrate), individual task/timer controls
- Depends on: Custom hooks (`useTodos`, `useTimer`, `usePomodoro`, `useAuth`, `useBgm`), Zustand stores
- Used by: `src/App.tsx` main layout component

**State Management Layer:**
- Purpose: Centralized client state with localStorage persistence for guest mode
- Location: `src/core/store/`
- Contains: Zustand stores for auth, timer, todos, UI state with `persist` middleware
- Depends on: `src/lib/storage.ts` for localStorage operations
- Used by: Custom hooks that wrap store access and side effects
- Pattern: Stores handle pure state mutations; hooks handle async operations and tRPC calls

**Hook Layer:**
- Purpose: Business logic bridges between components and state/APIs
- Location: `src/hooks/`
- Contains: `useAuth` (session state), `useTodos` (CRUD + guest/server switching), `usePomodoro` (sessions), `useTimer` (interval logic + audio), `useBgm` (playback control)
- Depends on: Zustand stores, tRPC client, storage utilities
- Used by: Components for read/write operations
- Pattern: Switch between localStorage and tRPC API based on authentication state

**API Layer - tRPC:**
- Purpose: Type-safe RPC for domain operations (todos, pomodoro sessions)
- Location:
  - Backend routers: `src/app/routers/` (todos.ts, pomodoro.ts, root.ts, context.ts)
  - Frontend client: `src/lib/trpc.tsx`
  - Endpoint handler: `functions/api/trpc/[[route]].ts`
- Procedures: Protected (authenticated) and public
- Uses: `httpBatchLink` for automatic request batching
- Error handling: All errors wrapped in `TRPCError` (never raw `Error`)

**API Layer - REST (Hono):**
- Purpose: Authentication flows and health checks
- Location: `functions/api/[[route]].ts` (main), individual route handlers
- Endpoints: `/api/auth/*` (Google OAuth callback), `/api/health` (DB connectivity check), `/api/todos`, `/api/pomodoro`, `/api/bgm`
- Middleware: Auth verification via JWT tokens in session headers
- Uses: Web Crypto API (`crypto.subtle`) for JWT operations (Edge Runtime compatible)

**Database Layer:**
- Purpose: PostgreSQL persistence via Neon (serverless)
- Location: `functions/lib/` (db.ts, schema.ts)
- ORM: Drizzle ORM with HTTP driver (`drizzle-orm/neon-http`)
- Schema: `functions/lib/schema.ts` defines `users`, `todos`, `pomodoro_sessions`, `sessions`, `accounts`, `verifications` tables
- Connection: Uses `drizzle-orm/neon-http` (not `neon-serverless`) for Edge Runtime compatibility

**Utilities Layer:**
- Purpose: Shared helpers and configurations
- Location: `src/lib/`
- Contains: `storage.ts` (localStorage wrapper for todos/pomodoro/timer/bgm), `animation.ts` (Framer Motion variants), `auth.ts` (JWT handling), `utils.ts`, `trpc.tsx` (client setup)

## Data Flow

**Unauthenticated (Guest Mode):**

1. User interacts with UI (add todo, start timer)
2. Component calls hook (`useTodos`, `useTimer`)
3. Hook detects `!user` and calls `storage.*` methods
4. `storage.ts` reads/writes localStorage directly
5. Zustand store updated via hook
6. Component re-renders from store

**Authenticated (Server Mode):**

1. User logs in via `/api/auth/google/callback` → JWT session created
2. Component calls hook with `user` present
3. Hook calls `trpc.todos.create.useMutation()` or `trpc.pomodoro.getSessions.useQuery()`
4. tRPC sends batched HTTP POST to `/api/trpc` with auth headers
5. Hono middleware extracts user from JWT token, passes to tRPC context
6. tRPC procedure queries database via Drizzle ORM
7. Response serialized via SuperJSON, returned to client
8. Hook updates Zustand store
9. Component re-renders

**Guest → Authenticated Transition:**

1. User stored data in localStorage (guests can use full app)
2. User clicks login, completes OAuth
3. `App.tsx` detects `wasGuest && user` condition
4. Shows `MigrateDialog` if `localStorage` has todos
5. Dialog calls `useTodos().migrateToApi()`
6. Todos bulk-inserted to database
7. localStorage cleared, Zustand state synced with server data
8. `refetch()` reloads todos from `/api/trpc`

**Timer Completion Flow:**

1. `useTimer` hook runs `setInterval` while `isActive === true`
2. When `remainingSecs === 0`:
   - Calls `onSessionComplete` callback from `App.tsx`
   - Calls `startSession(type, durationSecs)` → creates pomodoro_session record
   - Calls `completeSession(sessionId)` → marks completedAt timestamp
   - Increments `pomodoroCount` in timer store
   - Auto-advances to next session type (work → short_break cycle)
   - Plays notification sound via HTML5 Audio API

## Key Abstractions

**Zustand Store Pattern:**
- Purpose: Single source of truth for UI state with persistence
- Examples: `useTimerStore`, `useTodosStore`, `useAuthStore`
- Pattern: `create` + `persist` middleware; `partialize` selects which state to save
- Mutations: Immer-like handler functions in store definition
- Used by: Hooks that compose multiple stores

**Dual Storage Interface:**
- Purpose: Seamless guest/authenticated mode switching
- `storage.ts` exports singleton object with methods: `getTodos()`, `addTodo()`, `updateTodo()`, `deleteTodo()`, `getPomodoroSessions()`, `addPomodoroSession()`, `updatePomodoroSession()`
- Hooks check `user` presence and route calls to either `storage.*` or `trpc.*`
- localStorage keys: `pomdo_todos`, `pomdo_pomodoro`, `pomdo_timer`, `pomdo_bgm`

**tRPC Procedure with Protected Middleware:**
- Purpose: Type-safe, auto-validated endpoints with auth enforcement
- `protectedProcedure` throws `TRPCError({ code: 'UNAUTHORIZED' })` if `!ctx.user`
- Input validation via Zod schemas in `src/app/routers/_shared.ts`
- Database queries scoped to `user.id` (no cross-user data access)
- Examples: `todos.create`, `todos.update`, `pomodoro.getSessions`

**Session Type Ordering:**
- Purpose: Enforce Pomodoro cycle (4 work + 3 breaks + 1 long break)
- `SESSION_ORDER` array in `useTimerStore`: `['work', 'short_break', 'work', 'short_break', 'work', 'short_break', 'work', 'long_break']`
- `skip()` advances through array with wraparound
- `getNextSessionType()` used to auto-advance after session complete

## Entry Points

**Frontend Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads `/`
- Responsibilities:
  1. Creates React root with StrictMode
  2. Wraps app in `TRPCProvider` (sets up query client + tRPC client)
  3. Renders `App.tsx`

**App Main:**
- Location: `src/App.tsx`
- Triggers: Rendering occurs after TRPCProvider setup
- Responsibilities:
  1. Routes: checks `window.location.pathname` for `/verify-email`, `/reset-password` (render special pages)
  2. Initializes all hooks: `useAuth`, `useTodos`, `useTimer`, `usePomodoro`
  3. Manages guest→login transition via `wasGuest` + `showMigrateDialog`
  4. Renders Bento grid layout with all cards (Timer, Tasks, BGM, Stats, TodoList)
  5. Handles audio notification on session complete

**REST API Entry:**
- Location: `functions/api/[[route]].ts`
- Triggers: HTTP requests to `/api/*`
- Responsibilities:
  1. Creates Hono app with basePath `/api`
  2. Routes: `/hello` (test), `/health` (DB check), `/auth/*`, `/todos/*`, `/pomodoro/*`, `/bgm/*`
  3. Exports `onRequest` handler for Cloudflare Pages Functions

**tRPC API Entry:**
- Location: `functions/api/trpc/[[route]].ts`
- Triggers: HTTP requests to `/api/trpc` with tRPC payload
- Responsibilities:
  1. Creates Hono app with auth middleware
  2. Extracts session user from JWT via `better-auth` (or returns `null`)
  3. Injects `user`, `db`, `schema` into tRPC context
  4. Routes all `/api/trpc/*` requests to `appRouter`

## Error Handling

**Strategy:** Explicit error wrapping with context-appropriate codes

**Patterns:**

1. **tRPC Procedures:** Must throw `TRPCError` with code + message
   - `UNAUTHORIZED` - auth required but user missing
   - `NOT_FOUND` - database record not found
   - Example: `throw new TRPCError({ code: 'NOT_FOUND', message: 'Todo not found' })`
   - ❌ Never: `throw new Error()` (becomes INTERNAL_SERVER_ERROR)

2. **Client Hooks:** Try/catch with fallback to localStorage state
   - Example in `useTodos.addTodo()`: catches error, sets `setError()` for UI display, returns `null`
   - Error state stored in Zustand: `error: string | null`

3. **Storage Operations:** Silent failures with console.error
   - Example: `saveTodos()` catches storage quota exceeded, logs warning, continues
   - Prevents app crash from localStorage issues

4. **Component Level:** Error boundaries via React (not shown but used for safety)
   - Fallback: Show error message in UI from hook's error state

## Cross-Cutting Concerns

**Logging:**
- Approach: `console.warn` for non-critical issues (autoplay blocked, storage failed)
- No structured logging library; console used for browser debugging
- No server-side logs captured (Cloudflare Workers have built-in request logs)

**Validation:**
- Input: Zod schemas on server side via `@trpc/server` automatic validation
- Examples: `newTodoSchema`, `updateTodoSchema`, `newPomodoroSessionSchema` in `src/app/routers/_shared.ts`
- Frontend: No validation before calling mutations (validation happens server-side)

**Authentication:**
- Session-based via JWT tokens (HS256 using Web Crypto API)
- Provider: Google OAuth 2.0 integration via `better-auth`
- Flow:
  1. Google login button → redirects to `/api/auth/google/callback`
  2. Callback creates JWT session token
  3. Session token stored in httpOnly cookie (Cloudflare Pages)
  4. Subsequent requests include cookie; Hono middleware verifies JWT
  5. `user` object injected into tRPC context if valid
- Scope: Email, name, profile picture from Google

**Authorization:**
- Pattern: `protectedProcedure` middleware checks `ctx.user` presence
- Database scoping: All queries filtered by `userId` (e.g., `eq(ctx.schema.todos.userId, user.id)`)
- Prevents: One user viewing/modifying another user's todos or sessions

**BGM Playback:**
- Constraint: Browser autoplay policy blocks audio without user interaction
- Solution: Audio play() triggered only from event handlers (`handleStart` in TimerWidget)
- HTML5 Audio element with `preload="auto"` for faster playback
- Source: External CDN (mixkit.co) for notification sounds; local files for BGM

---

*Architecture analysis: 2026-03-19*
