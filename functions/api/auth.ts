import { Hono } from 'hono'
import { createAuthInstance, type AuthBindings } from '../lib/auth'

const auth = new Hono<{ Bindings: AuthBindings }>()

// 互換性 shim: GET /api/auth/google → Better Auth の social sign-in へ転送
auth.get('/google', async (c) => {
  const authInstance = createAuthInstance(c.env)
  const origin = new URL(c.req.url).origin

  const req = new Request(`${origin}/api/auth/sign-in/social`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: 'google', callbackURL: '/' }),
  })

  const res = await authInstance.handler(req)

  // Better Auth は 200 + { url, redirect } を返すので、ブラウザ用に 302 に変換
  if (res.status === 200) {
    const data = await res.json<{ url?: string }>()
    if (data.url) return c.redirect(data.url)
  }

  return res
})

// 互換性 shim: POST /api/auth/logout → Better Auth の sign-out へ転送
auth.post('/logout', async (c) => {
  const authInstance = createAuthInstance(c.env)
  const origin = new URL(c.req.url).origin

  const req = new Request(`${origin}/api/auth/sign-out`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      origin,
      cookie: c.req.header('cookie') ?? '',
    },
  })

  const res = await authInstance.handler(req)
  return res.ok ? c.json({ ok: true }) : res
})

// その他すべての /api/auth/* リクエストを Better Auth に委譲
auth.all('/*', async (c) => {
  const authInstance = createAuthInstance(c.env)
  return authInstance.handler(c.req.raw)
})

export default auth
