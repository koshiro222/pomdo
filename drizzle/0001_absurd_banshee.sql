ALTER TABLE "todos" ADD COLUMN "completed_pomodoros" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "target_pomodoros" integer DEFAULT 4 NOT NULL;