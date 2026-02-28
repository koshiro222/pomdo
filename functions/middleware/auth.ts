import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { verifyJwt, type JwtPayload } from '../lib/jwt'

type Env = {
  Bindings: { JWT_SECRET: string }
  Variables: { user: JwtPayload }
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const payload = await verifyJwt(token, c.env.JWT_SECRET)
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('user', payload)
  await next()
})
