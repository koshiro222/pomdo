import { useCallback, useRef } from 'react'
import { type TurnstileInstance } from '@marsidev/react-turnstile'

const DEV_TURNSTILE_TOKEN = 'e2e-turnstile-token'
const DEV_TURNSTILE_SITE_KEY = '1x00000000000000000000AA'

export type TurnstileTokenResolver = () => Promise<string | null>

export function useTurnstileToken() {
  const turnstileRef = useRef<TurnstileInstance>(null)
  const tokenRef = useRef<string | null>(null)
  const tokenResolutionRef = useRef<Promise<string | null> | null>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || (import.meta.env.DEV ? DEV_TURNSTILE_SITE_KEY : null)

  const storeTurnstileToken = useCallback((token: string) => {
    tokenRef.current = token
  }, [])
  const clearTurnstileToken = useCallback(() => {
    tokenRef.current = null
  }, [])
  const resolveTurnstileToken = useCallback<TurnstileTokenResolver>(async () => {
    if (import.meta.env.DEV) return DEV_TURNSTILE_TOKEN
    if (tokenRef.current) return tokenRef.current
    if (tokenResolutionRef.current) return tokenResolutionRef.current

    const resolution = (async () => {
      const turnstile = turnstileRef.current
      if (!turnstile) return null
      const currentToken = turnstile.getResponse()
      if (currentToken) return currentToken
      try {
        return await turnstile.getResponsePromise(10000, 250)
      } catch {
        return null
      }
    })()
    tokenResolutionRef.current = resolution
    try {
      const token = await resolution
      if (token) tokenRef.current = token
      return token
    } finally {
      if (tokenResolutionRef.current === resolution) tokenResolutionRef.current = null
    }
  }, [])

  return {
    ref: turnstileRef,
    siteKey,
    resolveTurnstileToken,
    onSuccess: storeTurnstileToken,
    onExpire: clearTurnstileToken,
    onError: clearTurnstileToken,
  }
}
