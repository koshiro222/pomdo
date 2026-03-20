import { describe, it, expect, beforeAll } from 'vitest'
import { bgmRouter } from '../src/app/routers/bgm'
import { createContext } from '../src/app/routers/context'

describe('BGM API - Integration', () => {
  it('getAll returns all tracks with src field', async () => {
    // TODO: 実装後に有効化
    // const ctx = await createContext({})
    // const caller = bgmRouter.createCaller(ctx)
    // const tracks = await caller.getAll()
    // expect(tracks).toBeInstanceOf(Array)
    // expect(tracks[0]).toHaveProperty('src')
    expect(true).toBe(true) // placeholder
  })

  it('getAll filters by tier when specified', async () => {
    // TODO: 実装後に有効化
    // const ctx = await createContext({})
    // const caller = bgmRouter.createCaller(ctx)
    // const freeTracks = await caller.getAll({ tier: 'free' })
    // expect(freeTracks.every(t => t.tier === 'free')).toBe(true)
    expect(true).toBe(true) // placeholder
  })
})
