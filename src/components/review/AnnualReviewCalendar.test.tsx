import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnnualReviewCalendar } from './AnnualReviewCalendar'

// 365日分のDOMをV8 coverageで計測すると既定のテスト時間を超えるため延長する。
vi.setConfig({ testTimeout: 15_000 })

let originalMatchMedia: PropertyDescriptor | undefined

function makeCalendarDays(year: number, records: Record<string, number> = {}) {
  const firstDay = new Date(0)
  firstDay.setUTCFullYear(year, 0, 1)
  firstDay.setUTCHours(0, 0, 0, 0)
  const daysInYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365
  return Array.from({ length: daysInYear }, (_, index) => {
    const date = new Date(firstDay.getTime())
    date.setUTCDate(date.getUTCDate() + index)
    const dateString = date.toISOString().slice(0, 10)
    return {
      date: dateString,
      totalFocusSecs: records[dateString] ?? 0,
      completedFocusCount: records[dateString] ? 1 : 0,
      interruptedFocusCount: 0,
    }
  })
}

function stubViewport(isMobile: boolean) {
  originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia')
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn((query: string) => ({
    matches: query === '(max-width: 767px)' && isMobile,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) })
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (originalMatchMedia) Object.defineProperty(window, 'matchMedia', originalMatchMedia)
  else Reflect.deleteProperty(window, 'matchMedia')
  originalMatchMedia = undefined
})

describe('AnnualReviewCalendar', () => {
  it('年内の全日を同じボタンで表示し、未来日は表示時間と色を0秒にする', () => {
    const { container } = render(<AnnualReviewCalendar
      todayDate="2026-01-02"
      calendarDays={makeCalendarDays(2026, { '2026-01-03': 3_600 })}
    />)

    const today = screen.getByRole('button', { name: '2026年1月2日、金曜日、集中時間 0分' })
    const pastZero = screen.getByRole('button', { name: '2026年1月1日、木曜日、集中時間 0分' })
    const future = screen.getByRole('button', { name: '2026年1月3日、土曜日、集中時間 0分' })
    expect(today).toHaveAttribute('aria-current', 'date')
    expect(today).toHaveAttribute('tabindex', '0')
    expect(pastZero).toHaveAttribute('data-focus-level', '0')
    expect(future).toHaveAttribute('data-focus-level', '0')
    expect(future).not.toHaveAttribute('title')
    expect(future).not.toHaveClass('is-future')
    expect(container.querySelectorAll('.annual-calendar-day')).toHaveLength(365)
    expect(container.querySelectorAll('.annual-calendar-day[tabindex="0"]')).toHaveLength(1)
    expect(container.querySelector('[data-date="2025-12-31"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-date="2027-01-01"]')).not.toBeInTheDocument()
    expect(screen.queryByText('これからの日')).not.toBeInTheDocument()
    expect(screen.queryByText('1マスが1日です')).not.toBeInTheDocument()
  }, 10_000)

  it('強度の境界値とLess・5色・Moreの凡例を表示する', () => {
    const { container } = render(<AnnualReviewCalendar
      todayDate="2026-01-09"
      calendarDays={makeCalendarDays(2026, {
        '2026-01-02': 1,
        '2026-01-03': 1_799,
        '2026-01-04': 1_800,
        '2026-01-05': 3_599,
        '2026-01-06': 3_600,
        '2026-01-07': 7_199,
        '2026-01-08': 7_200,
      })}
    />)

    for (const [date, level] of Object.entries({
      '2026-01-01': '0',
      '2026-01-02': '1',
      '2026-01-03': '1',
      '2026-01-04': '2',
      '2026-01-05': '2',
      '2026-01-06': '3',
      '2026-01-07': '3',
      '2026-01-08': '4',
    })) {
      expect(container.querySelector(`[data-date="${date}"]`)).toHaveAttribute('data-focus-level', level)
    }

    const legend = screen.getByRole('list', { name: '集中時間の凡例' })
    expect(within(legend).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Less', '0秒', '1〜1799秒', '1800〜3599秒', '3600〜7199秒', '7200秒以上', 'More',
    ])
    expect(legend.querySelectorAll('.annual-calendar-swatch')).toHaveLength(5)
  })

  it('hoverで独自tooltipを表示し、離れると閉じる', async () => {
    const user = userEvent.setup()
    render(<AnnualReviewCalendar todayDate="2026-10-06" calendarDays={makeCalendarDays(2026)} />)
    const future = screen.getByRole('button', { name: '2026年10月7日、水曜日、集中時間 0分' })

    await user.hover(future)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('2026年10月7日（水）')
    expect(tooltip).toHaveTextContent('集中時間 0分')
    expect(future).toHaveAttribute('aria-describedby', tooltip.id)
    expect(future).not.toHaveAttribute('title')

    await user.unhover(future)
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
    expect(future).not.toHaveAttribute('aria-describedby')
  }, 10_000)

  it('フォーカスが日セル外でもEscapeでtooltipを閉じる', async () => {
    const user = userEvent.setup()
    render(<>
      <button type="button">outside</button>
      <AnnualReviewCalendar todayDate="2026-10-06" calendarDays={makeCalendarDays(2026)} />
    </>)
    const future = screen.getByRole('button', { name: '2026年10月7日、水曜日、集中時間 0分' })

    await user.hover(future)
    expect(screen.getByRole('tooltip')).toBeVisible()
    act(() => screen.getByRole('button', { name: 'outside' }).focus())
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it.each([
    { viewport: 'desktop', isMobile: false, arrow: '{ArrowRight}', target: '2026年1月9日、金曜日、集中時間 0分' },
    { viewport: 'mobile', isMobile: true, arrow: '{ArrowRight}', target: '2026年1月3日、土曜日、集中時間 0分' },
  ])('$viewportでTabと矢印キーから日情報へ移動できる', async ({ isMobile, arrow, target }) => {
    stubViewport(isMobile)
    const user = userEvent.setup()
    render(<>
      <button type="button">before</button>
      <AnnualReviewCalendar todayDate="2026-01-02" calendarDays={makeCalendarDays(2026)} />
      <button type="button">after</button>
    </>)

    await user.tab()
    expect(screen.getByRole('button', { name: 'before' })).toHaveFocus()
    await user.tab()
    const today = screen.getByRole('button', { name: '2026年1月2日、金曜日、集中時間 0分' })
    expect(today).toHaveFocus()
    expect(screen.getByRole('tooltip')).toHaveTextContent('2026年1月2日（金）')

    await user.keyboard(arrow)
    expect(screen.getByRole('button', { name: target })).toHaveFocus()
    expect(screen.getByRole('tooltip')).toHaveTextContent(target.match(/2026年\d+月\d+日/)?.[0] ?? '')

    const remainingMoves = isMobile
      ? [['ArrowDown', '2026-01-10'], ['ArrowUp', '2026-01-03'], ['ArrowLeft', '2026-01-02']]
      : [['ArrowUp', '2026-01-08'], ['ArrowDown', '2026-01-09'], ['ArrowLeft', '2026-01-02']]
    for (const [key, date] of remainingMoves) {
      await user.keyboard(`{${key}}`)
      expect(document.activeElement).toHaveAttribute('data-date', date)
    }

    await user.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  }, 10_000)

  it('年の端で矢印移動を止め、EnterとSpaceで日を選択しない', async () => {
    stubViewport(false)
    const user = userEvent.setup()
    const { container } = render(<AnnualReviewCalendar todayDate="2026-01-02" calendarDays={makeCalendarDays(2026)} />)
    const lastDay = screen.getByRole('button', { name: '2026年12月31日、木曜日、集中時間 0分' })

    act(() => lastDay.focus())
    await user.keyboard('{ArrowRight}')
    expect(lastDay).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(screen.getByRole('tooltip')).toHaveTextContent('2026年12月31日（木）')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    expect(container.querySelector('.annual-calendar-selection')).not.toBeInTheDocument()
    expect(container.querySelector('[aria-pressed]')).not.toBeInTheDocument()
  })

  it('touch pointerupで開き、再タップで閉じ、別日と外側タップを処理する', async () => {
    const { container } = render(<>
      <button type="button">outside</button>
      <AnnualReviewCalendar todayDate="2026-10-06" calendarDays={makeCalendarDays(2026)} />
    </>)
    const first = screen.getByRole('button', { name: '2026年10月7日、水曜日、集中時間 0分' })
    const second = screen.getByRole('button', { name: '2026年10月8日、木曜日、集中時間 0分' })
    const tap = (target: HTMLElement) => {
      const pointer = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 }
      fireEvent.pointerDown(target, pointer)
      fireEvent.pointerUp(target, pointer)
    }

    act(() => first.focus())
    tap(first)
    expect(screen.getByRole('tooltip')).toHaveTextContent('2026年10月7日（水）')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    tap(first)
    expect(screen.getByRole('tooltip')).toHaveTextContent('2026年10月7日（水）')
    tap(first)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    tap(first)
    tap(second)
    expect(screen.getByRole('tooltip')).toHaveTextContent('2026年10月8日（木）')

    const monthHeading = container.querySelector<HTMLElement>('.annual-calendar-month-title')
    if (!monthHeading) throw new Error('月見出しが見つかりません')
    tap(monthHeading)
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())

    tap(first)
    tap(screen.getByRole('button', { name: 'outside' }))
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
    expect(first).toHaveFocus()
    expect(first).not.toHaveAttribute('aria-describedby')
    expect(second).not.toHaveAttribute('aria-describedby')
  })

  it('focusとhoverでは外側タップ監視を登録せず、touch tooltipの間だけ登録する', () => {
    render(<AnnualReviewCalendar todayDate="2026-10-06" calendarDays={makeCalendarDays(2026)} />)
    const addListener = vi.spyOn(document, 'addEventListener')
    const removeListener = vi.spyOn(document, 'removeEventListener')
    const future = screen.getByRole('button', { name: '2026年10月7日、水曜日、集中時間 0分' })
    const pointer = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 }
    const pointerDownRegistrations = () => addListener.mock.calls.filter(([type]) => type === 'pointerdown')

    act(() => future.focus())
    expect(pointerDownRegistrations()).toHaveLength(0)
    fireEvent.pointerEnter(future, { pointerType: 'mouse' })
    expect(pointerDownRegistrations()).toHaveLength(0)

    fireEvent.pointerDown(future, pointer)
    fireEvent.pointerUp(future, pointer)

    const outsideTouchListener = pointerDownRegistrations().at(-1)?.[1]
    expect(outsideTouchListener).toEqual(expect.any(Function))

    fireEvent.pointerDown(future, pointer)
    fireEvent.pointerUp(future, pointer)
    expect(removeListener).toHaveBeenCalledWith('pointerdown', outsideTouchListener)
  })

  it('touchがpointercancelされた後のキーボードフォーカスでtooltipを開ける', () => {
    const { container } = render(<AnnualReviewCalendar todayDate="2026-10-06" calendarDays={makeCalendarDays(2026)} />)
    const future = screen.getByRole('button', { name: '2026年10月7日、水曜日、集中時間 0分' })
    const pointer = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0 }

    fireEvent.pointerDown(future, pointer)
    fireEvent.pointerCancel(future, pointer)
    act(() => future.focus())

    expect(screen.getByRole('tooltip')).toHaveTextContent('2026年10月7日（水）')
    expect(container.querySelector('[data-date="2026-10-07"]')).toHaveAttribute('tabindex', '0')
  })

  it('2000年の54週を含め、全366日を一度ずつ表示する', () => {
    const { container } = render(<AnnualReviewCalendar todayDate="2000-06-01" calendarDays={makeCalendarDays(2000)} />)
    const dateCells = [...container.querySelectorAll<HTMLElement>('.annual-calendar-day')]
    const dates = dateCells.map((cell) => cell.dataset.date)

    expect(container.querySelector('.annual-calendar-week-layout')).toHaveAttribute('data-week-count', '54')
    expect(dateCells).toHaveLength(366)
    expect(new Set(dates).size).toBe(366)
    expect(dates[0]).toBe('2000-01-01')
    expect(dates.at(-1)).toBe('2000-12-31')
  })
})
