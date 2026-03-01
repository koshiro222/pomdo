import { router, publicProcedure } from './context'

export const authRouter = router({
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new Error('Unauthorized')
    }

    return {
      sub: ctx.user.sub,
      email: ctx.user.email,
      name: ctx.user.name,
      avatarUrl: ctx.user.avatarUrl,
      iat: ctx.user.iat,
      exp: ctx.user.exp,
    }
  }),

  logout: publicProcedure.mutation(() => {
    // Cookie の削除はミドルウェア側で行う
    return { ok: true }
  }),
})
