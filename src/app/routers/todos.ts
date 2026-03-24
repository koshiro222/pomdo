import { z } from 'zod'
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure } from './context'
import { newTodoSchema, updateTodoSchema } from './_shared'

export const todosRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const { db, user } = ctx

    const todos = await db
      .select()
      .from(ctx.schema.todos)
      .where(eq(ctx.schema.todos.userId, user.id))
      .orderBy(ctx.schema.todos.order)

    return todos
  }),

  create: protectedProcedure
    .input(newTodoSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx

      // 現在の最大order値を取得
      const currentTodos = await db
        .select({ order: ctx.schema.todos.order })
        .from(ctx.schema.todos)
        .where(eq(ctx.schema.todos.userId, user.id))
        .orderBy(desc(ctx.schema.todos.order))
        .limit(1)

      const maxOrder = currentTodos.length > 0 ? currentTodos[0].order : -1
      const newOrder = maxOrder + 1

      const [created] = await db
        .insert(ctx.schema.todos)
        .values({
          userId: user.id,
          title: input.title,
          completed: false,
          completedPomodoros: 0,
          order: newOrder,
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
        .where(and(eq(ctx.schema.todos.id, input.id), eq(ctx.schema.todos.userId, user.id)))
        .limit(1)

      if (!existing || existing.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Todo not found' })
      }

      const updateData: any = {}
      if (input.title !== undefined) {
        updateData.title = input.title
      }
      if (input.completed !== undefined) {
        updateData.completed = input.completed
      }
      if (input.completedPomodoros !== undefined) {
        updateData.completedPomodoros = input.completedPomodoros
      }

      const updated = await db
        .update(ctx.schema.todos)
        .set(updateData)
        .where(and(eq(ctx.schema.todos.id, input.id), eq(ctx.schema.todos.userId, user.id)))
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
        .where(and(eq(ctx.schema.todos.id, input.id), eq(ctx.schema.todos.userId, user.id)))
        .limit(1)

      if (!existing || existing.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Todo not found' })
      }

      await db
        .delete(ctx.schema.todos)
        .where(and(eq(ctx.schema.todos.id, input.id), eq(ctx.schema.todos.userId, user.id)))

      return { id: input.id }
    }),

  reorder: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      newOrder: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, user, schema } = ctx
      const { id, newOrder } = input

      // 対象タスク取得
      const [target] = await db
        .select()
        .from(schema.todos)
        .where(and(eq(schema.todos.id, id), eq(schema.todos.userId, user.id)))
        .limit(1)

      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Todo not found' })
      }

      const oldOrder = target.order

      // 同じ位置なら何もしない
      if (oldOrder === newOrder) {
        return { success: true }
      }

      // 移動範囲を決定
      const [minOrder, maxOrder] = oldOrder < newOrder
        ? [oldOrder + 1, newOrder]
        : [newOrder, oldOrder - 1]

      // 範囲内のorderをシフト
      const shift = oldOrder < newOrder ? -1 : 1
      await db
        .update(schema.todos)
        .set({ order: sql`${schema.todos.order} + ${shift}` })
        .where(
          and(
            eq(schema.todos.userId, user.id),
            gte(schema.todos.order, minOrder),
            lte(schema.todos.order, maxOrder)
          )
        )

      // ターゲットを新しい位置に
      await db
        .update(schema.todos)
        .set({ order: newOrder })
        .where(eq(schema.todos.id, id))

      return { success: true }
    }),
})
