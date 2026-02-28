// モックユーザー
export const mockUser = {
  sub: 'test-user-id',
  email: 'test@example.com',
  name: 'テストユーザー',
  avatarUrl: 'https://example.com/avatar.png',
  iat: Date.now(),
  exp: Date.now() + 60 * 60 * 24 * 7,
}

// 認証APIをモック化するヘルパー関数
export async function mockAuthAPI(page: any) {
  // /api/auth/me エンドポイントをモック
  await page.route('**/api/auth/me', async (route) => {
    const headers = route.request().headers()
    const cookieHeader = headers['cookie'] || headers['Cookie'] || ''

    // Cookieにauth_tokenが含まれているか確認
    const hasAuthToken = cookieHeader.includes('auth_token=mock-jwt-token')

    if (hasAuthToken) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: mockUser }),
      })
    } else {
      await route.fulfill({
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      })
    }
  })

  // /api/auth/logout エンドポイントをモック
  await page.route('**/api/auth/logout', async (route) => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    })
  })
}

// ログイン状態をシミュレートするヘルパー関数
export async function simulateLogin(context: any) {
  await context.addCookies([
    {
      name: 'auth_token',
      value: 'mock-jwt-token',
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    },
  ])
}
