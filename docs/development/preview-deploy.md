# Preview デプロイ手順

Previewには、`develop`へのpushで更新される共有環境と、feature branchから手動で公開する一時環境があります。共有Previewは品質ゲートを通過したArtifactだけを公開し、手動コマンドはfeature branchに限定します。

## 共有Previewは `develop` へのpushで更新する

- アプリ: <https://develop.pomdo.pages.dev/app>
- ヘルスチェック: <https://develop.pomdo.pages.dev/api/health>
- 正規ブランチ: `develop`
- DB: Neon staging branch
- Runtime: `E2E_TEST_MODE=false`

GitHub Actionsは `develop` へのpushごとに、次の順で処理します。

1. lint、typecheck、Vitest、coverage、Chromium E2Eを実行する
2. 同じcommitのproduction buildを1回だけ実行し、`dist/` Artifactを保存する
3. staging DBへmigrationを適用する
4. `develop-candidate`へArtifactを公開し、`/api/health`と `/api/test/auth` 404を検証する
5. 検証済みArtifactを `develop` aliasへ公開し、固定URLのhealth checkを実行する

例えばE2Eが作成したTaskはNeon E2E branchに保存されるため、共有Previewには表示されません。Previewで作成したTaskはstaging branchに保存され、Productionには表示されません。

品質ゲート、migration、candidate検証のいずれかが失敗した場合、`develop` aliasは更新されません。stable aliasのhealth checkが失敗した場合は、前回成功時の `preview-last-good` bundleを同じ `develop` aliasへ再公開して復旧を試みます。Preview deploymentにはProduction向けの公式rollback APIを使いません。

## feature branchを一時Previewへ公開する

作業ツリーをコミット済みにし、`.env.local` または `.dev.vars` に公開用の `VITE_TURNSTILE_SITE_KEY` を設定してから実行します。

```sh
rtk git status --short --branch
rtk git diff --check
rtk npm run deploy:preview
```

`npm run deploy:preview` は現在のbranch名でbuildしてCloudflare Pagesへ公開します。`main`、`master`、`develop`からの実行は停止します。例えば `feature/task-copy` は許可されますが、`develop`から実行すると「共有PreviewはGitHub Actionsからのみ更新する」というエラーになります。

手動のVite buildや既存 `dist/` の再利用はしないでください。Site keyを埋め込んだbundleとFunctionsの組み合わせを意図せず取り違える可能性があります。

## E2Eの環境を分ける

`.dev.vars` はローカルE2E専用Neon branchを指定します。Preview staging branchやProduction DBは指定しません。

```dotenv
DATABASE_URL=<ローカルE2E専用Neon branchの接続文字列>
BETTER_AUTH_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
E2E_TEST_MODE=true
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

```sh
rtk npm run dev:e2e
rtk npm run test:e2e -- --project=chromium
```

GitHub Actionsも `E2E_DATABASE_URL` を `.dev.vars` の `DATABASE_URL` として使います。ローカルE2EとGitHub Actionsを同時に起動すると、同じE2E branchへ書き込むため実行を重ねないでください。

GitHubのEnvironmentは次のbranch policyと承認境界で設定します。これはWorkflowファイルだけでは設定できないRepository Settingsの項目です。

- `e2e`: 信頼済みの `main` / `develop` と手動実行で許可するbranchだけ
- `e2e-pr`: PR検証専用。required reviewerを設定し、fork PRへsecretを渡さない
- `preview`: `develop`だけ
- `production`: `main`だけ

例えばfeature branch上でguardを削除したPreview Workflowを手動起動しても、`preview` Environmentのbranch policyでCloudflare tokenを取得できない状態にします。Environment secretの実値はこのリポジトリへ書きません。

Environment secretは次の名前で登録します。`e2e` / `e2e-pr` は `E2E_DATABASE_URL`、`BETTER_AUTH_SECRET`、必要な `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`、`TURNSTILE_SECRET_KEY`、`TURNSTILE_SITE_KEY`、`SENTRY_DSN`、`preview` は `PREVIEW_DATABASE_URL`、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`TURNSTILE_SITE_KEY`、`SENTRY_DSN`、`production` は `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`TURNSTILE_SITE_KEY`、`SENTRY_DSN`、`PRODUCTION_URL`、`ADMIN_CRON_SECRET` を使います。例えばProductionの匿名purgeを動かすには、`purge-anonymous.yml`が`PRODUCTION_URL`と`ADMIN_CRON_SECRET`を`production` Environmentから取得できる状態にします。

`e2e-pr` のrequired reviewerはGitHubのプラン機能に依存します。現在のRepositoryではAPIからrequired reviewers protection ruleを作成できないため、PRへ `e2e-pr` secretを登録する前に、利用プランまたはOrganizationのEnvironment保護機能を確認してください。branch policy自体は設定済みです。

## デプロイ後の確認

まずAPIを確認します。

```sh
rtk curl -fsS https://develop.pomdo.pages.dev/api/health
rtk curl -i -X POST https://develop.pomdo.pages.dev/api/test/auth
```

1つ目が `{"status":"ok","db":"connected"}` 相当を返し、2つ目が404であることを確認します。その後、次を画面で確認します。

- `/app`が表示され、初期Taskが読み込まれる
- Taskを追加してリロードしても残る
- Focusを完了または中断し、Reviewに正しく表示される
- light、dark、systemの設定がリロード後も保持される
- desktop幅とmobile幅でNow、Task追加、Focus、Review、Settingsを操作できる
- キーボードだけで主な操作とdialogの閉じる操作ができる
- `prefers-reduced-motion`で過剰なアニメーションが停止または縮退する

Preview runtimeでは `DATABASE_URL` をstaging branch、`E2E_TEST_MODE` を `false` に設定します。`BETTER_AUTH_SECRET`、Turnstile secret、OAuth設定もPreview専用にし、ProductionのDB・OAuth・trusted originを流用しません。

## トラブルシュート

### `/api/health` がDB接続エラーになる

Cloudflare PagesのPreview runtimeで、staging branchの `DATABASE_URL` が設定されているか確認します。GitHub Actionsの `PREVIEW_DATABASE_URL` はmigration jobだけが使用し、E2Eの `E2E_DATABASE_URL` と混ぜません。

### `develop`のdeployが実行されない

Workflowの品質ゲート、staging migration、candidate health checkのどこで失敗したかを確認します。例えばcandidateの `/api/test/auth` が404でない場合、stable aliasへ進まないのが正しい動作です。

### `npm run deploy:preview`が拒否される

`main`、`master`、`develop`では手動Previewを公開できません。共有Previewを更新する場合は、変更を `develop`へpushし、GitHub Actionsの結果を確認してください。

### 秘密値をコミットしてしまった

Previewの再デプロイだけでは不十分です。該当secretを直ちに失効・ローテーションし、管理者へ共有してください。`DATABASE_URL`、`BETTER_AUTH_SECRET`、`TURNSTILE_SECRET_KEY`、`CLOUDFLARE_API_TOKEN`の実値はソースコード、Markdown、Issue、ログへ書きません。
