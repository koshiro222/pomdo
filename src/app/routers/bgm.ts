import { eq } from 'drizzle-orm'
import { router, publicProcedure, adminProcedure } from './context'
import { bgmGetAllInputSchema, createBgmTrackSchema } from './_shared'
import { TRPCError } from '@trpc/server'

export const bgmRouter = router({
  getAll: publicProcedure
    .input(bgmGetAllInputSchema)
    .query(async ({ ctx, input }) => {
      const { db } = ctx

      // 基本クエリ
      let query = db.select().from(ctx.schema.bgmTracks)

      // tierフィルタ（指定時のみ）
      if (input?.tier) {
        query = query.where(eq(ctx.schema.bgmTracks.tier, input.tier))
      }

      const tracks = await query

      // srcフィールドを生成（/api/bgm/filename）
      return tracks.map((track: any) => ({
        ...track,
        src: `/api/bgm/${track.filename}`,
      }))
    }),

  create: adminProcedure
    .input(createBgmTrackSchema)
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx

      // ファイルサイズチェック（Base64デコード後）
      const buffer = Uint8Array.from(atob(input.fileBase64), (c) => c.charCodeAt(0))
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

      if (buffer.byteLength > MAX_FILE_SIZE) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'ファイルサイズは10MB以下にしてください',
        })
      }

      // ファイル名生成（UUID）
      const filename = `${crypto.randomUUID()}.mp3`

      // R2にアップロード
      await ctx.env.BGM_BUCKET.put(filename, buffer, {
        httpMetadata: { contentType: 'audio/mpeg' },
      })

      // DBに登録
      const [created] = await db
        .insert(ctx.schema.bgmTracks)
        .values({
          title: input.title,
          artist: input.artist,
          color: input.color,
          filename,
          tier: input.tier ?? 'free',
        })
        .returning()

      return created
    }),
})
