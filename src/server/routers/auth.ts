import { router, protectedProcedure } from '../context'

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.user),
})
