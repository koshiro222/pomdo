import { router, protectedProcedure } from '../context'
import { listDailyFocusSummaries, listFocusSessions } from '../repositories/focus-session-repository'
import { listTasks } from '../repositories/task-repository'
import { countFocusedDays, listTasksCompletedOnDate, summarizeRecentSevenDays, summarizeToday } from '../services/review-service'
import { formatTaskCalendarDate } from '../services/task-service'

export const reviewRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const [sessions, userTasks, dailySummaries] = await Promise.all([
      listFocusSessions(ctx.db, ctx.user.id),
      listTasks(ctx.db, ctx.user.id),
      listDailyFocusSummaries(ctx.db, ctx.user.id),
    ])
    const today = formatTaskCalendarDate(new Date(), ctx.user.timezone)
    const sqlSummaryByDate = new Map(dailySummaries.map((summary) => [summary.date, summary]))
    const todaySummary = sqlSummaryByDate.get(today) ?? summarizeToday(sessions, today, ctx.user.timezone)
    const days = summarizeRecentSevenDays(sessions, today, ctx.user.timezone).map((day) => sqlSummaryByDate.get(day.date) ?? day)
    return {
      ...todaySummary,
      days,
      focusedDays: countFocusedDays(sessions, ctx.user.timezone),
      completedTasks: listTasksCompletedOnDate(userTasks, today, ctx.user.timezone),
    }
  }),
})
