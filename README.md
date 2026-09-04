# Pomdo v1

Pomdo は、残り時間を円盤で外在化し、今やることを 1 件に絞る ADHD 向けの集中ツールです。

## 開発

```sh
npm ci
cp .dev.vars.example .dev.vars
npm run dev
```

`.dev.vars` の `DATABASE_URL`、`BETTER_AUTH_SECRET`、Google OAuth の値をローカル環境に合わせて設定します。例えば `BETTER_AUTH_URL=http://localhost:5173` とすると、`/app` の初回表示で匿名ユーザーと `Pomdo を5分だけ触ってみる` が 1 件だけ作成されます。

## v1 の範囲

- `/` は LP、`/app` は単一カラムの Focus 画面です。
- 認証は匿名ユーザーと Google OAuth のみです。Task と Focus Session は匿名状態でも DB に保存されます。
- Focus は 15 / 25 / 45 分、Short Break は 5 分、Long Break は 15 分です。実行中の操作は「ストップ」だけです。
- 60 秒未満の中断は破棄し、60 秒以上は Interrupted として残します。例えば 59 秒で止めた記録は Review に現れません。
- BGM、R2、メール/パスワード、管理者 UI、PWA は v1 に含めません。

## 品質確認

```sh
npm run lint
npm run typecheck
npm test -- --run
npm run test:coverage
npm run build
npm run test:e2e -- --project=chromium
```

DB スキーマを変更したときは `npm run db:generate` の後、PGlite 結合テストと `npm run build` を実行します。`tests/e2e/` は `/api/test/auth` と固定時計を使うため、E2E 用の Neon branch と `E2E_TEST_MODE=true` が必要です。

## 運用

本番は Cloudflare Pages + Neon PostgreSQL です。`TURNSTILE_SECRET_KEY`、`BETTER_AUTH_SECRET`、`ADMIN_CRON_SECRET` は Pages secret に置き、クライアントへ渡しません。匿名ユーザーの 90 日 purge は `POST /api/admin/purge-anonymous` を Bearer secret 付きで日次実行します。

利用規約・プライバシーポリシーは法務レビュー完了をローンチ条件とします。詳細な設計と受け入れ条件は [Issue #148 実装計画](design-docs-for-ai/issue148-adhd-focused-pomodoro-todo-v1-rebuild-implementation-plan.md) を参照してください。
