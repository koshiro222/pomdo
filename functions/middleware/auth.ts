import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { jwt } from 'hono/jwt'

type Env = {
  Bindings: { JWT_SECRET: string }
  Variables: { user: jwt.JWTPayload }
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const token = getCookie(c, 'auth_token')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = jwt.verify(token, c.env.JWT_SECRET) as jwt.JWTPayload
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
})
