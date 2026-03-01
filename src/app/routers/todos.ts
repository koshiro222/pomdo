import { z } from 'zod'
import { router, protectedProcedure } from './context'
import { newTodoSchema, updateTodoSchema } from './_shared'

export const todosRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx

    const todos = await db
      .select()
      .from(ctx.schema.todos)
      .where((t: any) => t.userId === user.sub)

    return todos
  }),

  create: protectedProcedure
    .input(newTodoSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx

      const [created] = await db
        .insert(ctx.schema.todos)
        .values({
          userId: user.sub,
          title: input.title,
          completed: false,
        })
        .returning()

      return created
    }),

  update: protectedProcedure
    .input(updateTodoSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx

      const existing = await db
        .select()
        .from(ctx.schema.todos)
        .where((t: any) => t.id === input.id && t.userId === user.sub)
        .limit(1)

      if (!existing || existing.length === 0) {
        throw new Error('Todo not found')
      }

      const updateData: any = {}
      if (input.title !== undefined) {
        updateData.title = input.title
      }
      if (input.completed !== undefined) {
        updateData.completed = input.completed
      }

      const updated = await db
        .update(ctx.schema.todos)
        .set(updateData)
        .where((t: any) => t.id === input.id && t.userId === user.sub)
        .returning()

      return updated[0]
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx

      const existing = await db
        .select()
        .from(ctx.schema.todos)
        .where((t: any) => t.id === input.id && t.userId === user.sub)
        .limit(1)

      if (!existing || existing.length === 0) {
        throw new Error('Todo not found')
      }

      await db
        .delete(ctx.schema.todos)
        .where((t: any) => t.id === input.id && t.userId === user.sub)

      return { id: input.id }
    }),
})
