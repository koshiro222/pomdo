# トラブルシューティング

API が 401 のときは Better Auth の Cookie と `DATABASE_URL` を確認する。初回 mutation が 403 のときは `/app` 直下の Turnstile token とサーバーの Siteverify 設定を確認する。例: E2E では Cloudflare テスト token `e2e-turnstile-token` を使う。
