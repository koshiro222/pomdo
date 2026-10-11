type FocusStartProofPayload = {
  userId: string
  sessionId: string
  taskId: string | null
  startedAt: string
  plannedSecs: number
}

function encodeBase64Url(value: string): string {
  return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function encodeBytes(value: ArrayBuffer): string {
  let binary = ''
  for (const byte of new Uint8Array(value)) binary += String.fromCharCode(byte)
  return encodeBase64Url(binary)
}

async function signProof(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
  return encodeBytes(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))
}

export async function createFocusStartProof(secret: string, payload: FocusStartProofPayload): Promise<string> {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  return `${encodedPayload}.${await signProof(encodedPayload, secret)}`
}

export async function verifyFocusStartProof(secret: string, token: string): Promise<FocusStartProofPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [encodedPayload, signature] = parts
  if (!encodedPayload || !signature) return null
  if (signature !== await signProof(encodedPayload, secret)) return null
  try {
    const decoded = atob(encodedPayload.replaceAll('-', '+').replaceAll('_', '/'))
    const payload = JSON.parse(decoded) as Partial<FocusStartProofPayload>
    if (typeof payload.userId !== 'string' || typeof payload.sessionId !== 'string' || (typeof payload.taskId !== 'string' && payload.taskId !== null) || typeof payload.startedAt !== 'string' || typeof payload.plannedSecs !== 'number') return null
    return { userId: payload.userId, sessionId: payload.sessionId, taskId: payload.taskId, startedAt: payload.startedAt, plannedSecs: payload.plannedSecs }
  } catch {
    return null
  }
}
