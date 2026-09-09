// @vitest-environment node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { asc, eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '../db/client'
import { tasks, users } from '../db/schema'
import { confirmTaskDecomposition } from '../services/task-decomposition-service'
import { replaceTaskWithDecomposedTasks } from './task-repository'

describe('Task decomposition repository', () => {
  let client: PGlite
  let db: TestDb

  beforeEach(async () => {
    client = new PGlite()
    await client.exec(readFileSync(resolve(process.cwd(), 'drizzle/0000_v1_initial.sql'), 'utf8'))
    await client.exec(readFileSync(resolve(process.cwd(), 'drizzle/0001_v1_constraints.sql'), 'utf8'))
    db = createTestDb(client)
  })

  afterEach(async () => { await client.close() })

  async function createUser(userId = crypto.randomUUID()): Promise<string> {
    await db.insert(users).values({ id: userId, name: 'Test', email: `${userId}@example.com` })
    return userId
  }

  it('Todayの元Taskを3件へ置換し、位置とplannedForとestimateを引き継ぐ', async () => {
    const userId = await createUser()
    const sourceTaskId = crypto.randomUUID()
    await db.insert(tasks).values([
      { id: crypto.randomUUID(), userId, title: '前', plannedFor: '2026-09-04', deckOrder: 'a0' },
      { id: sourceTaskId, userId, title: '大きな作業', plannedFor: '2026-09-04', deckOrder: 'a1' },
      { id: crypto.randomUUID(), userId, title: '後', plannedFor: '2026-09-04', deckOrder: 'a2' },
    ])

    const plan = await confirmTaskDecomposition({
      db, userId, taskId: sourceTaskId, today: '2026-09-04',
      items: [{ title: '最初にする', note: null }, { title: '次にする' }, { title: '最後にする', note: 'メモ' }],
    })
    const storedTasks = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.deckOrder))

    expect(plan?.replacementTasks).toHaveLength(3)
    expect(storedTasks.map((task) => task.title)).toEqual(['前', '最初にする', '次にする', '最後にする', '後'])
    expect(storedTasks.filter((task) => task.title !== '前' && task.title !== '後').every((task) => task.plannedFor === '2026-09-04' && task.estimate === 1 && task.completedAt === null)).toBe(true)
    expect(storedTasks.some((task) => task.id === sourceTaskId)).toBe(false)
  })

  it('Todayの前後キーが枯渇している場合は一覧全体を再採番して位置を保つ', async () => {
    const userId = await createUser()
    const sourceTaskId = crypto.randomUUID()
    const previousTaskId = crypto.randomUUID()
    const nextTaskId = crypto.randomUUID()
    await db.insert(tasks).values([
      { id: previousTaskId, userId, title: '前', plannedFor: '2026-09-04', deckOrder: 'a0' },
      { id: sourceTaskId, userId, title: '元', plannedFor: '2026-09-04', deckOrder: 'a01' },
      { id: nextTaskId, userId, title: '後', plannedFor: '2026-09-04', deckOrder: 'a010' },
    ])

    await confirmTaskDecomposition({
      db, userId, taskId: sourceTaskId, today: '2026-09-04',
      items: [{ title: '一' }, { title: '二' }, { title: '三' }],
    })
    const storedTasks = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(asc(tasks.deckOrder))

    expect(storedTasks.map((task) => task.title)).toEqual(['前', '一', '二', '三', '後'])
    expect(storedTasks.find((task) => task.id === nextTaskId)?.deckOrder).not.toBe('a010')
  })

  it('Backlogの分解ではplannedForとdeckOrderをnullにする', async () => {
    const userId = await createUser()
    const sourceTaskId = crypto.randomUUID()
    await db.insert(tasks).values({ id: sourceTaskId, userId, title: 'Backlog', plannedFor: null, deckOrder: null })

    await confirmTaskDecomposition({ db, userId, taskId: sourceTaskId, today: '2026-09-04', items: [{ title: '分解したTask' }] })
    const storedTasks = await db.select().from(tasks).where(eq(tasks.userId, userId))

    expect(storedTasks).toHaveLength(1)
    expect(storedTasks[0]).toMatchObject({ title: '分解したTask', plannedFor: null, deckOrder: null, estimate: 1, completedAt: null })
  })

  it('元TaskがNowなら生成された先頭TaskをNowにし、Nowでなければ既存Nowを保つ', async () => {
    const userId = await createUser()
    const sourceTaskId = crypto.randomUUID()
    const otherNowTaskId = crypto.randomUUID()
    await db.insert(tasks).values([
      { id: sourceTaskId, userId, title: 'Nowになる元', plannedFor: '2026-09-04', deckOrder: 'a0' },
      { id: otherNowTaskId, userId, title: '既存Now', plannedFor: '2026-09-04', deckOrder: 'a1' },
    ])
    await db.update(users).set({ currentTaskId: sourceTaskId }).where(eq(users.id, userId))

    const nowPlan = await confirmTaskDecomposition({ db, userId, taskId: sourceTaskId, today: '2026-09-04', items: [{ title: '先頭' }, { title: '後続' }] })
    const nowUser = (await db.select().from(users).where(eq(users.id, userId)))[0]
    expect(nowUser?.currentTaskId).toBe(nowPlan?.replacementTasks[0]?.id)

    const sourceWithoutNowId = nowPlan?.replacementTasks[1]?.id
    if (!sourceWithoutNowId) throw new Error('テスト用Taskが作成されませんでした')
    await db.update(users).set({ currentTaskId: otherNowTaskId }).where(eq(users.id, userId))
    await confirmTaskDecomposition({ db, userId, taskId: sourceWithoutNowId, today: '2026-09-04', items: [{ title: 'さらに分解' }] })
    const unchangedNowUser = (await db.select().from(users).where(eq(users.id, userId)))[0]
    expect(unchangedNowUser?.currentTaskId).toBe(otherNowTaskId)
  })

  it('完了済みTaskも元の完了状態を引き継がず未完了Taskへ置換する', async () => {
    const userId = await createUser()
    const sourceTaskId = crypto.randomUUID()
    await db.insert(tasks).values({ id: sourceTaskId, userId, title: '完了済み', completedAt: new Date('2026-09-03T00:00:00.000Z'), plannedFor: null, deckOrder: null })

    await confirmTaskDecomposition({ db, userId, taskId: sourceTaskId, today: '2026-09-04', items: [{ title: 'やり直す' }] })
    const replacement = (await db.select().from(tasks).where(eq(tasks.userId, userId)))[0]
    expect(replacement).toMatchObject({ title: 'やり直す', completedAt: null, estimate: 1 })
  })

  it('insert失敗時は元TaskとNowを含む変更をロールバックする', async () => {
    const userId = await createUser()
    const sourceTaskId = crypto.randomUUID()
    await db.insert(tasks).values({ id: sourceTaskId, userId, title: '元', plannedFor: null })
    await db.update(users).set({ currentTaskId: sourceTaskId }).where(eq(users.id, userId))

    await expect(replaceTaskWithDecomposedTasks(db, userId, sourceTaskId, {
      replacementTasks: [{ id: crypto.randomUUID(), userId: '存在しないユーザー', title: '壊れるTask', estimate: 1, plannedFor: null, deckOrder: null, completedAt: null }],
      deckOrderUpdates: [],
      currentTaskReplacementId: null,
    })).rejects.toThrow()
    expect(await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, sourceTaskId))).toHaveLength(1)
    expect((await db.select().from(users).where(eq(users.id, userId)))[0]?.currentTaskId).toBe(sourceTaskId)
  })

  it('Now更新失敗時はinsertと元Task削除をロールバックする', async () => {
    const userId = await createUser()
    const sourceTaskId = crypto.randomUUID()
    await db.insert(tasks).values({ id: sourceTaskId, userId, title: '元', plannedFor: null })
    await db.update(users).set({ currentTaskId: sourceTaskId }).where(eq(users.id, userId))

    await expect(replaceTaskWithDecomposedTasks(db, userId, sourceTaskId, {
      replacementTasks: [{ id: crypto.randomUUID(), userId, title: '一時Task', estimate: 1, plannedFor: null, deckOrder: null, completedAt: null }],
      deckOrderUpdates: [],
      currentTaskReplacementId: crypto.randomUUID(),
    })).rejects.toThrow()
    expect(await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, sourceTaskId))).toHaveLength(1)
    expect(await db.select({ title: tasks.title }).from(tasks).where(eq(tasks.title, '一時Task'))).toHaveLength(0)
    expect((await db.select().from(users).where(eq(users.id, userId)))[0]?.currentTaskId).toBe(sourceTaskId)
  })

  it('他ユーザーのTask IDでは分解せず元Taskを変更しない', async () => {
    const ownerId = await createUser()
    const otherUserId = await createUser()
    const foreignTaskId = crypto.randomUUID()
    await db.insert(tasks).values({ id: foreignTaskId, userId: otherUserId, title: '他人のTask' })

    await expect(confirmTaskDecomposition({ db, userId: ownerId, taskId: foreignTaskId, today: '2026-09-04', items: [{ title: '変更しない' }] })).resolves.toBeNull()
    expect(await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, foreignTaskId))).toHaveLength(1)
  })
})
