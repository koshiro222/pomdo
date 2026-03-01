import { Hono } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import { eq } from 'drizzle-orm'
import { createDb } from '../lib/db'
import { users } from '../lib/schema'
import { jwt, sign, verify } from 'hono/jwt'
import { signHmac, verifyHmac } from '../lib/hmac'
import { authMiddleware } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_REDIRECT_URI: string
  JWT_SECRET: string
  APP_URL: string
}

type Variables = {
  user: jwt.JWTPayload
}

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/auth/google → Google 認証 URL へリダイレクト
auth.get('/google', async (c) => {
  const state = crypto.randomUUID()
  const stateSig = await signHmac(state, c.env.JWT_SECRET)
  const stateParam = `${state}.${stateSig}`

  setCookie(c, 'oauth_state', stateParam, {
    httpOnly: true,
    secure: c.req.url.startsWith('https'),
    sameSite: 'Lax',
    maxAge: 60 * 10, // 10分
    path: '/',
  })

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: c.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state: stateParam,
    access_type: 'offline',
    prompt: 'select_account',
  })

  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

// GET /api/auth/google/callback → code → token 交換 → JWT 発行
auth.get('/google/callback', async (c) => {
  const { code, state, error } = c.req.query()
  const appUrl = c.env.APP_URL

  if (error || !code || !state) {
    return c.redirect(`${appUrl}?auth_error=cancelled`)
  }

  // state 検証
  const cookieState = getCookie(c, 'oauth_state')
  if (!cookieState || cookieState !== state) {
    return c.redirect(`${appUrl}?auth_error=invalid_state`)
  }

  const [stateValue, stateSig] = state.split('.')
  const stateValid = await verifyHmac(stateValue, stateSig, c.env.JWT_SECRET)
  if (!stateValid) {
    return c.redirect(`${appUrl}?auth_error=invalid_state`)
  }

  deleteCookie(c, 'oauth_state', { path: '/' })

  // Google に code を送って access_token 取得
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: c.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return c.redirect(`${appUrl}?auth_error=token_exchange_failed`)
  }

  const { access_token } = await tokenRes.json<{ access_token: string }>()

  // Google ユーザー情報取得
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  if (!userInfoRes.ok) {
    return c.redirect(`${appUrl}?auth_error=userinfo_failed`)
  }

  const googleUser = await userInfoRes.json<{
    sub: string
    email: string
    name: string
    picture?: string
  }>()

  // DB に UPSERT
  const db = createDb(c.env.DATABASE_URL)
  const [user] = await db
    .insert(users)
    .values({
      googleId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    })
    .onConflictDoUpdate({
      target: users.googleId,
      set: {
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
        updatedAt: new Date(),
      },
    })
    .returning()

  // JWT 発行
  const token = await sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl ?? undefined,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    },
    c.env.JWT_SECRET,
  )

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: c.req.url.startsWith('https'),
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7, // 7日
    path: '/',
  })

  return c.redirect(appUrl)
})

// GET /api/auth/me → ユーザー情報返却
auth.get('/me', authMiddleware, async (c) => {
  const token = getCookie(c, 'auth_token')!
  const payload = await verify(token, c.env.JWT_SECRET, 'HS256') as jwt.JWTPayload
  return c.json({ user: payload })
})

// POST /api/auth/logout → Cookie 削除
auth.post('/logout', (c) => {
  deleteCookie(c, 'auth_token', { path: '/' })
  return c.json({ ok: true })
})

export default auth
