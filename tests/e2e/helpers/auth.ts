import { expect, type Page } from '@playwright/test'

export async function openAppAsAnonymous(page: Page): Promise<void> {
  await page.goto('/app')
  await expect(page.getByText('Pomdo を5分だけ触ってみる')).toBeVisible()
}

export async function signInAsTestIdentity(page: Page, identity: string, seedExistingData = false): Promise<'migrated' | 'discarded' | null> {
  const response = await page.request.post('/api/test/auth', { data: { identity, seedExistingData } })
  expect(response.ok()).toBe(true)
  const result = await response.json() as { linkResult: 'migrated' | 'discarded' | null }
  if (result.linkResult) await page.evaluate((linkResult) => localStorage.setItem('pomdo-account-link-result', linkResult), result.linkResult)
  await page.reload()
  return result.linkResult
}

export async function setServerNowFromBrowserClock(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.setItem('pomdo-e2e-now', new Date().toISOString()))
}

export async function delayAuthenticationRequests(page: Page, delayMs = 800): Promise<void> {
  await page.route('**/api/auth/**', async (route) => {
    const url = route.request().url()
    if (url.includes('get-session') || url.includes('sign-in/anonymous')) await page.waitForTimeout(delayMs)
    try {
      await route.continue()
    } catch {
      await route.abort().catch(() => undefined)
    }
  })
}

export async function failAppProcedure(page: Page, procedure: string): Promise<void> {
  await page.route('**/api/**', async (route) => {
    if (!route.request().url().includes('/api/trpc')) {
      await route.continue()
      return
    }
    const requestPath = new URL(route.request().url()).pathname.split('/').pop() ?? ''
    const procedures = requestPath.split(',')
    const matchesProcedure = procedures.includes(procedure)
    if (matchesProcedure) {
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { message: 'E2E simulated failure' } }) })
      return
    }
    await route.continue()
  })
}
