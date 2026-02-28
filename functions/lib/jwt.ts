const ALGORITHM = 'HS256'
const ALG_PARAMS = { name: 'HMAC', hash: 'SHA-256' }

export type JwtPayload = {
  sub: string       // user UUID
  email: string
  name: string
  avatarUrl?: string
  iat: number
  exp: number
}

async function importKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    ALG_PARAMS,
    false,
    ['sign', 'verify'],
  )
}

function base64urlEncode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - (str.length % 4)) % 4, '=')
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

export async function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, secret: string, expiresInSecs = 60 * 60 * 24 * 7): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JwtPayload = { ...payload, iat: now, exp: now + expiresInSecs }

  const enc = new TextEncoder()
  const header = base64urlEncode(enc.encode(JSON.stringify({ alg: ALGORITHM, typ: 'JWT' })))
  const body = base64urlEncode(enc.encode(JSON.stringify(fullPayload)))
  const signingInput = `${header}.${body}`

  const key = await importKey(secret)
  const signature = await crypto.subtle.sign(ALG_PARAMS, key, enc.encode(signingInput))

  return `${signingInput}.${base64urlEncode(signature)}`
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [header, body, sig] = parts
  const enc = new TextEncoder()
  const key = await importKey(secret)

  const valid = await crypto.subtle.verify(
    ALG_PARAMS,
    key,
    base64urlDecode(sig),
    enc.encode(`${header}.${body}`),
  )
  if (!valid) return null

  const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(body))) as JwtPayload
  if (payload.exp < Math.floor(Date.now() / 1000)) return null

  return payload
}

export async function signHmac(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await importKey(secret)
  const sig = await crypto.subtle.sign(ALG_PARAMS, key, enc.encode(data))
  return base64urlEncode(sig)
}

export async function verifyHmac(data: string, sig: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder()
  const key = await importKey(secret)
  return crypto.subtle.verify(ALG_PARAMS, key, base64urlDecode(sig), enc.encode(data))
}
