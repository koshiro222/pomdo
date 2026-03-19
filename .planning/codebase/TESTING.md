# Testing

## Overview

Two-tier testing strategy: Vitest for unit tests (hooks/stores) and Playwright for E2E tests (user flows).

## Unit Tests (Vitest)

### Framework & Configuration

- **Framework**: Vitest 4.0.18 with jsdom environment
- **Config**: `vitest.config.ts`
- **Setup file**: `src/test/setup.ts`
- **Coverage**: v8 provider, outputs text + HTML + lcov

```ts
// vitest.config.ts key settings
{
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/tests/e2e/**'],
    coverage: { provider: 'v8' }
  }
}
```

### File Structure

Unit tests are **co-located** with source files:

```
src/hooks/useTimer.ts
src/hooks/useTimer.test.ts   ← co-located test
```

Currently 1 unit test file: `src/hooks/useTimer.test.ts` (245 lines).

### Global Setup: `src/test/setup.ts`

```ts
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)  // jest-dom matchers available globally

// localStorage mock for Zustand persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return { getItem, setItem, removeItem, clear, ... }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

afterEach(() => {
  cleanup()           // React Testing Library cleanup
  localStorageMock.clear()  // Reset localStorage between tests
})
```

### Time-Based Testing Pattern

Uses `vi.useFakeTimers()` + `vi.advanceTimersByTime()` for timer tests:

```ts
describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Reset Zustand store state before each test
    useTimerStore.setState({
      isActive: false,
      sessionType: 'work',
      remainingSecs: 25 * 60,
      pomodoroCount: 0,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('タイマーがカウントダウンする', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.remainingSecs).toBe(25 * 60 - 1)
  })
})
```

### Zustand Store Reset Pattern

Reset store state directly in `beforeEach` to ensure test isolation:

```ts
useTimerStore.setState({
  isActive: false,
  sessionType: 'work',
  remainingSecs: 25 * 60,
})
```

### Test Helpers Available

- `@testing-library/react`: `renderHook`, `act`
- `@testing-library/jest-dom`: DOM matchers (`.toBeVisible()`, `.toBeInTheDocument()`, etc.)
- Vitest globals: `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`

### Running Unit Tests

```bash
npm test                    # run all unit tests
npm test -- --coverage      # with coverage report
npm test -- useTimer        # filter by file name
```

## E2E Tests (Playwright)

### Framework & Configuration

- **Framework**: Playwright (latest)
- **Config**: `playwright.config.ts`
- **Test directory**: `tests/e2e/`
- **Base URL**: `http://localhost:5173`
- **Browsers**: Chromium, Firefox, WebKit (Desktop)
- **Workers**: 1 (sequential — prevents auth state conflicts)
- **Parallelism**: `fullyParallel: false`

### Web Server

Playwright auto-starts `npm run dev` (Vite + Wrangler) before tests:

```ts
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
}
```

### Test Suites (5 files)

| File | Coverage |
|------|---------|
| `tests/e2e/auth.spec.ts` | Google OAuth login flow, sign-out |
| `tests/e2e/timer.spec.ts` | Timer display, session switching, countdown |
| `tests/e2e/todo.spec.ts` | Todo CRUD (add, complete, delete) |
| `tests/e2e/bgm.spec.ts` | BGM player controls |
| `tests/e2e/migration.spec.ts` | Guest→auth data migration dialog |

### Global Setup: `tests/global-setup.ts`

Runs once before all Playwright tests. Sets up any required preconditions (DB cleanup, auth state).

### Auth Helper: `tests/helpers/auth.ts`

```ts
import { signIn } from '../helpers/auth'

// Reusable sign-in flow across test files
await signIn(page)

// Cleanup after authenticated tests
await cleanupTodos(page)
```

### E2E Pattern: Guest Mode vs Auth Mode

Most E2E tests cover both modes:

```ts
test.describe('タイマー動作 - ゲストモード', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })
  // ...
})

test.describe('タイマー動作 - ログイン済み', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })
  // ...
})
```

### localStorage Reset in E2E

```ts
// Reset specific store key
await page.evaluate(() => localStorage.removeItem('timer-storage'))
await page.reload()

// Full reset
await page.evaluate(() => localStorage.clear())
await page.reload()
```

### Running E2E Tests

```bash
npx playwright test                    # run all E2E tests
npx playwright test timer.spec.ts      # run single suite
npx playwright test --headed           # with browser UI
npx playwright test --debug            # step-through debugger
npx playwright show-report             # view HTML report
```

### CI Configuration

```ts
{
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
}
```

## Coverage

Unit test coverage is collected by Vitest v8:

```bash
npm test -- --coverage
# Output: coverage/ directory
# Formats: text (stdout), HTML (coverage/index.html), lcov
```

Current coverage focuses on `src/hooks/` and `src/core/store/`.

## Testing Conventions

- テスト名は日本語で書く（例: `'初期状態ではタイマーが停止している'`）
- E2E tests always test both guest mode and authenticated mode when applicable
- Zustand stores are reset via `.setState()` in `beforeEach`, not by re-importing
- `vi.useFakeTimers()` must be paired with `vi.restoreAllMocks()` in `afterEach`
- E2E helpers (`signIn`, `cleanupTodos`) handle auth boilerplate to keep tests focused
