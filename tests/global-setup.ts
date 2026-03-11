import { request } from '@playwright/test'

const TEST_USER = {
  email: 'pomdo.test.x7k2q@example.com',
  password: 'Px9mK#vL3nR@2025',
  name: 'TestUser',
}

const API_BASE = 'http://localhost:8788'

/**
 * 全テスト実行前に一度だけ実行される。
 * テストユーザーが存在しない場合はサインアップして作成する。
 */
export default async function globalSetup() {
  const ctx = await request.newContext({ baseURL: API_BASE })

  // まずサインインを試みる
  const signInResp = await ctx.post('/api/auth/sign-in/email', {
    data: {
      email: TEST_USER.email,
      password: TEST_USER.password,
    },
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:5173',
    },
  })

  if (signInResp.ok()) {
    console.log('[globalSetup] テストユーザー確認済み')
    await ctx.dispose()
    return
  }

  // サインインに失敗した場合はサインアップする
  console.log('[globalSetup] テストユーザーが存在しないため作成します...')
  const signUpResp = await ctx.post('/api/auth/sign-up/email', {
    data: {
      email: TEST_USER.email,
      password: TEST_USER.password,
      name: TEST_USER.name,
      callbackURL: '/',
    },
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:5173',
    },
  })

  if (!signUpResp.ok()) {
    const body = await signUpResp.text()
    throw new Error(`テストユーザー作成に失敗しました: ${signUpResp.status()} ${body}`)
  }

  console.log('[globalSetup] テストユーザー作成完了')
  await ctx.dispose()
}
