import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, initializeTheme, readStoredTheme, resolveDaisyTheme, resolveEffectiveTheme, resolveNextTheme } from './theme'

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches }))
}

describe('theme', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    mockMatchMedia(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('明示テーマをそのまま実効テーマとして解決する', () => {
    expect(resolveEffectiveTheme('light')).toBe('light')
    expect(resolveEffectiveTheme('dark')).toBe('dark')
  })

  it('明示テーマをdaisyUIのcorporate/businessへ対応付ける', () => {
    expect(resolveDaisyTheme('light')).toBe('corporate')
    expect(resolveDaisyTheme('dark')).toBe('business')
  })

  it('system は OS の color scheme から実効テーマを解決する', () => {
    mockMatchMedia(true)
    expect(resolveEffectiveTheme('system')).toBe('dark')

    mockMatchMedia(false)
    expect(resolveEffectiveTheme('system')).toBe('light')
  })

  it('次のテーマは system の実効テーマと反対の明示テーマになる', () => {
    mockMatchMedia(true)
    expect(resolveNextTheme('system')).toBe('light')
    expect(resolveNextTheme('dark')).toBe('light')

    mockMatchMedia(false)
    expect(resolveNextTheme('system')).toBe('dark')
    expect(resolveNextTheme('light')).toBe('dark')
  })

  it('明示テーマと system を document と localStorage に適用する', () => {
    applyTheme('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'business')
    expect(localStorage.getItem('pomdo-theme')).toBe('dark')

    applyTheme('system')
    expect(document.documentElement).not.toHaveAttribute('data-theme')
    expect(localStorage.getItem('pomdo-theme')).toBe('system')
  })

  it('initializeTheme は保存値を返し、既存の初期化契約を維持する', () => {
    localStorage.setItem('pomdo-theme', 'light')

    expect(initializeTheme()).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'corporate')
    expect(readStoredTheme()).toBe('light')
  })
})
