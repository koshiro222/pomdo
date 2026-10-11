# Cloudflare Rate Limiting

匿名ユーザー作成はアプリケーションコードではなく Cloudflare の Rate Limiting で制限する。Pages の本番ゾーンで次のルールを設定する。

- 対象: `/api/auth/*`
- 条件: 送信元 IP ごとに 1 時間あたり 5 リクエスト
- 動作: `429` を返す
- 対象環境: 本番。E2E 用の staging はテスト実行に必要な範囲で別ルールにする

Cloudflare Dashboard の「Security → WAF → Rate limiting rules」から設定し、匿名作成以外の読み取り API に同じ制限を広げない。例えば、同一 IP から `/api/auth/sign-in/anonymous` を 1 時間に 6 回呼んだ場合は、6 回目を `429` にする。

設定後は staging で次を確認する。

1. 1 時間以内の 5 回目までは匿名作成が成功する。
2. 6 回目は `429` になり、アプリケーションの DB に新しい匿名 user が増えない。
3. `/api/trpc/tasks.list` のような read-only API はこのルールで不要に拒否されない。
