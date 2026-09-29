import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemePreferenceProvider } from '../theme/ThemePreferenceProvider'
import { LandingPage } from './LandingPage'

const DEMO_VIDEO_URL = 'https://pub-7e2638ec617c45a7a55b30232114a3a0.r2.dev/pomdo-demo.mp4'
const DEMO_VIDEO_DESCRIPTION = 'タイマーを始めたら、今やることに集中。終わったら、次のタスクへ進みます。'
const DEMO_VIDEO_ACCESSIBLE_NAME = 'Pomdoのタイマーとタスク操作を紹介する動画'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

type MotionPreferenceListener = (event: MediaQueryListEvent) => void

function createMediaQuery(query: string, initialMatches: boolean) {
  const listeners = new Set<MotionPreferenceListener>()
  const mediaQuery = {
    matches: initialMatches,
    media: query,
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === 'function') listeners.add(listener as MotionPreferenceListener)
    }),
    removeEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject) => {
      if (typeof listener === 'function') listeners.delete(listener as MotionPreferenceListener)
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  } as unknown as MediaQueryList

  return {
    mediaQuery,
    setMatches(matches: boolean) {
      Object.defineProperty(mediaQuery, 'matches', { configurable: true, value: matches })
      const event = { matches, media: query } as MediaQueryListEvent
      listeners.forEach((listener) => listener(event))
    },
  }
}

function stubMatchMedia(initialReducedMotion = false) {
  const queries = new Map<string, ReturnType<typeof createMediaQuery>>()
  const matchMedia = vi.fn((query: string) => {
    if (!queries.has(query)) {
      queries.set(query, createMediaQuery(query, query === REDUCED_MOTION_QUERY && initialReducedMotion))
    }
    return queries.get(query)!.mediaQuery
  })
  vi.stubGlobal('matchMedia', matchMedia)
  return { matchMedia, queries }
}

function renderLanding() {
  return render(
    <ThemePreferenceProvider>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </ThemePreferenceProvider>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('LandingPage', () => {
  it('通常設定では指定動画をミュートで自動再生し、CTAを表示する', () => {
    stubMatchMedia()
    const { container } = renderLanding()
    const video = container.querySelector('video')

    expect(video).not.toBeNull()
    expect(video).toHaveAttribute('src', DEMO_VIDEO_URL)
    expect(video).toHaveAttribute('autoplay')
    expect(video).toHaveProperty('muted', true)
    expect(video).toHaveAttribute('loop')
    expect(video).toHaveAttribute('playsinline')
    expect(video).not.toHaveAttribute('controls')
    expect(video).toHaveAttribute('aria-label', DEMO_VIDEO_ACCESSIBLE_NAME)
    expect(video).toHaveTextContent(DEMO_VIDEO_DESCRIPTION)
    expect(screen.queryByRole('slider', { name: 'デモの残り時間' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '使ってみる' })).toHaveAttribute('href', '/app')
  })

  it('reduced-motionの初期設定では静止した説明表示にして動画を読み込まない', () => {
    const { matchMedia } = stubMatchMedia(true)
    renderLanding()

    expect(matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY)
    expect(screen.queryByLabelText(DEMO_VIDEO_ACCESSIBLE_NAME)).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: `${DEMO_VIDEO_ACCESSIBLE_NAME}。${DEMO_VIDEO_DESCRIPTION}` })).toBeVisible()
    expect(screen.getByText(DEMO_VIDEO_DESCRIPTION)).toBeVisible()
    expect(screen.getByRole('link', { name: '使ってみる' })).toBeVisible()
  })

  it('動画エラーでは代替表示を出し、CTAと動画要素内フォールバックを保つ', () => {
    stubMatchMedia()
    const { container } = renderLanding()
    const video = container.querySelector('video')

    expect(video).toHaveTextContent(DEMO_VIDEO_DESCRIPTION)
    fireEvent.error(video!)

    expect(screen.getByRole('status')).toHaveTextContent('動画を再生できませんでした。')
    expect(screen.getByRole('status')).toHaveTextContent(DEMO_VIDEO_DESCRIPTION)
    expect(screen.queryByLabelText(DEMO_VIDEO_ACCESSIBLE_NAME)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '使ってみる' })).toBeVisible()
  })

  it('表示中にreduced-motionへ変わると動画を停止し、解除時にchange listenerを破棄する', () => {
    const { queries } = stubMatchMedia()
    const pauseVideo = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    const { container, unmount } = renderLanding()
    const motionQuery = queries.get(REDUCED_MOTION_QUERY)!

    expect(container.querySelector('video')).not.toBeNull()
    act(() => motionQuery.setMatches(true))

    expect(pauseVideo).toHaveBeenCalledOnce()
    expect(container.querySelector('video')).toBeNull()
    expect(screen.getByText(DEMO_VIDEO_DESCRIPTION)).toBeVisible()

    unmount()
    expect(motionQuery.mediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
