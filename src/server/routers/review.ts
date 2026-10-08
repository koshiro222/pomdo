import { router, protectedProcedure } from '../context'
import { listDailyFocusSummaries, listFocusSessions } from '../repositories/focus-session-repository'
import { listTasks } from '../repositories/task-repository'
import { buildCalendarYearSummaries, countFocusedDays, listTasksCompletedOnDate, summarizeToday } from '../services/review-service'
import { formatTaskCalendarDate } from '../services/task-service'

export const reviewRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const [sessions, userTasks, dailySummaries] = await Promise.all([
      listFocusSessions(ctx.db, ctx.user.id),
      listTasks(ctx.db, ctx.user.id),
      listDailyFocusSummaries(ctx.db, ctx.user.id),
    ])
    const todayDate = formatTaskCalendarDate(ctx.now, ctx.user.timezone)
    const sqlSummaryByDate = new Map(dailySummaries.map((summary) => [summary.date, summary]))
    const todaySummary = sqlSummaryByDate.get(todayDate) ?? summarizeToday(sessions, todayDate, ctx.user.timezone)
    const calendarDays = buildCalendarYearSummaries(dailySummaries, Number(todayDate.slice(0, 4)))
    return {
      ...todaySummary,
      todayDate,
      calendarDays,
      focusedDays: countFocusedDays(sessions, ctx.user.timezone),
      completedTasks: listTasksCompletedOnDate(userTasks, todayDate, ctx.user.timezone),
    }
  }),
})
