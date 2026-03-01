import { z } from 'zod'
import { router, protectedProcedure } from './context'
import { newPomodoroSessionSchema } from './_shared'

export const pomodoroRouter = router({
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx

    const sessions = await db
      .select()
      .from(ctx.schema.pomodoroSessions)
      .where((t: any) => t.userId === user.sub)
      .orderBy((t: any) => t.startedAt)
      .limit(30)

    return sessions.reverse()
  }),

  createSession: protectedProcedure
    .input(newPomodoroSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx

      const [created] = await db
        .insert(ctx.schema.pomodoroSessions)
        .values({
          userId: user.sub,
          todoId: input.todoId || null,
          type: input.type,
          startedAt: new Date(input.startedAt),
          completedAt: null,
          durationSecs: input.durationSecs,
        })
        .returning()

      return created
    }),

  completeSession: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx

      const existing = await db
        .select()
        .from(ctx.schema.pomodoroSessions)
        .where((t: any) => t.id === input.id && t.userId === user.sub)
        .limit(1)

      if (!existing || existing.length === 0) {
        throw new Error('Session not found')
      }

      const updated = await db
        .update(ctx.schema.pomodoroSessions)
        .set({ completedAt: new Date() })
        .where((t: any) => t.id === input.id && t.userId === user.sub)
        .returning()

      return updated[0]
    }),
})
