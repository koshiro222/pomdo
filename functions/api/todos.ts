import { Hono } from 'hono'
import { createDb } from '../lib/db'
import { todos, type NewTodo } from '../lib/schema'
import { eq, and } from 'drizzle-orm'
import { authMiddleware, type Env } from '../middleware/auth'

type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Env['Variables'] }>()

// Apply auth middleware to all routes
app.use('/*', authMiddleware)

// GET /api/todos - Get all todos for the authenticated user
app.get('/', async (c) => {
  const user = c.get('user')
  const db = createDb(c.env.DATABASE_URL)

  const userTodos = await db
    .select()
    .from(todos)
    .where(eq(todos.userId, user.sub))
    .orderBy(todos.createdAt)

  return c.json({
    success: true,
    data: userTodos,
  })
})

// POST /api/todos - Create a new todo
app.post('/', async (c) => {
  const user = c.get('user')
  const db = createDb(c.env.DATABASE_URL)

  const body = await c.req.json<{ title: string }>()

  if (!body.title || body.title.trim() === '') {
    return c.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Title is required' },
      },
      400,
    )
  }

  const newTodo: NewTodo = {
    userId: user.sub,
    title: body.title.trim(),
    completed: false,
  }

  const [created] = await db.insert(todos).values(newTodo).returning()

  return c.json({
    success: true,
    data: created,
  })
})

// PATCH /api/todos/:id - Update a todo
app.patch('/:id', async (c) => {
  const user = c.get('user')
  const db = createDb(c.env.DATABASE_URL)
  const id = c.req.param('id')

  const body = await c.req.json<{ title?: string; completed?: boolean }>()

  if (body.title !== undefined && body.title.trim() === '') {
    return c.json(
      {
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Title cannot be empty' },
      },
      400,
    )
  }

  // Check if todo exists and belongs to user
  const [existing] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, user.sub)))

  if (!existing) {
    return c.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Todo not found' },
      },
      404,
    )
  }

  const updateData: Partial<NewTodo> = {}
  if (body.title !== undefined) {
    updateData.title = body.title.trim()
  }
  if (body.completed !== undefined) {
    updateData.completed = body.completed
  }

  const [updated] = await db
    .update(todos)
    .set(updateData)
    .where(and(eq(todos.id, id), eq(todos.userId, user.sub)))
    .returning()

  return c.json({
    success: true,
    data: updated,
  })
})

// DELETE /api/todos/:id - Delete a todo
app.delete('/:id', async (c) => {
  const user = c.get('user')
  const db = createDb(c.env.DATABASE_URL)
  const id = c.req.param('id')

  // Check if todo exists and belongs to user
  const [existing] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, user.sub)))

  if (!existing) {
    return c.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Todo not found' },
      },
      404,
    )
  }

  await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, user.sub)))

  return c.json({
    success: true,
    data: { id },
  })
})

export default app
