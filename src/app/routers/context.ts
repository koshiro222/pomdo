import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'

type SessionUser = {
  id: string
  email: string
  name: string
  image: string | null
}

interface Context {
  user: SessionUser | null
  db: any
  schema: any
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Unauthorized',
    })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})
