import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  timezone: text('timezone').notNull().default('UTC'),
  currentTaskId: uuid('current_task_id').references((): AnyPgColumn => tasks.id, { onDelete: 'set null' }),
  soundMuted: boolean('sound_muted').notNull().default(false),
  soundVolume: real('sound_volume').notNull().default(0.7),
  theme: text('theme', { enum: ['system', 'light', 'dark'] }).notNull().default('system'),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  turnstileVerifiedAt: timestamp('turnstile_verified_at', { withTimezone: true }),
}, (table) => ({
  volumeRange: check('users_sound_volume_range_check', sql`${table.soundVolume} between 0 and 1`),
}))

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
})

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  providerAccount: uniqueIndex('accounts_provider_account_idx').on(table.providerId, table.accountId),
}))

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  note: text('note'),
  estimate: integer('estimate'),
  plannedFor: date('planned_for'),
  deckOrder: text('deck_order'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  estimateRange: check('tasks_estimate_range_check', sql`${table.estimate} is null or ${table.estimate} between 1 and 8`),
  userPlanned: index('tasks_user_planned_idx').on(table.userId, table.plannedFor, table.deckOrder),
  userCompleted: index('tasks_user_completed_idx').on(table.userId, table.completedAt),
}))

export const focusSessions = pgTable('focus_sessions', {
  id: uuid('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  durationSecs: integer('duration_secs').notNull(),
  plannedSecs: integer('planned_secs').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  durationRange: check('focus_sessions_duration_range_check', sql`(${table.completedAt} is not null and ${table.durationSecs} = ${table.plannedSecs}) or (${table.completedAt} is null and ${table.durationSecs} between 60 and ${table.plannedSecs})`),
  plannedPreset: check('focus_sessions_planned_preset_check', sql`${table.plannedSecs} in (900, 1500, 2700)`),
  userTaskCompleted: index('focus_sessions_user_task_completed_idx').on(table.userId, table.taskId, table.completedAt),
  userStarted: index('focus_sessions_user_started_idx').on(table.userId, table.startedAt),
}))

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  event: text('event', { enum: ['app_opened', 'first_task_created', 'first_focus_completed', 'logged_in'] }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userEvent: uniqueIndex('analytics_events_user_event_idx').on(table.userId, table.event),
}))

export const userRelations = relations(users, ({ many, one }) => ({
  tasks: many(tasks),
  focusSessions: many(focusSessions),
  analyticsEvents: many(analyticsEvents),
  currentTask: one(tasks, { fields: [users.currentTaskId], references: [tasks.id] }),
}))

export const taskRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  focusSessions: many(focusSessions),
}))

export const focusSessionRelations = relations(focusSessions, ({ one }) => ({
  user: one(users, { fields: [focusSessions.userId], references: [users.id] }),
  task: one(tasks, { fields: [focusSessions.taskId], references: [tasks.id] }),
}))

export const analyticsEventRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, { fields: [analyticsEvents.userId], references: [users.id] }),
}))

export type User = typeof users.$inferSelect
export type Task = typeof tasks.$inferSelect
export type FocusSession = typeof focusSessions.$inferSelect
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect
