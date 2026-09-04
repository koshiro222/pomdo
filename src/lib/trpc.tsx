/* eslint-disable react-refresh/only-export-components */
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../server/routers/root'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson'

export const trpc = createTRPCReact<AppRouter>()

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
})

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: import.meta.env.VITE_API_URL || '/api/trpc',
        transformer: superjson,
        headers: () => {
          const e2eNow = window.localStorage.getItem('pomdo-e2e-now')
          return e2eNow ? { 'x-e2e-now': e2eNow } : {}
        },
      }),
    ],
  })

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
