-- 既存 Google ユーザーを accounts テーブルに移行
-- users.google_id が存在するユーザーを Better Auth の accounts テーブル形式で挿入する
-- 冪等: accounts に既に google レコードが存在するユーザーはスキップ
INSERT INTO accounts (id, user_id, account_id, provider_id, created_at, updated_at)
SELECT
  gen_random_uuid()::text,
  id,
  google_id,
  'google',
  created_at,
  now()
FROM users
WHERE google_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM accounts
    WHERE accounts.user_id = users.id AND accounts.provider_id = 'google'
  );