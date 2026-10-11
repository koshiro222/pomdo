import { describe, expect, it } from 'vitest'
import { adminPurgeApp } from '../../functions/api/admin/purge-anonymous'

describe('匿名ユーザー purge endpoint', () => {
  it('実際のPages Functionsパスで認証なしをJSON 401として返す', async () => {
    const response = await adminPurgeApp.request('/api/admin/purge-anonymous', { method: 'POST' }, {
      ADMIN_CRON_SECRET: 'test-secret',
      DATABASE_URL: '',
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      BETTER_AUTH_SECRET: '',
      BETTER_AUTH_URL: '',
    })

    expect(response.status).toBe(401)
    expect(response.headers.get('content-type')).toContain('application/json')
  })
})
