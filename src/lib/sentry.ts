import * as Sentry from '@sentry/react'

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
if (dsn) Sentry.init({ dsn, sendDefaultPii: false, tracesSampleRate: 0.1 })

export { Sentry }
