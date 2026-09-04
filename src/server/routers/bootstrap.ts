import { z } from 'zod'
import { router, protectedProcedure } from '../context'
import { initializeBootstrap } from '../services/bootstrap-service'

export const bootstrapRouter = router({
  initialize: protectedProcedure.input(z.object({ timezone: z.string().min(1).max(64).optional() }).optional()).mutation(({ ctx, input }) => initializeBootstrap(ctx.db, ctx.user.id, input?.timezone, ctx.now)),
})
