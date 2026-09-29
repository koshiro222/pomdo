# Pomdo v1

Pomdo は、残り時間を円盤で外在化し、今やることを 1 件に絞る ADHD 向けの集中ツールです。

## 開発

```sh
npm ci
cp .dev.vars.example .dev.vars
npm run dev
```

`.dev.vars` はローカル専用の設定ファイルです。`DATABASE_URL` はローカルE2E用の Neon branch を指定し、`BETTER_AUTH_URL` と `FRONTEND_URL` は Vite のURLに合わせて、例えば次のように設定します。

```env
BETTER_AUTH_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
E2E_TEST_MODE=true
```

Cloudflare Pages の Production / Preview で使う変数とSecretは、Pagesダッシュボードの環境別設定に登録します。`.dev.vars` のサーバー向け設定は本番デプロイには使われません。

Previewへのデプロイ手順とTurnstileの設定は、[Previewデプロイ手順](docs/development/preview-deploy.md)を参照してください。

## 共有Preview

`develop` へのpushは、lint、typecheck、Vitest、coverage、production build、Chromium E2Eを通過した同一commitのArtifactだけを共有Previewへ自動デプロイします。共有PreviewのURLは <https://develop.pomdo.pages.dev>、ヘルスチェックは <https://develop.pomdo.pages.dev/api/health> です。

PreviewはNeon staging branch、GitHub ActionsとローカルE2Eは別のNeon E2E branchを使います。例えばE2Eで作成したTaskはPreviewに表示されません。ローカルE2Eの実行中にGitHub Actionsを同時起動すると共有E2E branchへ同時書き込みになるため、同時起動しないでください。

`npm run deploy:preview` はfeature branchの一時Preview用です。`develop`からの手動実行は拒否され、共有PreviewはGitHub Actionsだけが更新します。

ローカルE2Eまたは画面確認も、Wranglerが読む`.dev.vars`を使います。次のコマンドで `http://localhost:5173` を開きます。

```sh
npm run dev:e2e
```

E2Eテストは同じ起動設定を自動で使います。例えばChromiumだけを実行する場合は次のコマンドです。

```sh
npm run test:e2e -- --project=chromium
```

Previewの確認では、まず `curl -fsS https://develop.pomdo.pages.dev/api/health` が `status=ok` と `db=connected` を返すこと、`POST https://develop.pomdo.pages.dev/api/test/auth` が404になることを確認してください。

## v1 の範囲

- `/` は LP、`/app` は単一カラムの Focus 画面です。
- 認証は匿名ユーザーと Google OAuth のみです。Task と Focus Session は匿名状態でも DB に保存されます。
- Focus は 15 / 25 / 45 分、Short Break は 5 分、Long Break は 15 分です。実行中の操作は「ストップ」だけです。
- 60 秒未満の中断は破棄し、60 秒以上は Interrupted として残します。例えば 59 秒で止めた記録は Review に現れません。
- BGM、R2、メール/パスワード、管理者 UI、本格的なPWA（インストール対応など）は v1 に含めません。アプリ名とアイコンのmanifest登録のみ行います。

## 品質確認

```sh
npm run lint
npm run typecheck
npm test -- --run
npm run test:coverage
npm run build
npm run test:e2e -- --project=chromium
npm run test:e2e:assert
```

DB スキーマを変更したときは `npm run db:generate` の後、PGlite 結合テストと `npm run build` を実行します。`tests/e2e/` は `/api/test/auth` と固定時計を使うため、E2E 用の Neon branch と `E2E_TEST_MODE=true` が必要です。

## 運用

本番は Cloudflare Pages + Neon PostgreSQL です。`TURNSTILE_SECRET_KEY`、`BETTER_AUTH_SECRET`、`ADMIN_CRON_SECRET` は Pages secret に置き、クライアントへ渡しません。匿名ユーザーの 90 日 purge は `POST /api/admin/purge-anonymous` を Bearer secret 付きで日次実行します。

利用規約・プライバシーポリシーは法務レビュー完了をローンチ条件とします。詳細な設計と受け入れ条件は [Issue #148 実装計画](design-docs-for-ai/issue148-adhd-focused-pomodoro-todo-v1-rebuild-implementation-plan.md) を参照してください。
