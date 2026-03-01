const ALG_PARAMS = { name: 'HMAC', hash: 'SHA-256' }

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
