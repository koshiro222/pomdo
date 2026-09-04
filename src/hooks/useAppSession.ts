import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { queryClient, trpc } from '../lib/trpc'

let anonymousSignInInFlight: Promise<unknown> | null = null
let activeSessionUserId: string | null = null
let bootstrappedSessionUserId: string | null = null

export function useAppSession() {
  const auth = useAuth()
  const { loading, signInAnonymous, user } = auth
  const bootstrap = trpc.bootstrap.initialize.useMutation()
  const [bootstrappedUserId, setBootstrappedUserId] = useState<string | null>(() => bootstrappedSessionUserId)
  const [bootstrapFailedUserId, setBootstrapFailedUserId] = useState<string | null>(null)
  const [anonymousAuthError, setAnonymousAuthError] = useState(false)
  const anonymousRequestInFlight = useRef(false)
  const anonymousSignInAttempted = useRef(false)
  const requestedUserId = useRef<string | null>(null)

  useEffect(() => {
    const currentUserId = auth.user?.id ?? null
    if (activeSessionUserId !== currentUserId) {
      queryClient.clear()
      activeSessionUserId = currentUserId
      bootstrappedSessionUserId = null
    }
  }, [auth.user?.id])

  useEffect(() => {
    if (loading || user || anonymousAuthError || anonymousRequestInFlight.current || anonymousSignInAttempted.current) return
    anonymousSignInAttempted.current = true
    anonymousRequestInFlight.current = true
    const request = anonymousSignInInFlight ?? (anonymousSignInInFlight = Promise.resolve().then(() => signInAnonymous()))
    void request.catch(() => { anonymousSignInAttempted.current = false; setAnonymousAuthError(true) }).finally(() => {
      anonymousRequestInFlight.current = false
      if (anonymousSignInInFlight === request) anonymousSignInInFlight = null
    })
  }, [anonymousAuthError, loading, signInAnonymous, user])

  useEffect(() => {
    if (!auth.user || bootstrapFailedUserId === auth.user.id || requestedUserId.current === auth.user.id) return
    if (bootstrappedSessionUserId === auth.user.id) return
    requestedUserId.current = auth.user.id
    const userId = auth.user.id
    bootstrap.mutate({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }, {
      onSuccess: () => {
        if (activeSessionUserId !== userId) return
        bootstrappedSessionUserId = userId
        setBootstrapFailedUserId(null)
        setBootstrappedUserId(userId)
      },
      onError: () => {
        if (activeSessionUserId !== userId) return
        requestedUserId.current = null
        setBootstrapFailedUserId(userId)
      },
    })
  }, [auth.user, bootstrap, bootstrapFailedUserId])

  const retryBootstrap = useCallback(() => {
    if (!auth.user) return
    requestedUserId.current = null
    setBootstrapFailedUserId(null)
  }, [auth.user])

  const retryAnonymousSignIn = useCallback(() => setAnonymousAuthError(false), [])

  return { ...auth, ready: Boolean(auth.user && bootstrappedUserId === auth.user.id), bootstrapError: Boolean(auth.user && bootstrapFailedUserId === auth.user.id), retryBootstrap, anonymousAuthError, retryAnonymousSignIn }
}
