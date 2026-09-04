export type TurnstileEnvironment = {
  TURNSTILE_SECRET_KEY?: string
  E2E_TEST_MODE?: string
}

export async function verifyTurnstileToken(
  environment: TurnstileEnvironment,
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  if (environment.E2E_TEST_MODE === 'true' && token === 'e2e-turnstile-token') return true
  if (!environment.TURNSTILE_SECRET_KEY) return false

  const body = new URLSearchParams({ secret: environment.TURNSTILE_SECRET_KEY, response: token })
  if (remoteIp) body.set('remoteip', remoteIp)
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!response.ok) return false
  const result = await response.json() as { success?: boolean }
  return result.success === true
}
