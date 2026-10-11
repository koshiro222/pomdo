import { z } from 'zod'
import { router, protectedProcedure, turnstileProcedure } from '../context'
import { buildUserExport } from '../services/export-service'
import { deleteUser } from '../repositories/user-repository'

export const accountRouter = router({
  export: protectedProcedure.query(({ ctx }) => buildUserExport(ctx.db, ctx.user.id)),
  delete: turnstileProcedure.input(z.object({ turnstileToken: z.string().optional() })).mutation(async ({ ctx }) => {
    await deleteUser(ctx.db, ctx.user.id)
    return { deleted: true }
  }),
})
