import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FocusEvent, KeyboardEvent, PointerEvent } from 'react'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '../../server/routers/root'

type ReviewSummary = inferRouterOutputs<AppRouter>['review']['summary']
type CalendarDay = ReviewSummary['calendarDays'][number]
type TooltipSource = 'hover' | 'focus' | 'touch'
type ActiveTooltip = { date: string; source: TooltipSource } | null
type TooltipPosition = { date: string; left: number; top: number } | null

const WEEKDAY_NAMES = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']
const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']
const FOCUS_LEVEL_LABELS = [
  '0秒',
  '1〜1799秒',
  '1800〜3599秒',
  '3600〜7199秒',
  '7200秒以上',
]

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

function getDisplayFocusSecs(day: CalendarDay, todayDate: string): number {
  return day.date > todayDate ? 0 : day.totalFocusSecs
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

function getArrowOffset(key: string, isMobile: boolean): number | null {
  if (isMobile) {
    if (key === 'ArrowLeft') return -1
    if (key === 'ArrowRight') return 1
    if (key === 'ArrowUp') return -7
    if (key === 'ArrowDown') return 7
  } else {
    if (key === 'ArrowLeft') return -7
    if (key === 'ArrowRight') return 7
    if (key === 'ArrowUp') return -1
    if (key === 'ArrowDown') return 1
  }
  return null
}

function CalendarDayCell({
  day,
  weekday,
  week,
  todayDate,
  displayFocusSecs,
  tabIndex,
  isTooltipTarget,
  tooltipId,
  registerButton,
  onFocusDay,
  onBlurDay,
  onPointerEnterDay,
  onPointerLeaveDay,
  onPointerDownDay,
  onPointerUpDay,
  onPointerCancelDay,
  onKeyDownDay,
}: {
  day: CalendarDay
  weekday: number
  week: number
  todayDate: string
  displayFocusSecs: number
  tabIndex: number
  isTooltipTarget: boolean
  tooltipId: string
  registerButton: (node: HTMLButtonElement | null) => void
  onFocusDay: (date: string) => void
  onBlurDay: (event: FocusEvent<HTMLButtonElement>) => void
  onPointerEnterDay: (date: string, event: PointerEvent<HTMLButtonElement>) => void
  onPointerLeaveDay: (date: string, event: PointerEvent<HTMLButtonElement>) => void
  onPointerDownDay: (date: string, event: PointerEvent<HTMLButtonElement>) => void
  onPointerUpDay: (date: string, event: PointerEvent<HTMLButtonElement>) => void
  onPointerCancelDay: (date: string, event: PointerEvent<HTMLButtonElement>) => void
  onKeyDownDay: (date: string, event: KeyboardEvent<HTMLButtonElement>) => void
}) {
  const dateLabel = formatCalendarDate(day.date)
  const focusLabel = formatMinutes(displayFocusSecs)
  const accessibleName = `${dateLabel}、${WEEKDAY_NAMES[weekday]}、集中時間 ${focusLabel}`
  const positionStyle = {
    '--week-column': String(week + 2),
    '--week-row': String(weekday + 2),
  } as CSSProperties

  return (
    <button
      ref={registerButton}
      type="button"
      className="annual-calendar-day"
      style={positionStyle}
      data-date={day.date}
      data-focus-level={getFocusIntensityLevel(displayFocusSecs)}
      aria-label={accessibleName}
      aria-current={day.date === todayDate ? 'date' : undefined}
      aria-describedby={isTooltipTarget ? tooltipId : undefined}
      tabIndex={tabIndex}
      onFocus={() => onFocusDay(day.date)}
      onBlur={onBlurDay}
      onPointerEnter={(event) => onPointerEnterDay(day.date, event)}
      onPointerLeave={(event) => onPointerLeaveDay(day.date, event)}
      onPointerDown={(event) => onPointerDownDay(day.date, event)}
      onPointerUp={(event) => onPointerUpDay(day.date, event)}
      onPointerCancel={(event) => onPointerCancelDay(day.date, event)}
      onKeyDown={(event) => onKeyDownDay(day.date, event)}
    />
  )
}

export function AnnualReviewCalendar({ todayDate, calendarDays }: Pick<ReviewSummary, 'todayDate' | 'calendarDays'>) {
  const year = Number(todayDate.slice(0, 4))
  const [focusDate, setFocusDate] = useState(() => calendarDays.some((day) => day.date === todayDate) ? todayDate : calendarDays[0]?.date ?? '')
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>(null)
  const calendarId = useId()
  const instructionsId = `${calendarId}-instructions`
  const tooltipId = `${calendarId}-tooltip`
  const calendarRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>())
  const hoverCloseTimer = useRef<number | null>(null)
  const touchPointerStart = useRef<{ date: string; wasOpenTouch: boolean } | null>(null)
  const touchFocusSuppression = useRef<string | null>(null)
  const months = useMemo(() => buildCalendarMonths(calendarDays, year), [calendarDays, year])
  const daysByDate = useMemo(() => new Map(calendarDays.map((day) => [day.date, day])), [calendarDays])
  const calendarDates = useMemo(() => calendarDays.filter((day) => Number(day.date.slice(0, 4)) === year).map((day) => day.date), [calendarDays, year])
  const registerButton = useCallback((date: string, node: HTMLButtonElement | null) => {
    if (node) buttonRefs.current.set(date, node)
    else buttonRefs.current.delete(date)
  }, [])
  const buttonRefCallbacks = useMemo(() => new Map(calendarDates.map((date) => [
    date,
    (node: HTMLButtonElement | null) => registerButton(date, node),
  ])), [calendarDates, registerButton])
  const firstWeekday = getWeekday(`${year}-01-01`)
  const weekCount = Math.ceil((firstWeekday + calendarDays.length) / 7)
  const tooltipDay = activeTooltip ? daysByDate.get(activeTooltip.date) : undefined
  const tooltipWeekday = tooltipDay ? getWeekday(tooltipDay.date) : 0
  const tooltipFocusSecs = tooltipDay ? getDisplayFocusSecs(tooltipDay, todayDate) : 0

  function clearHoverCloseTimer() {
    if (hoverCloseTimer.current !== null) {
      window.clearTimeout(hoverCloseTimer.current)
      hoverCloseTimer.current = null
    }
  }

  function onFocusDay(date: string) {
    clearHoverCloseTimer()
    setFocusDate(date)
    if (touchPointerStart.current?.date === date) return
    if (touchFocusSuppression.current === date) {
      touchFocusSuppression.current = null
      return
    }
    setActiveTooltip({ date, source: 'focus' })
  }

  function onBlurDay(event: FocusEvent<HTMLButtonElement>) {
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && calendarRef.current?.contains(nextTarget)) return
    clearHoverCloseTimer()
    setActiveTooltip(null)
  }

  function onPointerEnterDay(date: string, event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
    clearHoverCloseTimer()
    setActiveTooltip({ date, source: 'hover' })
  }

  function closeHoverTooltip(date: string) {
    setActiveTooltip((current) => {
      if (current?.date !== date || current.source !== 'hover') return current
      const focusedButton = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null
      const focusedDate = focusedButton?.dataset.date
      if (focusedDate && calendarRef.current?.contains(focusedButton)) return { date: focusedDate, source: 'focus' }
      return null
    })
  }

  function onPointerLeaveDay(date: string, event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && tooltipRef.current?.contains(nextTarget)) return
    clearHoverCloseTimer()
    hoverCloseTimer.current = window.setTimeout(() => {
      hoverCloseTimer.current = null
      closeHoverTooltip(date)
    }, 100)
  }

  function onPointerDownDay(date: string, event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== 'touch') return
    touchPointerStart.current = {
      date,
      wasOpenTouch: activeTooltip?.date === date && activeTooltip.source === 'touch',
    }
  }

  function onPointerUpDay(date: string, event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType !== 'touch') return
    clearHoverCloseTimer()
    const touchStart = touchPointerStart.current
    touchPointerStart.current = null
    touchFocusSuppression.current = date
    window.setTimeout(() => {
      if (touchFocusSuppression.current === date) touchFocusSuppression.current = null
    }, 0)
    if (touchStart?.date === date && touchStart.wasOpenTouch) setActiveTooltip(null)
    else setActiveTooltip({ date, source: 'touch' })
  }

  function onPointerCancelDay(date: string, event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'touch' && touchPointerStart.current?.date === date) touchPointerStart.current = null
  }

  function onKeyDownDay(date: string, event: KeyboardEvent<HTMLButtonElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const offset = getArrowOffset(event.key, window.matchMedia('(max-width: 767px)').matches)
    if (offset === null) return
    event.preventDefault()
    const currentIndex = calendarDates.indexOf(date)
    const targetDate = calendarDates[currentIndex + offset]
    if (!targetDate) return
    buttonRefs.current.get(targetDate)?.focus()
  }

  useEffect(() => () => clearHoverCloseTimer(), [])

  useEffect(() => {
    if (!activeTooltip || activeTooltip.source !== 'touch') return
    const closeOnOutsideTouch = (event: globalThis.PointerEvent) => {
      if (event.pointerType !== 'touch') return
      const target = event.target
      const dayButton = target instanceof Element ? target.closest('.annual-calendar-day') : null
      if (!dayButton || !calendarRef.current?.contains(dayButton)) setActiveTooltip(null)
    }
    document.addEventListener('pointerdown', closeOnOutsideTouch)
    return () => document.removeEventListener('pointerdown', closeOnOutsideTouch)
  }, [activeTooltip])

  useEffect(() => {
    if (!activeTooltip) return
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (hoverCloseTimer.current !== null) {
        window.clearTimeout(hoverCloseTimer.current)
        hoverCloseTimer.current = null
      }
      setActiveTooltip(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [activeTooltip])

  useLayoutEffect(() => {
    if (!activeTooltip) return
    const button = buttonRefs.current.get(activeTooltip.date)
    const tooltip = tooltipRef.current
    if (!button || !tooltip) return

    const updatePosition = () => {
      const buttonRect = button.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      const gutter = 8
      const left = Math.min(
        Math.max(buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2, gutter),
        Math.max(gutter, window.innerWidth - tooltipRect.width - gutter),
      )
      const above = buttonRect.top - tooltipRect.height - gutter
      const below = buttonRect.bottom + gutter
      const preferredTop = above >= gutter || below + tooltipRect.height > window.innerHeight - gutter
        ? above
        : below
      const top = Math.min(Math.max(preferredTop, gutter), Math.max(gutter, window.innerHeight - tooltipRect.height - gutter))
      setTooltipPosition((current) => current?.date === activeTooltip.date && current.left === left && current.top === top
        ? current
        : { date: activeTooltip.date, left, top })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [activeTooltip])

  return (
    <div className="annual-calendar">
      <div className="annual-calendar-heading">
        <strong>{year}年</strong>
      </div>
      <p className="sr-only" id={instructionsId}>日付に Tab で移動し、矢印キーで日付を移動できます。Escape で日付情報を閉じます。</p>
      <div ref={calendarRef} className="annual-calendar-week-layout" style={{ '--week-count': String(weekCount) } as CSSProperties} data-week-count={weekCount} role="group" aria-label={`${year}年の集中時間`} aria-describedby={instructionsId}>
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
                    displayFocusSecs={getDisplayFocusSecs(day, todayDate)}
                    tabIndex={focusDate === day.date ? 0 : -1}
                    isTooltipTarget={activeTooltip?.date === day.date}
                    tooltipId={tooltipId}
                    registerButton={buttonRefCallbacks.get(day.date)!}
                    onFocusDay={onFocusDay}
                    onBlurDay={onBlurDay}
                    onPointerEnterDay={onPointerEnterDay}
                    onPointerLeaveDay={onPointerLeaveDay}
                    onPointerDownDay={onPointerDownDay}
                    onPointerUpDay={onPointerUpDay}
                    onPointerCancelDay={onPointerCancelDay}
                    onKeyDownDay={onKeyDownDay}
                  />
                ))}
                {Array.from({ length: trailingEmptyCount }, (_, index) => <span className="annual-calendar-empty" key={`after-${index}`} aria-hidden="true" />)}
              </div>
            </div>
          )
        })}
      </div>
      <ul className="annual-calendar-legend" aria-label="集中時間の凡例">
        <li className="annual-calendar-legend-end">Less</li>
        {FOCUS_LEVEL_LABELS.map((label, level) => (
          <li key={label}>
            <span className="annual-calendar-swatch" data-focus-level={level} aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </li>
        ))}
        <li className="annual-calendar-legend-end">More</li>
      </ul>
      {activeTooltip && tooltipDay && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          className="annual-calendar-tooltip"
          role="tooltip"
          style={tooltipPosition?.date === activeTooltip.date ? { left: tooltipPosition.left, top: tooltipPosition.top } : undefined}
          onPointerEnter={clearHoverCloseTimer}
          onPointerLeave={() => {
            if (activeTooltip.source === 'hover') closeHoverTooltip(activeTooltip.date)
          }}
        >
          <span>{formatCalendarDate(tooltipDay.date)}（{WEEKDAY_LABELS[tooltipWeekday]}）</span>
          <strong>集中時間 {formatMinutes(tooltipFocusSecs)}</strong>
        </div>
      )}
    </div>
  )
}
