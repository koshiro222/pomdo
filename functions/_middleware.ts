import * as Sentry from '@sentry/cloudflare'

export const onRequest = Sentry.sentryPagesPlugin((context) => ({
  dsn: context.env.SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
}))
