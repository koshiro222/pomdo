/**
 * R2バケットモック
 *
 * Cloudflare R2バケットのput/delete/get操作をシミュレートします。
 * テスト環境でファイルアップロード・削除の動作を検証するために使用します。
 *
 * @example
 * ```ts
 * import { createMockR2Bucket } from './helpers/r2-mock'
 *
 * const mockR2 = createMockR2Bucket()
 *
 * // アップロードをシミュレート
 * await mockR2.put('test.mp3', ArrayBuffer.from([1, 2, 3]), {
 *   httpMetadata: { contentType: 'audio/mpeg' }
 * })
 *
 * // アップロードされたキーを確認
 * console.log(mockR2.getPutKeys()) // ['test.mp3']
 *
 * // 取得をシミュレート
 * const result = await mockR2.get('test.mp3')
 * const data = result?.arrayBuffer()
 *
 * // 削除をシミュレート
 * await mockR2.delete('test.mp3')
 * console.log(mockR2.getDeletedKeys()) // ['test.mp3']
 * ```
 */

export interface MockR2Bucket {
  put: (key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType: string } }) => Promise<void>
  delete: (key: string) => Promise<void>
  get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> } | null>
  getPutKeys: () => string[]
  getDeletedKeys: () => string[]
}

export function createMockR2Bucket(): MockR2Bucket {
  const storage = new Map<string, ArrayBuffer>()
  const putKeys: string[] = []
  const deletedKeys: string[] = []

  return {
    put: async (key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType: string } }) => {
      storage.set(key, value)
      putKeys.push(key)
    },

    delete: async (key: string) => {
      storage.delete(key)
      deletedKeys.push(key)
    },

    get: async (key: string) => {
      const value = storage.get(key)
      if (!value) return null
      return { arrayBuffer: async () => value }
    },

    getPutKeys: () => [...putKeys],
    getDeletedKeys: () => [...deletedKeys],
  }
}
