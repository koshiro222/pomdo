import { type Page } from '@playwright/test'

export const TEST_USER = {
  email: 'pomdo.test.x7k2q@example.com',
  password: 'Px9mK#vL3nR@2025',
  name: 'TestUser',
} as const

const TRPC_BASE = 'http://localhost:8788/api/trpc'

/** テストユーザーでサインインし、認証済み状態にする */
export async function signIn(page: Page): Promise<void> {
  await page.goto('/')

  await page.getByRole('button', { name: 'Login with Google' }).click()
  await page.getByRole('button', { name: 'メールアドレスでログイン' }).click()

  await page.getByRole('textbox', { name: 'you@example.com' }).fill(TEST_USER.email)
  await page.getByRole('textbox', { name: '••••••••' }).fill(TEST_USER.password)
  await page.getByRole('button', { name: 'ログイン' }).click()

  // ログイン完了を待機
  await page.getByRole('button', { name: /Logout/ }).waitFor({ timeout: 10000 })
}

/**
 * テストユーザーの Todo データを全削除する。
 * signIn 後（認証済み状態）で呼び出すこと。
 */
export async function cleanupTodos(page: Page): Promise<void> {
  const allResp = await page.request.get(
    `${TRPC_BASE}/todo.getAll?input=%7B%22json%22%3Anull%7D`
  )
  if (!allResp.ok()) return

  const data = await allResp.json()
  // superjson レスポンス形式: { result: { data: { json: [...] } } }
  const todos: Array<{ id: string }> = data?.result?.data?.json ?? []

  for (const todo of todos) {
    await page.request.post(`${TRPC_BASE}/todo.delete`, {
      data: { json: { id: todo.id } },
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
