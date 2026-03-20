/**
 * tRPCテスト用コンテキストヘルパー
 *
 * BGM mutationテストで使用するモックコンテキストを生成します。
 * adminユーザー、一般ユーザー、ゲストユーザーの各種コンテキストを簡単に作成できます。
 *
 * @example
 * ```ts
 * import { createAdminContext, createUserContext, createMockContext } from './helpers/trpc-context'
 *
 * // 管理者コンテキスト（create mutationのテストなど）
 * const adminCtx = createAdminContext()
 *
 * // 一般ユーザーコンテキスト（権限エラーのテストなど）
 * const userCtx = createUserContext()
 *
 * // ゲストコンテキスト（未ログイン時のテストなど）
 * const guestCtx = createMockContext()
 *
 * // カスタムコンテキスト
 * const customCtx = createMockContext({
 *   user: { id: 'custom-id', email: 'custom@example.com', name: 'Custom', role: 'user' }
 * })
 * ```
 */

import type { SessionUser } from '@/app/routers/context'

// モックスキーマ - Phase 04ではR2操作が主な検証対象のため、DB操作の詳細なモックは不要
const mockSchema = {
  bgmTracks: {},
}

// モックDB - チェーン可能なダミー関数
const mockDb = {
  select: () => mockDb,
  insert: () => mockDb,
  update: () => mockDb,
  delete: () => mockDb,
  from: () => mockDb,
  where: () => mockDb,
  values: () => mockDb,
  set: () => mockDb,
  returning: () => [],
  limit: () => mockDb,
  execute: async () => ({ rows: [] }),
}

export interface MockContext {
  user: SessionUser | null
  db: any
  schema: any
}

/**
 * モックコンテキストを生成
 * @param overrides - デフォルト値を上書きするオプション
 * @returns tRPC Contextインターフェースに準拠したモックオブジェクト
 */
export function createMockContext(overrides?: {
  user?: SessionUser | null
  db?: any
  schema?: any
}): MockContext {
  return {
    user: overrides?.user ?? null,
    db: overrides?.db ?? mockDb,
    schema: overrides?.schema ?? mockSchema,
  }
}

/**
 * 管理者ロールのコンテキストを生成
 * @returns adminロールのユーザーを含むモックコンテキスト
 */
export function createAdminContext(): MockContext {
  return createMockContext({
    user: {
      id: 'admin-id',
      email: 'admin@example.com',
      name: 'Admin User',
      image: null,
      role: 'admin',
    },
  })
}

/**
 * 一般ユーザーロールのコンテキストを生成
 * @returns userロールのユーザーを含むモックコンテキスト
 */
export function createUserContext(): MockContext {
  return createMockContext({
    user: {
      id: 'user-id',
      email: 'user@example.com',
      name: 'Regular User',
      image: null,
      role: 'user',
    },
  })
}
