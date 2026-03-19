# Concerns

## Summary

Pomdo is a production-deployed app with generally clean code, but has several known gaps: email sending not implemented, BGM R2 migration partially complete, `any` types in tRPC routers, limited unit test coverage, and dual API system (REST + tRPC) with some legacy REST endpoints.

---

## 1. Known TODOs / Unimplemented Features

### Email Sending Not Implemented (High Priority)
- **File**: `functions/lib/auth.ts:30,36`
- **Issue**: Password reset and email verification currently only `console.log()` — no actual email delivery
- **Impact**: `emailAndPassword` auth is enabled but password reset / email verification flows are broken in production
- **Comment**: `// TODO: Issue #120 以降でメール送信サービスを統合する`

### BGM R2 Migration Incomplete
- **File**: `functions/api/bgm.ts` — R2 proxy endpoint exists but `BGM_BUCKET` R2 binding not yet configured in Cloudflare
- **File**: `src/hooks/useBgm.ts` — still references static `/audio/` paths OR API path (unclear if migrated)
- **Impact**: BGM may fall back to missing files if R2 bucket not bound; audio files excluded from git
- **Context**: Issue #51 — R2 enablement was blocked by account setup (Mar 2026)

---

## 2. Type Safety Issues

### `any` Usage in tRPC Routers
- **Files**: `src/app/routers/context.ts:13-14`, `src/app/routers/pomodoro.ts:12,13,47,57`, `src/app/routers/todos.ts:52`
- **Details**:
  - `context.ts`: `db: any` and `schema: any` — tRPC context lacks proper Drizzle types
  - `pomodoro.ts`: `.where((t: any) => ...)` — Drizzle query builder not properly typed
  - `todos.ts`: `const updateData: any = {}` — dynamic update object construction
- **Risk**: Type errors masked at runtime; refactors won't catch breakage

### `any[]` in MigrateDialog
- **File**: `src/components/dialogs/MigrateDialog.tsx:14`
- `useState<any[]>([])` — local todo type not inferred from storage schema

---

## 3. Dual API Architecture Complexity

- Two parallel API systems exist: REST (`functions/api/todos.ts`, `functions/api/pomodoro.ts`) and tRPC (`functions/api/trpc/[[route]].ts`)
- REST endpoints appear to be legacy/redundant — tRPC is the primary frontend API
- **Risk**: Maintenance burden; unclear which endpoints are actually used by frontend
- **Recommendation**: Audit and remove unused REST endpoints

---

## 4. Test Coverage Gaps

### Minimal Unit Tests
- Only **1 unit test file**: `src/hooks/useTimer.test.ts` (245 lines)
- No unit tests for: `useTodos`, `usePomodoro`, `useBgm`, `useAuth`, Zustand stores, tRPC routers
- **Risk**: Regressions in untested hooks go undetected

### E2E Test Dependencies
- E2E tests require live Google OAuth — `tests/helpers/auth.ts` uses real sign-in
- This makes E2E tests hard to run in CI without credentials
- `tests/global-setup.ts` purpose unclear without reading it

---

## 5. Security Considerations

### Sensitive Bindings in Wrangler
- `BGM_BUCKET` R2 binding defined but bucket may not exist yet — silent failure mode
- JWT secret and OAuth credentials stored as Cloudflare Pages secrets (correct pattern)
- `.dev.vars` file exists for local development — must stay in `.gitignore`

### Auth Token Storage
- JWT stored as HTTP cookie (set by backend) — standard pattern, but cookie flags (`httpOnly`, `secure`, `sameSite`) should be audited

### BGM Filename Validation
- `functions/api/bgm.ts` validates filename with regex `^[a-z0-9-]+\.(mp3)$` — adequate but case-insensitive flag (`i`) means uppercase extensions also pass; consistent lowercase should be enforced at upload time

---

## 6. Performance / Scalability

### Cold Start Latency
- Cloudflare Workers have near-zero cold starts, but Neon HTTP connection on each request adds ~20-100ms DB latency
- No connection pooling possible in edge runtime

### Guest Mode localStorage
- Guest data stored in localStorage — no size limits enforced; large todo lists could approach 5MB browser limit

---

## 7. Fragile Areas

### BGM Audio Files Not in Git
- `public/audio/` is gitignored per `public/audio/README.md`
- New contributors must manually source CC0 audio files
- Onboarding friction; local dev BGM silent by default

### Migration Dialog Logic
- `src/components/dialogs/MigrateDialog.tsx` handles guest→auth data migration
- Uses `any[]` for local todos — type mismatch between localStorage schema and DB schema could cause silent data loss

### Dual tRPC/REST Context
- tRPC server context passes `db` and `schema` as `any` — if DB or schema changes, tRPC procedures won't get type errors

---

## 8. Known Production Issues (Resolved)

- **JWT sign() parameter bug** (fixed PR #72): `exp` was passed as 3rd arg instead of in payload; `jwt.verify` was undefined middleware import instead of standalone function
- Both `functions/api/auth.ts` and `functions/api/trpc/[[route]].ts` now use correct `await verify(token, secret, 'HS256')`
