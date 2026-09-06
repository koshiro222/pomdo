import { expect, test } from '@playwright/test'

test('アプリのdeep linkはリダイレクトせずSPA入口を返す', async ({ request }) => {
  for (const path of ['/app', '/app/review']) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status(), `${path} のstatus`).toBe(200)
    expect(response.headers()['content-type'], `${path} のcontent-type`).toContain('text/html')
  }
})
