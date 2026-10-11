import { z } from 'zod'
import { router, turnstileProcedure } from '../context'
import { updateSettings } from '../repositories/settings-repository'
import { isIanaTimeZone } from '../../core/domain/timezone'

const settingsInput = z.object({
  turnstileToken: z.string().optional(),
  soundMuted: z.boolean().optional(),
  soundVolume: z.number().min(0).max(1).optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
  timezone: z.string().min(1).max(64).refine(isIanaTimeZone, '不正な IANA timezone です').optional(),
})

export const settingsRouter = router({
  update: turnstileProcedure.input(settingsInput).mutation(({ ctx, input }) => {
    const { turnstileToken, ...settings } = input
    void turnstileToken
    return updateSettings(ctx.db, ctx.user.id, settings)
  }),
})
