# テスト・動作確認ガイドライン

実装後は必ずE2Eテストとユニットテストを実施すること。

## E2Eテスト（必須）

実装後は必ず Playwright テストを実行する。

```bash
npm test              # 全テスト実行
npm test -- ui       # UIモードで実行
npm test -- project=chromium  # 特定ブラウザのみ
```

### ブラウザサポートと制約

| ブラウザ | プロジェクト名 | 制約 |
|---------|---------------|------|
| Chromium | Desktop Chrome | なし |
| Firefox | Desktop Firefox | なし |
| WebKit | Desktop Safari | **Cookie 設定が不安定** → ログインテストはスキップ |
| Mobile Chrome | Pixel 5 | **hover が動作しない** → `dispatchEvent('click')` で対応 |
| Mobile Safari | iPhone 12 | **Cookie + hover 制約** |

### モバイルデバイス対応

モバイルでは `hover` が動作しないため、以下のパターンを使用：

```typescript
test('モバイル対応テスト', async ({ page, isMobile }) => {
  // モバイルではhoverが動作しないため、dispatchEventで直接クリックイベントをトリガー
  const button = page.locator('button')
  if (isMobile) {
    await button.evaluate((el) => el.style.setProperty('pointer-events', 'auto'))
    await button.dispatchEvent('click')
  } else {
    await button.hover()
    await button.click()
  }
})
```

### テストスキップのガイドライン

技術的制限によりスキップする場合、必ず理由を記述：

```typescript
test.skip('contextを閉じるテスト', async ({ page, context }) => {
  test.info().annotations.push({ type: 'issue', description: 'Playwrightの制限: テスト実行中はcontextを閉じられない' })
})

test.skip('WebKitのログインテスト', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKitではCookie設定が不安定なためスキップ')
})
```

### localStorage との連携

状態の保存を待機するパターン：

```typescript
// localStorageに保存されるのを待つ
await page.waitForFunction(() => {
  const todos = window.localStorage.getItem('pomdo_todos')
  return todos ? JSON.parse(todos).some((t: { title: string }) => t.title === 'テスト') : false
}, { timeout: 5000 })
```

### API モック化

認証APIのモックは `tests/helpers/auth-mock.ts` を使用：

```typescript
import { mockAuthAPI, simulateLogin, mockUser } from '../helpers/auth-mock'

test.beforeEach(async ({ page }) => {
  await mockAuthAPI(page)
  await page.goto('/')
})

test('ログインテスト', async ({ page, context }) => {
  await simulateLogin(context)
  await page.reload()
  // ...
})
```

### API リクエストのインターセプト

```typescript
// APIリクエストをインターセプトしてエラーをシミュレーション
await page.route('**/api/todos/**', (route) => {
  route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Internal Server Error' }),
  })
})
```

### 既存テストファイル

| ファイル | カテゴリ |
|---------|---------|
| `auth.spec.ts` | 認証フロー（ゲストモード、ログイン、ログアウト） |
| `bgm.spec.ts` | BGM再生・音量制御 |
| `error-handling.spec.ts` | バリデーション、APIエラー、状態保持、エッジケース |
| `migration.spec.ts` | ゲスト→ログイン移行時のマイグレーション |
| `responsive.spec.ts` | レスポンシブ対応 |
| `timer.spec.ts` | タイマー動作 |
| `todo.spec.ts` | Todo CRUD |

### テスト追加時のチェックリスト

- [ ] Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari で動作確認
- [ ] モバイルデバイスで hover を使用していない
- [ ] 必要に応じて `isMobile` で分岐
- [ ] localStorage の保存待機が必要な場合は `waitForFunction` を使用
- [ ] Cookie に依存するテストは WebKit/Mobile Safari でスキップ考慮
- [ ] スキップする場合は `test.info().annotations.push` で理由記述

### Playwright 設定

- `baseURL`: `http://localhost:5173`
- リトライ: CI 環境では2回、ローカルでは0回
- トレース: リトライ時のみ記録
- スクリーンショット・動画: 失敗時のみ記録

## ユニットテスト（推奨）

ロジック・フック・ユーティリティにはユニットテストを作成する。
