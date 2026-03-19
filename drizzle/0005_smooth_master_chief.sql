CREATE TABLE "bgm_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"artist" text,
	"color" text,
	"filename" text NOT NULL,
	"tier" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bgm_tracks_filename_unique" UNIQUE("filename")
);

-- Seed existing tracks from hardcoded data
INSERT INTO "bgm_tracks" ("id", "title", "artist", "color", "filename", "tier", "created_at", "updated_at")
VALUES
  (gen_random_uuid(), 'Lo-Fi Study 01', 'Chill Beats', '#3b82f6', 'bgm/lofi-01.mp3', 'free', now(), now()),
  (gen_random_uuid(), 'Lo-Fi Study 02', 'Relax Sounds', '#8b5cf6', 'bgm/lofi-02.mp3', 'free', now(), now());
