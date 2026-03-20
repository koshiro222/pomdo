ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ban_expires" timestamp;-->statement-breakpoint
-- 初期管理者を登録（開発者のメールアドレス）
UPDATE "users" SET "role" = 'admin' WHERE "email" = 'koshiro@mudef.net';