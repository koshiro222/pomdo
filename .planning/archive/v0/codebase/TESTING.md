# TESTING.md — Test Structure & Practices

## テストスタック

| ツール | バージョン | 用途 |
|--------|---------|------|
| Vitest | 4.0.18 | ユニットテストランナー |
| @testing-library/react | 16.3.2 | React フックのテスト |
| jsdom | 28.1.0 | DOM エミュレーション |
| @vitest/coverage-v8 | 4.0.18 | カバレッジ測定（v8） |
| Playwright | 1.58.2 | E2Eブラウザテスト |

## ユニットテスト設定

```typescript
// vitest.config.ts
{
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov']
    }
  }
}
```

### テストセットアップ（`src/test/setup.ts`）
- localStorage のモック（Zustand persist ミドルウェア対応）
- `@testing-library/jest-dom` マッチャー拡張

## ユニットテストの場所・構造

```
src/
└── hooks/
    └── useTimer.test.ts   # 現状唯一のユニットテスト
```

### `useTimer.test.ts` パターン
```typescript
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('初期状態の検証', () => {
    const { result } = renderHook(() => useTimer())
    expect(result.current.isActive).toBe(false)
    expect(result.current.sessionType).toBe('work')
  })

  it('タイマー開始でカウントダウン', () => {
    const { result } = renderHook(() => useTimer())
    act(() => { result.current.start() })
    act(() => { vi.advanceTimersByTime(1000) })
    expect(result.current.remainingSecs).toBe(WORK_DURATION - 1)
  })
})
```

### テストカバー範囲（useTimer.test.ts — 13ケース）
- 初期化・初期値
- start() / pause() / reset() / skip()
- 1秒ごとのカウントダウン確認
- pomodoroCount の自動インクリメント
- セッション完了時の自動次セッション開始
- onSessionComplete コールバック呼び出し

## E2Eテスト設定

```typescript
// playwright.config.ts
{
  testDir: 'tests/e2e',
  globalSetup: 'tests/global-setup.ts',
  fullyParallel: false,   // 順序保証
  workers: 1,             // シングルスレッド（テスト競合回避）
  reporter: [['html'], ['json']],
  use: {
    baseURL: 'http://localhost:8788',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'only-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8788',
    reuseExistingServer: !process.env.CI,
  }
}
```

## E2Eテストの構造

```
tests/
├── global-setup.ts          # テストユーザー作成（better-auth API経由）
└── e2e/
    ├── helpers/
    │   └── auth.ts          # ログインヘルパー関数・テスト認証情報定数
    ├── auth.spec.ts         # 認証フロー
    ├── timer.spec.ts        # タイマー操作
    ├── todo.spec.ts         # Todo CRUD
    ├── migration.spec.ts    # ゲスト→ログイン移行
    └── bgm.spec.ts          # BGM再生
```

### テスト認証情報（`tests/e2e/helpers/auth.ts`）
```typescript
export const TEST_USER = {
  email: 'pomdo.test.x7k2q@example.com',
  password: 'Px9mK#vL3nR@2025',
  name: 'TestUser'
}
```

### global-setup.ts
- better-auth API 経由でテストユーザーを事前作成
- 既存ユーザーがいる場合は削除して再作成

## E2Eテストカバレッジ

### `auth.spec.ts`
- ゲストモード: ログインボタン表示確認
- LoginDialog 表示: Google/メール両方のオプション
- ダイアログ閉じる: ×ボタン・ESCキー
- メールログイン: 正常系・エラーメッセージ確認
- ログアウトフロー

### `timer.spec.ts`
- ゲストモード・ログインモード両方
- Focus (25分) → Short Break (5分) → Long Break (15分) セッション切り替えUI
- START / PAUSE / RESET / SKIP ボタン操作
- 各セッション種別でのUI状態確認

### `todo.spec.ts`
- Todo 追加・完了チェック・削除
- フィルター（Active / Done / All）
- 残りタスク数表示の更新
- タスク選択で CurrentTaskCard に反映

### `migration.spec.ts`
- ゲストモードでタスク作成 → ログイン後 MigrateDialog 表示
- "Migrate" 選択: ゲストタスクがサーバーDBに移行
- "Skip & Clear" 選択: ゲストタスク破棄
- `cleanupTodos()` で後処理

### `bgm.spec.ts`
- BGM再生・停止
- トラック切り替え

## テスト実行コマンド

```bash
npm test              # Vitest ユニットテスト（ウォッチモード）
npm run test:run      # Vitest 1回実行
npm run test:coverage # カバレッジ付き実行
npm run test:e2e      # Playwright E2E（全ブラウザ）
npx playwright test --project=chromium  # Chromiumのみ
npx playwright test tests/e2e/auth.spec.ts  # 特定ファイル
```

## モッキング戦略

### localStorage モック（`src/test/setup.ts`）
```typescript
// Zustand persist との互換性のためlocalStorage全体をモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
```

### タイマーモック（ユニットテスト内）
```typescript
vi.useFakeTimers()          // フェイクタイマー有効化
vi.advanceTimersByTime(1000) // 時間を進める
vi.useRealTimers()           // 復元
```

### HTTPモック
- ユニットテストでは tRPC/fetch をモックしていない（現状）
- E2E テストは実際の開発サーバーに対して実行

## 注意事項
- E2E は `fullyParallel: false` + `workers: 1` のため順序依存テストが書ける
- テストユーザーは1件のみ（グローバルに共有）— 競合に注意
- BGM テストは R2 への実際のアクセスが必要（ローカルでは public/audio/ フォールバックがある場合）
