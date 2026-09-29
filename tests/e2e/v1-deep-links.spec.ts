import { expect, test } from '@playwright/test'

test('SPAのdeep linkはリダイレクトせず入口HTMLを返す', async ({ request }) => {
  for (const path of ['/app', '/app/review', '/legal', '/legal/terms', '/legal/privacy']) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status(), `${path} のstatus`).toBe(200)
    expect(response.headers()['content-type'], `${path} のcontent-type`).toContain('text/html')
  }
})
