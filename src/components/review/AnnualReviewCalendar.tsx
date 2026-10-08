import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '../../server/routers/root'

type ReviewSummary = inferRouterOutputs<AppRouter>['review']['summary']
type CalendarDay = ReviewSummary['calendarDays'][number]

const WEEKDAY_NAMES = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']
const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

type CalendarDayLayout = {
  day: CalendarDay
  weekday: number
  week: number
}

type CalendarMonth = {
  month: number
  days: CalendarDayLayout[]
  firstWeek: number
  weekSpan: number
}

function getWeekday(dateString: string): number {
  return new Date(`${dateString}T00:00:00.000Z`).getUTCDay()
}

function formatCalendarDate(date: string): string {
  return `${date.slice(0, 4)}年${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`
}

function getFocusIntensityLevel(totalFocusSecs: number): 0 | 1 | 2 | 3 | 4 {
  if (totalFocusSecs <= 0) return 0
  if (totalFocusSecs < 1_800) return 1
  if (totalFocusSecs < 3_600) return 2
  if (totalFocusSecs < 7_200) return 3
  return 4
}

function formatMinutes(totalFocusSecs: number): string {
  return `${Math.floor(totalFocusSecs / 60)}分`
}

function buildCalendarMonths(calendarDays: readonly CalendarDay[], year: number): CalendarMonth[] {
  const firstWeekday = getWeekday(`${year}-01-01`)
  const byMonth = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    days: [] as CalendarDayLayout[],
  }))

  calendarDays.forEach((day, index) => {
    const dayYear = Number(day.date.slice(0, 4))
    const month = Number(day.date.slice(5, 7))
    if (dayYear !== year || month < 1 || month > 12) return
    byMonth[month - 1]?.days.push({
      day,
      weekday: getWeekday(day.date),
      week: Math.floor((firstWeekday + index) / 7),
    })
  })

  const firstWeeks = byMonth.map((month) => month.days[0]?.week ?? 0)
  const totalWeeks = Math.ceil((firstWeekday + calendarDays.length) / 7)
  return byMonth.map((month, index) => {
    const nextFirstWeek = firstWeeks[index + 1] ?? totalWeeks
    return {
      ...month,
      firstWeek: firstWeeks[index] ?? 0,
      weekSpan: Math.max(1, nextFirstWeek - (firstWeeks[index] ?? 0)),
    }
  })
}

function CalendarDayCell({
  day,
  weekday,
  week,
  todayDate,
  selectedDate,
  onSelect,
}: {
  day: CalendarDay
  weekday: number
  week: number
  todayDate: string
  selectedDate: string | null
  onSelect: (day: CalendarDay) => void
}) {
  const isFuture = day.date > todayDate
  const isRecorded = day.totalFocusSecs > 0 && !isFuture
  const dateLabel = formatCalendarDate(day.date)
  const focusLabel = formatMinutes(day.totalFocusSecs)
  const accessibleName = `${dateLabel}、${WEEKDAY_NAMES[weekday]}、集中時間${focusLabel}`
  const isSelected = selectedDate === day.date
  const positionStyle = {
    '--week-column': String(week + 2),
    '--week-row': String(weekday + 2),
  } as CSSProperties
  const className = `annual-calendar-day${isFuture ? ' is-future' : ''}${isSelected ? ' is-selected' : ''}`

  if (isRecorded) {
    return (
      <button
        type="button"
        className={className}
        style={positionStyle}
        data-date={day.date}
        data-focus-level={getFocusIntensityLevel(day.totalFocusSecs)}
        aria-label={accessibleName}
        aria-current={day.date === todayDate ? 'date' : undefined}
        aria-pressed={isSelected}
        title={accessibleName}
        onClick={() => onSelect(day)}
      />
    )
  }

  const emptyLabel = isFuture ? `${formatCalendarDate(day.date)}、${WEEKDAY_NAMES[weekday]}、これからの日` : accessibleName
  return (
    <span
      role="img"
      className={className}
      style={positionStyle}
      data-date={day.date}
      data-focus-level={getFocusIntensityLevel(day.totalFocusSecs)}
      aria-label={emptyLabel}
      aria-current={day.date === todayDate ? 'date' : undefined}
      title={emptyLabel}
    />
  )
}

export function AnnualReviewCalendar({ todayDate, calendarDays }: Pick<ReviewSummary, 'todayDate' | 'calendarDays'>) {
  const year = Number(todayDate.slice(0, 4))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const months = useMemo(() => buildCalendarMonths(calendarDays, year), [calendarDays, year])
  const summariesByDate = useMemo(() => new Map(calendarDays.map((day) => [day.date, day])), [calendarDays])
  const selectedDay = selectedDate ? summariesByDate.get(selectedDate) ?? null : null
  const firstWeekday = getWeekday(`${year}-01-01`)
  const weekCount = Math.ceil((firstWeekday + calendarDays.length) / 7)

  return (
    <div className="annual-calendar">
      <div className="annual-calendar-heading">
        <strong>{year}年</strong>
        <span>1マスが1日です</span>
      </div>
      <div className="annual-calendar-week-layout" style={{ '--week-count': String(weekCount) } as CSSProperties} data-week-count={weekCount} role="group" aria-label={`${year}年の集中時間`}>
        <div className="annual-calendar-weekday-rail" aria-hidden="true">
          {WEEKDAY_LABELS.map((label, index) => <span key={label} style={{ '--week-row': String(index + 2) } as CSSProperties}>{label}</span>)}
        </div>
        {months.map((month) => {
          const monthStartWeek = month.firstWeek + 2
          const monthStyle = {
            '--month-start-column': String(monthStartWeek),
            '--month-span': String(month.weekSpan),
          } as CSSProperties
          const leadingEmptyCount = month.days[0]?.weekday ?? 0
          const trailingEmptyCount = (7 - ((leadingEmptyCount + month.days.length) % 7)) % 7

          return (
            <div className="annual-calendar-month" key={month.month} style={monthStyle}>
              <h3 className="annual-calendar-month-title">{month.month}月</h3>
              <div className="annual-calendar-mobile-weekdays" aria-hidden="true">
                {WEEKDAY_LABELS.map((label) => <span key={label}>{label}</span>)}
              </div>
              <div className="annual-calendar-month-days">
                {Array.from({ length: leadingEmptyCount }, (_, index) => <span className="annual-calendar-empty" key={`before-${index}`} aria-hidden="true" />)}
                {month.days.map(({ day, weekday, week }) => (
                  <CalendarDayCell
                    key={day.date}
                    day={day}
                    weekday={weekday}
                    week={week}
                    todayDate={todayDate}
                    selectedDate={selectedDate}
                    onSelect={(day) => setSelectedDate(day.date)}
                  />
                ))}
                {Array.from({ length: trailingEmptyCount }, (_, index) => <span className="annual-calendar-empty" key={`after-${index}`} aria-hidden="true" />)}
              </div>
            </div>
          )
        })}
      </div>
      <ul className="annual-calendar-legend" aria-label="集中時間の凡例">
        <li><span className="annual-calendar-swatch" data-focus-level="0" aria-hidden="true" />0秒</li>
        <li><span className="annual-calendar-swatch" data-focus-level="1" aria-hidden="true" />1〜1799秒</li>
        <li><span className="annual-calendar-swatch" data-focus-level="2" aria-hidden="true" />1800〜3599秒</li>
        <li><span className="annual-calendar-swatch" data-focus-level="3" aria-hidden="true" />3600〜7199秒</li>
        <li><span className="annual-calendar-swatch" data-focus-level="4" aria-hidden="true" />7200秒以上</li>
        <li><span className="annual-calendar-swatch is-future" aria-hidden="true" />これからの日</li>
      </ul>
      <div className="annual-calendar-selection" aria-live="polite" aria-atomic="true">
        {selectedDay
          ? <><span>{formatCalendarDate(selectedDay.date)}</span><strong>集中時間 {formatMinutes(selectedDay.totalFocusSecs)}</strong></>
          : <p>集中時間がある日を選ぶと、日付と時間がここに表示されます。</p>}
      </div>
    </div>
  )
}
