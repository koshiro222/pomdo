import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AnnualReviewCalendar } from './AnnualReviewCalendar'

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

describe('AnnualReviewCalendar', () => {
  it('未来の日と実績0秒の日を区別し、年外の日付を含めない', () => {
    const { container } = render(<AnnualReviewCalendar todayDate="2026-01-02" calendarDays={makeCalendarDays(2026)} />)

    expect(container.querySelector('[data-date="2026-01-02"]')).toHaveAttribute('aria-current', 'date')
    expect(container.querySelector('[data-date="2026-01-03"]')).toHaveClass('is-future')
    expect(container.querySelector('[data-date="2026-01-02"]')).not.toHaveClass('is-future')
    expect(container.querySelectorAll('.annual-calendar-day')).toHaveLength(365)
    expect(container.querySelector('[data-date="2025-12-31"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-date="2027-01-01"]')).not.toBeInTheDocument()
    expect(screen.getByText('これからの日')).toBeVisible()
  })

  it('日別の境界値をマスに反映し、選択内容を詳細に表示する', async () => {
    const user = userEvent.setup()
    const { container } = render(<AnnualReviewCalendar
      todayDate="2026-01-07"
      calendarDays={makeCalendarDays(2026, {
        '2026-01-01': 1,
        '2026-01-02': 1_799,
        '2026-01-03': 1_800,
        '2026-01-04': 3_599,
        '2026-01-05': 3_600,
        '2026-01-06': 7_199,
        '2026-01-07': 7_200,
      })}
    />)

    for (const [date, level] of Object.entries({
      '2026-01-01': '1',
      '2026-01-02': '1',
      '2026-01-03': '2',
      '2026-01-04': '2',
      '2026-01-05': '3',
      '2026-01-06': '3',
      '2026-01-07': '4',
    })) {
      expect(container.querySelector(`[data-date="${date}"]`)).toHaveAttribute('data-focus-level', level)
    }

    const firstRecordedDay = screen.getByRole('button', { name: '2026年1月1日、木曜日、集中時間0分' })
    await user.click(firstRecordedDay)
    expect(firstRecordedDay).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('2026年1月1日')).toBeVisible()
    expect(screen.getByText('集中時間 0分')).toBeVisible()

    const secondRecordedDay = screen.getByRole('button', { name: '2026年1月2日、金曜日、集中時間29分' })
    await user.click(secondRecordedDay)
    expect(firstRecordedDay).toHaveAttribute('aria-pressed', 'false')
    expect(secondRecordedDay).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('集中時間 29分')).toBeVisible()
  })

  it('Enter と Space で記録日の選択を切り替える', async () => {
    const user = userEvent.setup()
    render(<AnnualReviewCalendar
      todayDate="2026-01-02"
      calendarDays={makeCalendarDays(2026, { '2026-01-01': 60, '2026-01-02': 120 })}
    />)
    const firstDay = screen.getByRole('button', { name: '2026年1月1日、木曜日、集中時間1分' })
    const secondDay = screen.getByRole('button', { name: '2026年1月2日、金曜日、集中時間2分' })

    firstDay.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('2026年1月1日')).toBeVisible()

    secondDay.focus()
    await user.keyboard(' ')
    expect(screen.getByText('2026年1月2日')).toBeVisible()
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
