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
