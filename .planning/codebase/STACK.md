# Technology Stack

**Analysis Date:** 2026-03-19

## Languages

**Primary:**
- TypeScript ~5.9.3 - All source code, API routes, and configuration
- JSX/TSX - React component syntax with React 19.2.0

**Secondary:**
- JavaScript - ESLint configuration (eslint.config.js)

## Runtime

**Environment:**
- Node.js (version unspecified via .nvmrc)
- Cloudflare Workers (Edge Runtime) - API execution via Wrangler
- Browser (Web Crypto API for JWT signing)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- React 19.2.0 - UI framework
- Hono 4.12.3 - HTTP framework for both REST and tRPC APIs
- tRPC 11.0.0 (@trpc/server, @trpc/client, @trpc/react-query) - Type-safe RPC framework

**Styling:**
- Tailwind CSS 4.2.1 - Utility-first CSS framework
- @tailwindcss/vite 4.2.1 - Vite plugin for Tailwind
- Class Variance Authority 0.7.1 - Component styling utilities
- Radix UI 1.4.3 - Headless UI component library
- shadcn - Component CLI/library

**Animations:**
- Framer Motion 12.35.1 - Motion/animation library
- tw-animate-css 1.4.0 - Tailwind animation utilities

**Icons:**
- Lucide React 0.575.0 - React icon library

**State Management:**
- Zustand 5.0.11 - Lightweight state management
- React Query (@tanstack/react-query) 5.90.21 - Server state management

**Build/Dev:**
- Vite 7.3.1 - Frontend build tool and dev server
- Wrangler 4.69.0 - Cloudflare Workers CLI and Pages development
- TypeScript Compiler (tsc) - Type checking
- Concurrently 9.2.1 - Run multiple dev servers simultaneously

## Key Dependencies

**Critical:**
- Drizzle ORM 0.45.1 - TypeScript-first SQL ORM
- drizzle-kit 0.31.9 - Drizzle migration and schema management
- @neondatabase/serverless 1.0.2 - HTTP client for Neon PostgreSQL (required for Edge Runtime)

**Authentication & Authorization:**
- better-auth 1.5.4 - Full-featured auth library with OAuth2 support
- better-auth/adapters/drizzle - Drizzle adapter for better-auth

**Data Serialization:**
- superjson 2.2.6 - JSON serialization for complex types (Date, Map, etc.)

**Utilities:**
- clsx 2.1.1 - Conditional class name utility

## Configuration

**Environment:**
- Environment variables configured via `wrangler.toml` bindings
- Required env vars:
  - `DATABASE_URL` - Neon PostgreSQL connection URL
  - `GOOGLE_CLIENT_ID` - Google OAuth client ID
  - `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
  - `BETTER_AUTH_SECRET` - Authentication secret for better-auth
  - `BETTER_AUTH_URL` - Base URL for auth endpoints
  - `FRONTEND_URL` - Frontend URL for CORS trust
- Development environment: Wrangler loads `.dev.vars` file (not in repository)

**Build:**
- `tsconfig.json` - Root TypeScript configuration with path aliases
- `tsconfig.app.json` - App-specific TypeScript config (strict mode, ES2022 target)
- `vite.config.ts` - Frontend build configuration with React plugin, Tailwind plugin, path alias
- `wrangler.toml` - Cloudflare Pages configuration (compatibility_date: 2025-01-01, nodejs_compat flag enabled)
- `drizzle.config.ts` - Database schema and migration configuration

## Platform Requirements

**Development:**
- Node.js (unspecified version, recommend LTS)
- npm (bundled with Node.js)
- Cloudflare account (for local Wrangler Pages development)

**Production:**
- Cloudflare Pages (Edge deployment)
- Neon PostgreSQL (serverless SQL database)
- Cloudflare R2 (object storage for BGM files)

## Special Constraints (Edge Runtime)

**Forbidden APIs:**
- Node.js built-ins: `crypto`, `fs`, `net` modules
- TCP sockets (Node.js stream protocol)
- Packages requiring Node.js internals

**Required Patterns:**
- Use `Web Crypto API (crypto.subtle)` for JWT operations instead of Node.js crypto
- Use `drizzle-orm/neon-http` with `@neondatabase/serverless` for database access (HTTP-only, no TCP)
- Cannot use `@hono/oauth-providers` (Node.js dependency)
- Cloudflare R2 bucket accessed via context bindings (`c.env.BGM_BUCKET`)

---

*Stack analysis: 2026-03-19*
