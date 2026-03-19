# External Integrations

**Analysis Date:** 2026-03-19

## APIs & External Services

**Google OAuth:**
- Google Sign-In for authentication
  - SDK/Client: better-auth with built-in Google provider
  - Auth: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars
  - Implementation: OAuth2 flow via better-auth
  - Redirect handling: `functions/api/auth.ts` provides compatibility shim for `/api/auth/google` endpoint

## Data Storage

**Databases:**
- PostgreSQL (Neon serverless)
  - Connection: `DATABASE_URL` environment variable (HTTP endpoint URL)
  - Client: Drizzle ORM 0.45.1 with `drizzle-orm/neon-http`
  - Adapter: `@neondatabase/serverless` (HTTP client, not serverless SDK)
  - Schema: `functions/lib/schema.ts` (users, sessions, accounts, verifications, todos, pomodoro_sessions)
  - Migrations: Generated via `drizzle-kit`, applied with `npm run db:migrate`

**File Storage:**
- Cloudflare R2 (Object Storage)
  - Bucket name: `pomdo-bgm`
  - Binding: `BGM_BUCKET` (accessed via `c.env.BGM_BUCKET` in Hono context)
  - Purpose: BGM/music file hosting
  - Endpoint: `GET /api/bgm/:filename`
  - Validation: Only `.mp3` files with alphanumeric + hyphen names allowed
  - File: `functions/api/bgm.ts`

**Caching:**
- React Query (@tanstack/react-query) - Client-side data caching
  - Stale time: 5 minutes default
  - Refetch on window focus: disabled
  - Configuration: `src/lib/trpc.tsx`

## Authentication & Identity

**Auth Provider:**
- better-auth 1.5.4
  - Implementation: OAuth2 (Google) + Email/Password
  - Database adapter: Drizzle ORM adapter (`better-auth/adapters/drizzle`)
  - Base URL: `BETTER_AUTH_URL` environment variable
  - Base path: `/api/auth`
  - Trusted origins: `FRONTEND_URL` environment variable
  - Session tables:
    - `users` - User accounts with Google ID, email, profile
    - `sessions` - Active sessions with token, IP, user-agent
    - `accounts` - OAuth provider accounts with tokens
    - `verifications` - Email verification tokens
  - Email operations (password reset, verification):
    - Currently stubbed with console.log in `functions/lib/auth.ts`
    - TODO: Integration with email service (Issue #120)
  - ID generation: UUID (not nanoid) due to database schema
  - Secret: `BETTER_AUTH_SECRET` environment variable
  - Auth endpoints:
    - `POST /api/auth/sign-in/social` - OAuth sign-in (Google)
    - `POST /api/auth/sign-out` - Sign out
    - `GET /api/auth/me` - Get current user (via tRPC)
    - Compatibility routes: `/api/auth/google` (redirect), `/api/auth/logout` (redirect)

**Client-Side Auth:**
- better-auth/react - React hook for auth client
  - `src/lib/auth.ts` - Creates auth client instance
  - Base URL: `window.location.origin`
  - Used in: Auth store, LoginButton component, E2E tests

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Rollbar, etc.)

**Logs:**
- Console-based logging
  - Better-auth password reset: `console.log` in `functions/lib/auth.ts` (Issue #120)
  - API health check: `functions/api/[[route]].ts` returns error details in JSON

## CI/CD & Deployment

**Hosting:**
- Cloudflare Pages
  - Build output directory: `dist/`
  - Compatibility date: 2025-01-01
  - Node.js compatibility flag enabled
  - Configuration: `wrangler.toml`

**CI Pipeline:**
- Not detected
- Playwright E2E tests configured for CI: retries=2, workers=1, forbidOnly enforced
- Configuration: `playwright.config.ts`

## Environment Configuration

**Required env vars:**
```
DATABASE_URL              # Neon PostgreSQL HTTP endpoint (required)
GOOGLE_CLIENT_ID          # Google OAuth client ID (required)
GOOGLE_CLIENT_SECRET      # Google OAuth client secret (required)
BETTER_AUTH_SECRET        # Auth session secret (required)
BETTER_AUTH_URL           # Auth base URL (required)
FRONTEND_URL              # Frontend origin for CORS (required)
VITE_API_URL             # Frontend-side tRPC endpoint override (optional, default: /api/trpc)
```

**Secrets location:**
- `.dev.vars` file (local development, not in repository)
- Cloudflare Pages environment variables (production)

## Webhooks & Callbacks

**Incoming:**
- `GET /api/auth/callback/google` - OAuth callback (handled by better-auth)
- `POST /api/auth/callback/email` - Email verification callback (not yet implemented)

**Outgoing:**
- None detected
- Email notifications: planned for Issue #120

## tRPC Endpoints

**Public Procedures:**
- None configured (all non-auth endpoints require authentication)

**Protected Procedures (require user session):**
- `POST /api/trpc/todos.create` - Create todo
- `GET /api/trpc/todos.getAll` - Get user's todos
- `PATCH /api/trpc/todos.update` - Update todo
- `DELETE /api/trpc/todos.delete` - Delete todo
- `GET /api/trpc/pomodoro.getSessions` - Get Pomodoro sessions
- `POST /api/trpc/pomodoro.createSession` - Create Pomodoro session
- `PATCH /api/trpc/pomodoro.completeSession` - Complete Pomodoro session

**Router structure:**
- Root router: `src/app/routers/root.ts`
- Todos router: `src/app/routers/todos.ts`
- Pomodoro router: `src/app/routers/pomodoro.ts`
- Context setup: `src/app/routers/context.ts` (user, db, schema injection)
- Serialization: superjson (handles Date, Map, Set types)

## REST Endpoints

**Health Check:**
- `GET /api/health` - Database connectivity check

**Authentication:**
- `GET /api/auth/google` - OAuth initiation (redirect to Google)
- `POST /api/auth/logout` - Sign out
- `*` `/api/auth/*` - Delegated to better-auth handler

**BGM/Music:**
- `GET /api/bgm/:filename` - Stream BGM file from R2

---

*Integration audit: 2026-03-19*
