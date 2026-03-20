import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'

type SessionUser = {
  id: string
  email: string
  name: string
  image: string | null
  role: 'admin' | 'user'
}

interface Context {
  user: SessionUser | null
  db: any
  schema: any
  env: {
    BGM_BUCKET: R2Bucket
  }
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

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'ログインが必要です',
    })
  }
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: '管理者権限が必要です',
    })
  }
  return next({
    ctx: { ...ctx, user: ctx.user },
  })
})
