import { z } from 'zod'
import { eq, and, desc, asc } from 'drizzle-orm'
import { router, protectedProcedure } from './context'
import { newPomodoroSessionSchema } from './_shared'

export const pomodoroRouter = router({
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    const { db, user, schema } = ctx

    const sessions = await db
      .select()
      .from(schema.pomodoroSessions)
      .where(eq(schema.pomodoroSessions.userId, user.id))
      .orderBy(desc(schema.pomodoroSessions.startedAt))
      .limit(30)

    return sessions
  }),

  createSession: protectedProcedure
    .input(newPomodoroSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx

      const [created] = await db
        .insert(ctx.schema.pomodoroSessions)
        .values({
          userId: user.id,
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
      const { db, user, schema } = ctx

      const existing = await db
        .select()
        .from(schema.pomodoroSessions)
        .where(and(eq(schema.pomodoroSessions.id, input.id), eq(schema.pomodoroSessions.userId, user.id)))
        .limit(1)

      if (!existing || existing.length === 0) {
        throw new Error('Session not found')
      }

      const updated = await db
        .update(schema.pomodoroSessions)
        .set({ completedAt: new Date() })
        .where(and(eq(schema.pomodoroSessions.id, input.id), eq(schema.pomodoroSessions.userId, user.id)))
        .returning()

      return updated[0]
    }),
})
