import { describe, it, expect } from 'vitest'
import { bgmTrackSchema, bgmGetAllInputSchema } from '../src/app/routers/_shared'

describe('BGM Router - Unit', () => {
  describe('bgmTrackSchema', () => {
    it('validates track structure', () => {
      const validTrack = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Track',
        src: '/api/bgm/test.mp3',
        tier: 'free',
        createdAt: '2026-03-20T00:00:00Z',
        updatedAt: '2026-03-20T00:00:00Z',
      }
      expect(() => bgmTrackSchema.parse(validTrack)).not.toThrow()
    })

    it('requires id, title, src, tier', () => {
      const invalidTrack = { title: 'Test' }
      expect(() => bgmTrackSchema.parse(invalidTrack)).toThrow()
    })
  })

  describe('bgmGetAllInputSchema', () => {
    it('accepts tier filter', () => {
      const input = { tier: 'free' }
      expect(() => bgmGetAllInputSchema.parse(input)).not.toThrow()
    })

    it('accepts undefined (no filter)', () => {
      expect(() => bgmGetAllInputSchema.parse(undefined)).not.toThrow()
    })
  })
})
