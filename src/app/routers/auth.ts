import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from './context'

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized' })
    }

    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      image: ctx.user.image,
    }
  }),

  logout: publicProcedure.mutation(() => {
    return { ok: true }
  }),
})
