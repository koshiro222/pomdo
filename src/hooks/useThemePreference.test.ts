import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemePreferenceProvider } from '../components/theme/ThemePreferenceProvider'
import { useThemePreference } from './useThemePreference'

function createMatchMedia(matches: boolean) {
  let listener: ((event: MediaQueryListEvent) => void) | undefined
  const mediaQuery = {
    matches,
    addEventListener: vi.fn((_event: string, callback: (event: MediaQueryListEvent) => void) => { listener = callback }),
    removeEventListener: vi.fn(),
    emit(nextMatches: boolean) {
      mediaQuery.matches = nextMatches
      listener?.({ matches: nextMatches } as MediaQueryListEvent)
    },
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQuery))
  return mediaQuery
}

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ThemePreferenceProvider, null, children)
}

describe('useThemePreference', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme')
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('localStorage の値を初期値にし、明示テーマの選択を同期的に反映する', () => {
    localStorage.setItem('pomdo-theme', 'dark')
    createMatchMedia(false)
    const { result } = renderHook(() => useThemePreference(), { wrapper })

    expect(result.current.theme).toBe('dark')
    expect(result.current.effectiveTheme).toBe('dark')

    act(() => result.current.selectTheme('light'))

    expect(result.current.theme).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'cmyk')
    expect(localStorage.getItem('pomdo-theme')).toBe('light')

    act(() => result.current.toggleTheme())

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement).toHaveAttribute('data-theme', 'sunset')
    expect(localStorage.getItem('pomdo-theme')).toBe('dark')
  })

  it('userId ごとに一度だけサーバーテーマを採用し、localStorage より優先する', () => {
    localStorage.setItem('pomdo-theme', 'dark')
    createMatchMedia(false)
    const { result } = renderHook(() => useThemePreference(), { wrapper })

    act(() => result.current.adoptServerTheme('user-1', 'light'))
    expect(result.current.theme).toBe('light')
    expect(localStorage.getItem('pomdo-theme')).toBe('light')

    act(() => result.current.adoptServerTheme('user-1', 'dark'))
    expect(result.current.theme).toBe('light')

    act(() => result.current.adoptServerTheme('user-2', 'dark'))
    expect(result.current.theme).toBe('dark')
  })

  it('system の OS 変更を購読し、解除後は更新しない', () => {
    localStorage.setItem('pomdo-theme', 'system')
    const mediaQuery = createMatchMedia(false)
    const { result, unmount } = renderHook(() => useThemePreference(), { wrapper })

    expect(result.current.effectiveTheme).toBe('light')

    act(() => mediaQuery.emit(true))
    expect(result.current.theme).toBe('system')
    expect(result.current.effectiveTheme).toBe('dark')
    expect(document.documentElement).not.toHaveAttribute('data-theme')

    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'cmyk')

    unmount()
    expect(mediaQuery.removeEventListener).toHaveBeenCalledOnce()
  })
})
