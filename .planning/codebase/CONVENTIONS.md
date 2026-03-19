# Coding Conventions

**Analysis Date:** 2026-03-19

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `TimerDisplay.tsx`, `CurrentTaskCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useTimer.ts`, `useTodos.ts`)
- Stores: camelCase with `use` suffix (e.g., `timer.ts` → `useTimerStore`)
- Utils/Lib: camelCase (e.g., `animation.ts`, `storage.ts`)
- Types/Schemas: PascalCase for type files (e.g., `schema.ts` contains types)
- Tests: `filename.test.ts` or `filename.spec.ts`

**Functions:**
- React components: PascalCase (e.g., `TimerDisplay`, `LoginButton`)
- Hooks: camelCase with `use` prefix (e.g., `useTimer()`, `useTodos()`)
- Utility functions: camelCase (e.g., `formatFocusTime()`, `getSessionTotalSecs()`)
- Handlers: `handle{Action}` pattern (e.g., `handleComplete`, `handleDelete`, `handleSelectNext`)
- Callbacks/Mutations: descriptive camelCase (e.g., `onSessionComplete`, `onSessionTypeChange`)

**Variables:**
- State variables: camelCase (e.g., `remainingSecs`, `pomodoroCount`, `selectedTodoId`)
- Constants: UPPER_SNAKE_CASE (e.g., `SESSION_DURATIONS`, `SESSION_ORDER`)
- Boolean flags: prefix with `is` or `has` (e.g., `isActive`, `hasMoreTodos`)
- Error messages: camelCase (e.g., `localError`, `currentError`)

**Types:**
- Interfaces: PascalCase (e.g., `TimerDisplayProps`, `CurrentTaskCardProps`, `Context`)
- Type aliases: PascalCase (e.g., `SessionType`, `Mode`, `Toast`)
- Union types: descriptive (e.g., `type SessionType = 'work' | 'short_break' | 'long_break'`)
- Store types: compound (e.g., `TimerStore = TimerState & TimerActions`)

## Code Style

**Formatting:**
- Prettier is not explicitly configured (no `.prettierrc` file present)
- Default Vite/TypeScript formatting observed across codebase
- Line length appears unrestricted in samples
- Indentation: 2 spaces (observed in all files)

**Linting:**
- ESLint with flat config: `eslint.config.js`
- Config extends: `@eslint/js`, `typescript-eslint`, `react-hooks`, `react-refresh`
- Rules enforce React hooks dependencies via `eslint-plugin-react-hooks`
- TypeScript strict mode enabled in compiler

**Strict TypeScript Settings:**
```json
"strict": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"noFallthroughCasesInSwitch": true,
"noUncheckedSideEffectImports": true
```

## Import Organization

**Order:**
1. React/Framework imports (e.g., `import { useState } from 'react'`)
2. Third-party libraries (e.g., `import { motion } from 'framer-motion'`, `import { Check } from 'lucide-react'`)
3. Internal components/hooks (e.g., `import { useTodos } from '../../hooks/useTodos'`)
4. Utilities (e.g., `import { tapAnimation } from '@/lib/animation'`, `import { storage } from '../../lib/storage'`)
5. Type imports (separate or with `type` keyword): `import type { SessionType } from '../../hooks/useTimer'`

**Path Aliases:**
- `@/*` resolves to `./src/*` (configured in `tsconfig.json` and `vitest.config.ts`)
- Example: `@/lib/animation` → `src/lib/animation.ts`
- Used for: utilities, components, shared lib files
- Relative imports used for: hooks, stores (context-dependent imports)

## Error Handling

**Patterns:**
- tRPC routers: use `TRPCError` with typed codes (e.g., `TRPCError({ code: 'NOT_FOUND', message: '...' })`)
  - Location: `src/app/routers/` and `functions/api/trpc/`
  - Example: `src/app/routers/todos.ts` throws `TRPCError` for validation failures
- Try/catch blocks: catch as `Error` instance check pattern
  ```typescript
  try {
    // logic
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Default error message'
    // handle
  }
  ```
- Promise rejections: `.catch()` for browser API calls (e.g., `audio.play().catch(() => ...)`)
- Store initialization: catch and set error state
  ```typescript
  try {
    const stored = storage.getTodos()
    set({ localTodos: stored, loading: false, error: null })
  } catch (e) {
    set({ error: e instanceof Error ? e.message : 'Failed', loading: false })
  }
  ```

**CRITICAL - tRPC Implementation:**
- Plain `throw new Error()` in tRPC procedures → `INTERNAL_SERVER_ERROR (500)` response
- Always use `TRPCError` with specific code (e.g., `'NOT_FOUND'`, `'UNAUTHORIZED'`, `'BAD_REQUEST'`)
- Location: `functions/lib/` and `src/app/routers/`

## Logging

**Framework:** `console` (no dedicated logging library)

**Patterns:**
- `console.warn()` for non-critical issues (e.g., browser autoplay policies)
  ```typescript
  .catch(() => {
    console.warn('Autoplay prevented by browser policy')
  })
  ```
- No `console.log()` for production code observed
- Error tracking recommended but not yet implemented (opportunity area)

## Comments

**When to Comment:**
- Helper functions with non-obvious behavior: e.g., `resetTimerState()` in `tests/e2e/timer.spec.ts` has JSDoc
- Complex calculations: e.g., SVG circle circumference math in `TimerRing.tsx`
- Business logic boundaries: e.g., "Session complete" sections in `useTimer.ts`

**JSDoc/TSDoc:**
- Minimal usage observed
- Test helpers include comment blocks: `/** localStorage のタイマー状態をリセット... */`
- Not required for simple functions/components

## Function Design

**Size:**
- Hooks: 100-150 lines typical (e.g., `useTimer.ts`, `useTodos.ts`)
- Components: 90-100 lines including JSX
- Procedures: 20-40 lines (tRPC routers in `src/app/routers/`)

**Parameters:**
- Interfaces for component props (e.g., `TimerDisplayProps`)
- Interfaces for hook options (e.g., `UseTimerOptions`)
- Limit to 3-5 parameters; use objects for multiple related params

**Return Values:**
- Hooks return object of state + actions (e.g., `UseTimerReturn`)
- Components return JSX Element
- Async functions return promise (explicit typing)

## Module Design

**Exports:**
- Named exports for hooks (e.g., `export function useTimer()`)
- Named exports for components (e.g., `export function TimerDisplay()`, `export default function CurrentTaskCard()`)
- Default export for page/route components
- Type exports: `export type { SessionType }` alongside function exports

**Barrel Files:**
- Not used in this codebase
- Imports are direct from specific files (e.g., `from '../../hooks/useTimer'`)

**File Organization in Stores:**
- Store definition and type definitions in single file (e.g., `src/core/store/timer.ts`)
- State interface, Actions interface, combined Store type in same file
- Use `persist` middleware from Zustand for localStorage integration

---

*Convention analysis: 2026-03-19*
