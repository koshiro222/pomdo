import { describe, expect, it } from 'vitest'
import { testAuthApp } from '../../functions/api/test/auth'

describe('E2E 専用認証 endpoint', () => {
  it('E2E_TEST_MODE=false では 404 を返す', async () => {
    const response = await testAuthApp.request('/api/test/auth', { method: 'POST' }, {
      E2E_TEST_MODE: 'false',
      DATABASE_URL: '',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      BETTER_AUTH_SECRET: '',
      BETTER_AUTH_URL: '',
    })
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
  })
})
