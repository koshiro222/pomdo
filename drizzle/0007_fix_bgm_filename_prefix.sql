-- Fix filename prefix for seed BGM tracks
-- R2 stores files without 'bgm/' prefix, but seed data had incorrect prefix

UPDATE "bgm_tracks"
SET "filename" = REPLACE("filename", 'bgm/', '')
WHERE "filename" LIKE 'bgm/%';

-- Verify the fix
-- SELECT "id", "title", "filename" FROM "bgm_tracks" WHERE "title" LIKE 'Lo-Fi Study%';
