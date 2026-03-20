import { eq } from 'drizzle-orm'
import { router, publicProcedure } from './context'
import { bgmGetAllInputSchema } from './_shared'

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
})
