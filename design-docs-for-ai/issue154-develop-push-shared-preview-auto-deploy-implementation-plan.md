# Issue #154: developへのpushで共有Previewを自動デプロイする実装計画

## 1. この計画で実現すること

`develop`へのpushを起点に、lint・typecheck・Vitest・coverage・production build・Chromium E2Eをすべて通過した同一コミットのbuild Artifactだけを、Cloudflare Pagesの`develop` branch aliasへデプロイする。PreviewはNeon staging branch、GitHub ActionsとローカルE2EはNeon E2E branchを使い、手動確認用データと自動テストデータを混ぜない。

対象はIssue #154全体であり、PR単位の分割はない。

- Issue: <https://github.com/koshiro222/pomdo/issues/154>
- 成果物: このファイルに従って実装するCI/CD、テスト安定化、環境分離、ドキュメント更新
- 共有Preview URL: `https://develop.pomdo.pages.dev`
- Previewのヘルスチェック: `https://develop.pomdo.pages.dev/api/health`
- 正規の共有Previewブランチ: `develop`
- `rebuild/v1`: 共有Previewの正規ブランチとして扱わない

この計画は、Issue本文、現行コード、現行の依存バージョン、一次情報を根拠にする。`design-docs-for-ai/`にある過去の実装計画は設計根拠にせず、Issue #154が更新を要求している環境・運用記述の更新対象としてだけ扱う。

## 2. 採用する構成と、その理由

### 2.1 WorkflowはReusable Workflowを共通品質ゲートにする

次の3種類の呼び出し側Workflowと、1つのReusable Workflowに分ける。

| Workflow | 起動条件 | E2EのDB | build Artifact | デプロイ |
| --- | --- | --- | --- | --- |
| `quality-gate.yml` | `workflow_call` | eventから自動選択する`e2e` / `e2e-pr` Environment | 呼び出し元のEnvironment用に1回生成 | しない |
| `e2e.yml` | `pull_request`（`main`/`develop`向け）、`workflow_dispatch` | PRは`e2e-pr`、manualは`e2e`の`E2E_DATABASE_URL` | PRは`e2e-pr`、manualは`e2e`の値で作るが公開しない | しない |
| `preview.yml` | `push`（`develop`）、`workflow_dispatch` | `e2e` Environmentの`E2E_DATABASE_URL` | Preview用の公開キーで1回生成 | staging migration後に`develop` aliasへデプロイ |
| `deploy.yml` | `push`（`main`） | `e2e` Environmentの`E2E_DATABASE_URL` | Production用の公開キーで1回生成 | productionへデプロイ |

品質処理をReusable Workflowへ抽出するのは、PR・Preview・Productionでlint、typecheck、Vitest、coverage、build、Chromium E2Eの手順が複製されると、片方だけ修正されて品質ゲートがずれるためである。

buildを品質チェックと別jobにするのは、PreviewとProductionで`VITE_TURNSTILE_SITE_KEY`と`VITE_SENTRY_DSN`が異なるためである。`checks` jobはeventがPRなら承認境界を持つ`e2e-pr`、信頼済みpush/manualなら`e2e`を自動選択し、`build` jobは`build-environment`（`e2e` / `e2e-pr` / `preview` / `production`）をGitHub Environmentとして使う。これにより、次の例ではPreview用Site keyを埋め込んだ`dist`を、E2E DBの品質確認成功後にそのままデプロイできる。

1. `checks` jobが`E2E_DATABASE_URL`へ接続してChromium E2Eを通す。
2. `build` jobが`preview` Environmentの`TURNSTILE_SITE_KEY`でproduction buildを1回だけ実行する。
3. `actions/upload-artifact@v4`で`dist`を保存する。
4. Preview Workflowが`actions/download-artifact@v4`で同じArtifactを取得し、再buildせずに公開する。

Reusable WorkflowへEnvironment secretを渡す場合、呼び出し元のjobからEnvironmentを渡す設計にはしない。GitHub Actionsでは`workflow_call`経由でEnvironment secretをそのまま渡せないため、Environmentの指定をReusable Workflow内のjobに置く。これは、例えばPreview用の`PREVIEW_DATABASE_URL`をE2E jobへ誤って渡さず、`checks` job内では必ず`E2E_DATABASE_URL`を使わせるためでもある。

### 2.2 `develop`のPreview deployは品質ゲート、migration、Artifact deployの順に固定する

Preview Workflowのjob依存関係は次のとおりにする。

`guard-develop` → `quality` → `migrate-staging` → `deploy-preview`

- `guard-develop`: `github.ref == 'refs/heads/develop'`を実行時に検査する。feature branchから`workflow_dispatch`を起動した場合は明示的に失敗させる。
- `quality`: `quality-gate.yml`を`build-environment: preview`で呼び出す。
- `migrate-staging`: `preview` Environmentの`PREVIEW_DATABASE_URL`をstepの`DATABASE_URL`へ明示的に設定し、`npm run db:migrate`を実行する。
- `deploy-preview`: migration成功後に一度だけrunnerへcheckoutとArtifact取得を行い、candidate deploy・候補URL検証・`develop` alias deploy・最終health check・必要時の直前成功bundle再デプロイを同一job内で順序どおり実行する。ここで`npm run build`を再実行しない。

品質ゲートまたはmigrationが失敗した場合、`deploy-preview` jobは`needs`によって実行されない。candidate healthが失敗した場合もstable aliasへのstepへ進まない。Cloudflare Pagesのアップロードが失敗した場合も成功deploymentとして扱わない。migration後のアプリデプロイ失敗時にDBを自動rollbackしないのはIssueの決定事項であり、旧アプリと互換性のあるexpand/contract migrationだけを許可する。

### 2.3 concurrencyは用途ごとに分ける

| 対象 | group | `cancel-in-progress` | 理由 |
| --- | --- | --- | --- |
| E2Eを使う`quality-gate`のchecks job | `pomdo-e2e-${{ github.repository }}` | `false` | 共有Neon E2E branchへ同時書き込みせず、実行順を保つ |
| Preview Workflow全体 | `pomdo-preview-${{ github.ref }}` | `true` | `develop`の古いpushが最新pushを上書きしないようにする |
| Production Workflow全体 | `pomdo-production` | `false` | Production deployを途中でキャンセルして順序を壊さない |

Preview Workflowをキャンセルしても、すでに完了したmigrationを自動rollbackしない。migrationはexpand/contractの前提を守り、新しいコミットでforward fixできる状態にする。

### 2.4 `deploy:preview`はfeature branch用として残し、developからの迂回デプロイを禁止する

`npm run deploy:preview`と`scripts/deploy-preview.mjs`は、作業ブランチを一時的なCloudflare Pages Previewへ手動公開する用途として残す。共有Previewの正式な更新経路にはしない。

現在は`main`/`master`だけを拒否しているため、`develop`も拒否対象へ追加する。これにより、`develop`へのpushが品質ゲートを迂回して手動デプロイされる経路をなくす。例えばfeature branch `feature/task-copy`からの手動Previewは許可し、`develop`からの`npm run deploy:preview`は「共有PreviewはGitHub Actionsからのみ更新する」と表示して停止する。

## 3. 現行コードから確認できた前提と、実装時の注意

### 3.1 現行Workflowの問題

- `.github/workflows/deploy.yml`は`main` pushだけを対象にし、品質処理とProduction deployが1jobに直結している。
- `.github/workflows/e2e.yml`は`main`向けPRだけを対象にし、`develop`向けPRを検証しない。
- 両Workflowが汎用の`DATABASE_URL` Secretを使っているため、E2E接続先がPreview/Productionと名前で分離されていない。
- E2E WorkflowはcoverageとChromium E2Eだけで、lint、typecheck、buildを実行していない。
- 現行deploy Workflowはbuild後にE2Eを実行するが、build結果をArtifact化せず、deploy jobへの明示的な受け渡しもない。
- `deploy.yml`はPreview用の`--branch`を使える形になっているが、`main`専用の起動条件である。

### 3.2 現行のアプリ・テスト構成

- Cloudflare Pages Functionsの`functions/api/[[route]].ts`に`GET /api/health`があり、`DATABASE_URL`へ`SELECT 1`を実行して`{"status":"ok","db":"connected"}`を返す。
- `functions/api/test/auth.ts`は`E2E_TEST_MODE === 'true'`のときだけ利用できる。Preview runtimeは`E2E_TEST_MODE=false`にするため、このendpointを公開しない。
- `scripts/start-e2e-server.mjs`は現在のworktreeの`src`、`functions`、`dist`、`node_modules`、`.dev.vars`を一時ディレクトリへsymlinkし、ViteとWrangler Pages devを起動する。E2Eは共有Preview URLへ接続しない。
- `playwright.config.ts`は`workers: 1`、`fullyParallel: false`であり、E2E identityは既存helperのUUIDベース命名を使っている。共有E2E branchでのデータ衝突を避けるため、この方針を維持する。
- `tests/e2e/v1-auth-link.spec.ts`には、`E2E_TEST_MODE=false`の別URLを渡したときだけ実行するテストが1件ある。通常のE2Eでこの1件がskipされることは意図した状態として記録し、他のunexpected skipは許可しない。

### 3.3 CI secretの承認境界

PRはworkflowのコードを変更できるため、PR検証で本番または信頼済みE2E secretを無条件に公開しない。`pull_request`はGitHub Environment `e2e-pr`を使い、required reviewerの承認後だけ専用のE2E DB・認証・Turnstile値を利用できるようにする。forkからのPRにはsecretを渡さず、必要な場合だけメンテナーが安全性を確認して同一commitを再実行する。`push`と手動実行の信頼済みrefは`e2e`を使う。

Preview deployのworkflow_dispatchは、選択ref上のWorkflowが変更される可能性があるため、step内の`develop` guardだけでは権限境界にならない。GitHub Environment `preview`のdeployment branch policyを`develop`だけに限定し、Preview API tokenをfeature branchへ払い出さない。例えばfeature branchがguardを削除したWorkflowを持っていても、`preview` Environmentのsecret取得段階で停止する。required reviewerを設定する場合も、このbranch policyを置き換えず追加の承認として扱う。

### 3.4 作成時点のテスト観測

作成時点の現行worktreeでは、`npm test -- --run`が24ファイル・92テストすべて成功し、Chromium E2Eは18テスト中17成功・1件skipだった。したがって、実装では現時点で再現しないPGlite timeoutやE2E順序依存を、広いtimeoutやskip追加で隠さない。

Chromium E2Eはローカルで成功した一方、Wranglerから`public/_redirects`の`200!`を不正なstatus codeとして扱う警告が出た。これはPagesのredirect仕様上、`200`はproxyingとして有効だが、`!`付きは有効なcodeではないためである。実装時に`public/_redirects`を`200`形式へ正規化し、`/app`と`/app/*`のdeep linkがCloudflare Pages上でも200でindexを返すことを確認する。`/legal/*`の挙動はFunctions routeとの関係を確認し、警告を消すためだけに深いルーティング変更を追加しない。

## 4. 変更対象ファイル

### 4.1 新規作成

| ファイル | 実装内容 |
| --- | --- |
| `.github/workflows/quality-gate.yml` | `workflow_call`で呼び出す共通品質ゲート。E2E checks、Environment別build、Playwright Artifact、build Artifactを定義する。 |
| `.github/workflows/preview.yml` | `develop` push/manual起動、branch guard、Preview品質ゲート、staging migration、Artifact deploy、health check、Workflow summaryを定義する。 |
| `scripts/assert-playwright-report.mjs` | JSON reportのskipをallowlistと照合し、予期しないskipがあれば品質ゲートを失敗させる。 |
| `tests/helpers/pglite-test-database.ts` | PGliteのschema適用をtest file単位で1回にし、各test前に全テーブルを`TRUNCATE ... CASCADE`するテストfixtureを定義する。 |

### 4.2 変更するWorkflow・設定・スクリプト

| ファイル | 変更内容 |
| --- | --- |
| `.github/workflows/e2e.yml` | `main`/`develop`向けPRとmanual起動に変更し、quality-gateを呼び出す。E2E専用Environmentを使い、deploy stepを持たせない。 |
| `.github/workflows/deploy.yml` | Production deploy専用に整理する。quality-gateを`build-environment: production`で呼び、検証済みArtifactをdeployする。Production migrationは追加しない。wrangler actionはdeployment URL outputが使える公式版へ更新する。 |
| `.github/workflows/purge-anonymous.yml` | Production URLと`ADMIN_CRON_SECRET`だけを使う現行責務を維持し、Preview/E2E secretを参照していないことを確認する。必要なら`environment: production`を付けるが、匿名purgeの動作自体は変更しない。 |
| `playwright.config.ts` | CIの`retries`を`0`にする。失敗を自動retry成功で隠さず、共有E2E branchの順序依存を検出する。`workers: 1`、`fullyParallel: false`、Chromium対象は維持する。 |
| `package.json` | `test:e2e:assert`を追加し、既存JSON reportのskip検査スクリプトをCI品質ゲートから呼び出す。依存関係は追加しない。 |
| `scripts/deploy-preview.mjs` | `develop`からの手動Preview deployを拒否し、feature branch用に限定する。既存の未コミット変更・main/master拒否・Site key必須・build後deployの動作は維持する。 |
| `scripts/start-e2e-server.mjs` | ローカルE2Eが現在のworktreeのVite/Wranglerを使うことを維持する。`DATABASE_URL`未設定時は起動直後に、E2E branch用の`.dev.vars`が必要だと分かるエラーにする。Production/Preview URLをfallbackにしない。 |
| `drizzle.config.ts` | `DATABASE_URL`が未設定ならmigrationを開始できないようにする。CIのmigration jobは`PREVIEW_DATABASE_URL`をstep/jobの`DATABASE_URL`へ明示的に渡し、`.dev.vars`の偶発的な値を優先させない。 |
| `.dev.vars.example` | `DATABASE_URL`はローカルE2E専用Neon branchであること、`E2E_TEST_MODE=true`がローカルE2E専用であることを明記する。実値は追加しない。 |
| `public/_redirects` | `200!`を`200`へ正規化する。`/app`、`/app/*`がSPA入口を返す挙動を保ち、Wranglerのinvalid redirect warningを除去する。`/legal/*`はFunctionsとCloudflare Pagesの仕様を確認してから必要最小限だけ直す。 |

### 4.3 PGlite testの変更

次の既存testを新fixtureへ移行する。

- `src/server/services/bootstrap-service.test.ts`
- `src/server/services/account-link-service.test.ts`
- `tests/integration/v1-database.test.ts`
- `src/server/repositories/task-decomposition-repository.test.ts`

各test fileで`beforeEach`ごとに`new PGlite()`と2つのSQL migrationを実行する構造を、次のライフサイクルへ変える。

1. `beforeAll`でPGliteを1回だけ生成する。
2. `drizzle/0000_v1_initial.sql`と`drizzle/0001_v1_constraints.sql`を1回だけ適用する。
3. `beforeEach`で`accounts`、`analytics_events`、`focus_sessions`、`sessions`、`tasks`、`users`、`verifications`を`TRUNCATE ... CASCADE`してDBを空にする。
4. `afterAll`でPGliteをcloseする。

これにより、全テストを共有するのではなくtest file内だけでDBを再利用し、テスト間のデータ汚染を防ぎながら、migration起動とPGlite WASM初期化の繰り返しをなくす。現在のPGliteテストで観測された数秒単位の各test setupを短縮し、CIのtimeout原因になり得る初期化競合を解消する。test timeout値を一律に増やすことはしない。

fixtureに入れるSQLはアプリのmigrationそのものではなく、テストを初期状態へ戻すための共通処理である。`TRUNCATE ... CASCADE`が循環FKを含む現行schemaで通ることをfixture自身のVitestテスト、または既存の各testの成功で確認する。各testは既存どおりUUIDのユーザー・Taskを作成し、test同士の順序に依存しない状態を保つ。

## 5. Workflowの詳細

### 5.1 `quality-gate.yml`のinputs・outputs・Environment

`on.workflow_call`で次を受ける。

- `checkout-ref`: string、必須。pushでは`github.sha`、PRではPR merge refの`github.sha`、manualでは選択されたrefの`github.sha`を渡す。
- `checks-environment`: string、必須。PRは`e2e-pr`、信頼済みpush/manualまたはPreview/Production callerは`e2e`を渡す。`e2e` / `e2e-pr`以外は拒否する。
- `build-environment`: string、必須。信頼済みpush/manualは`e2e`、PRは`e2e-pr`、Previewは`preview`、Productionは`production`。この4値以外は拒否する。

返すoutputは次の1つとする。

- `build-artifact-name`: build jobがuploadしたArtifact名。`pomdo-dist-${{ github.sha }}`のようにcommit SHAを含め、別runのArtifactを誤取得しない。

`checks` jobのEnvironmentはcallerが`checks-environment` inputで明示する。Reusable Workflow内の`github.event_name`は呼び出し元の`pull_request`ではなく`workflow_call`になるため、called workflow側でeventから推測しない。PR callerは`checks-environment: e2e-pr`、信頼済みpush/manualまたはPreview/Production callerは`checks-environment: e2e`を渡す。`build` jobのEnvironmentは`inputs.build-environment`とする。checks jobのstepで`e2e`、`e2e-pr`以外を拒否し、build jobのstepでも`e2e`、`e2e-pr`、`preview`、`production`以外を拒否する。PR callerは`build-environment: e2e-pr`を渡し、信頼済みpush/manualは`e2e`を渡す。

Environment側にもdeployment branch policyを設定する。`e2e-pr`はPR検証とrequired reviewer、`e2e`は信頼済み`main`/`develop`とmanual許可branch、`preview`は`develop`、`production`は`main`だけを許可する。これにより、PRがcallerまたはReusable Workflowを改変して`e2e`・`preview`・`production`を指定しても、保護対象Environmentのsecretを取得できない。manualでfeature branchをE2E検証したい場合は、secretを使うGitHub ActionsではなくローカルE2Eを使う。

### 5.2 checks jobのstep順序

CLAUDE.mdの品質管理順序に合わせ、次の順にする。

1. `actions/checkout@v4`で`checkout-ref`をcheckoutする。
2. `actions/setup-node@v4`でNode.js 20を設定し、npm cacheを有効にする。
3. `npm ci`。
4. E2E Environmentの値から、検証用`.dev.vars`を生成する。
5. `npm run lint`。
6. `npm run typecheck`。
7. `npm test -- --run`。
8. `npm run test:coverage`。
9. `npx playwright install --with-deps chromium`。
10. `npm run test:e2e -- --project=chromium`。
11. `npm run test:e2e:assert`でJSON reportのskipをallowlist検査する。
12. Playwright reportと`test-results/`を`if: always()`でuploadする。skip検査の失敗時もreportをArtifactへ残す。

`.dev.vars`へ書く値は、checks jobのEnvironment（信頼済みpush/manualは`e2e`、PRは`e2e-pr`）から取得する。値そのものをlogへ出さない。

| `.dev.vars`のキー | 値 |
| --- | --- |
| `DATABASE_URL` | `e2e` Environmentの`E2E_DATABASE_URL` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | E2E専用値。Production OAuth値は使わない |
| `BETTER_AUTH_SECRET` | `e2e` Environmentの専用secret |
| `BETTER_AUTH_URL` / `FRONTEND_URL` | `http://localhost:5173` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstileのテストsecret |
| `E2E_TEST_MODE` | `true` |
| `SENTRY_DSN` | 空値 |

E2Eは`BASE_URL`を設定せず、Playwrightが`npm run dev:e2e`を起動する既存経路を使う。共有Preview URLへE2Eを向けない。`DATABASE_URL`はE2E branchだけにし、Preview staging branchやProduction DBのURLを入力しない。

CIのretryは0回とする。したがって、18件中17件がpassし1件が意図したskipとなる現行のような状態は成功だが、失敗したtestがretryでpassしたことを成功扱いにすることはない。`scripts/assert-playwright-report.mjs`は既存の`test-results/results.json`を読み、skipの完全一致タイトルを1件だけ許可する。許可タイトルは`テスト専用認証 endpoint は本番モードで公開しない`で、`E2E_DISABLED_BASE_URL`が未設定の通常runに限る。skip件数、タイトル、環境条件が一致しない場合はexit code 1とし、`test.skip`を追加して品質ゲートを通すことは禁止する。例えば新しいskipが1件増えた場合や、既存testのタイトルを変更した場合も失敗させる。

### 5.3 build jobとArtifact

checks成功後にbuild jobを実行する。

- `actions/checkout@v4`で同じ`checkout-ref`をcheckoutする。
- `actions/setup-node@v4`と`npm ci`を実行する。
- build jobのEnvironmentから`TURNSTILE_SITE_KEY`を`VITE_TURNSTILE_SITE_KEY`へ、`SENTRY_DSN`を`VITE_SENTRY_DSN`へ注入する。
- `npm run build`を1回だけ実行する。
- `dist/`を`actions/upload-artifact@v4`でArtifact化する。Artifact名はcommit SHAを含める。
- Artifactのupload後に`build-artifact-name`をReusable Workflow outputへ渡す。

`TURNSTILE_SECRET_KEY`、`BETTER_AUTH_SECRET`、`DATABASE_URL`などserver-only値はbuild jobのVite環境へ渡さない。`VITE_`を付けるのは公開してよいSite keyとSentry DSNだけである。例えばPreview buildに`VITE_TURNSTILE_SITE_KEY`は入るが、`TURNSTILE_SECRET_KEY`はbrowser bundleに入らない。PR buildは`e2e-pr` Environmentの公開テストSite keyとSentry値を使い、`e2e` EnvironmentのDB/Auth secretはbuildへ渡さない。

### 5.4 PR検証Workflow

`.github/workflows/e2e.yml`を次の条件にする。

- `pull_request.branches: [main, develop]`
- `workflow_dispatch`
- PR/manualともにquality-gateを呼び出す。
- PRではchecksが自動的に`e2e-pr`を使い、manualでは`e2e`を使う。PRは`build-environment: e2e-pr`、manualは`build-environment: e2e`とする。PRではdeployをしないため、buildにはPR専用の公開テストSite keyを使う。manualのsecret付き実行は`main`/`develop`だけを許可し、feature branchはローカルE2Eで検証する。
- `workflow_dispatch`のrefが`main`/`develop`以外なら、secret付きjobを起動前にguardで失敗させる。Environmentのbranch policyも同じ制約を強制し、callerやReusable Workflowの改変だけで回避できないようにする。
- `secrets: inherit`は使わず、Reusable Workflow内で`e2e-pr` / `e2e` Environmentから取得する。同一repositoryのPRでも`e2e-pr`のrequired reviewer承認前はsecretを利用できない。fork PRにはsecretを渡さず、承認済みの安全な再実行手順を運用に記載する。
- Cloudflare Pagesのdeploy、staging migration、production migrationを一切持たせない。

PRが`main`向けでも`develop`向けでも、同じ品質ゲートを通す。manual起動は選択したrefを検証するだけで、Previewへ公開しない。

### 5.5 Preview Workflow

`.github/workflows/preview.yml`を追加する。

#### triggerとguard

- `push.branches: [develop]`
- `workflow_dispatch`
- `concurrency.group: pomdo-preview-${{ github.ref }}`
- `cancel-in-progress: true`
- `permissions`は`contents: read`、`actions: read`、`deployments: write`に絞る。直前成功Artifactの取得に`actions: read`を使い、Cloudflare token以外の権限を追加しない。
- `guard-develop`で`github.ref`が`refs/heads/develop`であることを確認する。

`workflow_dispatch`でfeature branchを選択した場合は、guard stepが失敗し、quality・migration・deployは実行されない。jobを単にskipするだけにせず、失敗として残すことで、手動操作が拒否されたことをGitHub Actions上で確認できる。

#### quality call

guard成功後にquality-gateを呼び、次を渡す。

- `checkout-ref: ${{ github.sha }}`
- `build-environment: preview`

品質ゲートのchecksはE2E DB、buildはPreview Environmentの公開Site keyとSentry DSNを使う。

#### staging migration

`migrate-staging`はquality成功後に実行する。

- `environment: preview`
- `actions/checkout@v4`
- Node.js 20と`npm ci`
- `DATABASE_URL: ${{ secrets.PREVIEW_DATABASE_URL }}`をjob/stepへ明示的に設定
- `test -n "$DATABASE_URL"`で未設定を検出するが、URLは出力しない
- `npm run db:migrate`

`drizzle.config.ts`が`.dev.vars`または`DATABASE_URL`を読む現在の実装に対して、CIでは`.dev.vars`を作らず、`PREVIEW_DATABASE_URL`を`DATABASE_URL`へ明示する。Production DBのsecret名をこのjobから参照しない。

このIssueで新しいschema変更がない場合、既存pending migrationをstagingへ適用するだけにする。将来このIssueの実装でmigrationを追加する必要が出た場合は、次のSQLだけを許可する。

- nullable column、default付きcolumn、後方互換なtable/indexの追加
- 旧アプリが無視できる新しい値の追加
- 先にadd/backfillし、別のリリースで制約・rename・削除を行うexpand/contractの前半

旧アプリで読めない制約の追加、既存columnの即時rename/delete、既存行に値がない状態での`NOT NULL`追加、Productionへの自動migrationは実装しない。

#### Preview deploy

`deploy-preview`はmigration成功後に実行する。Cloudflare PagesのPreview branch aliasは常にそのbranchの最新deploymentへ更新され、公式rollbackはproduction deployment向けでPreviewをrollback targetにできない。この制約を踏まえ、候補deploymentを先に検証してから固定aliasへ同じArtifactを公開する二段階にする。

- `environment: preview`
- deploy job自身で`actions/checkout@v4`を`checkout-ref`と同じcommitに対してrepository rootへ実行する。Artifactの`dist/`はそのrootへ取得し、checkout側の`functions/`を残す。
- `actions/download-artifact@v4`で`needs.quality.outputs.build-artifact-name`を`dist/`へ取得する。
- 直前の成功Preview Workflowが保存した`preview-last-good` ArtifactをGitHub Actions API経由で取得し、存在すれば`rollback-bundle/`へ展開する。Artifactのrun IDとcommit SHAはsummaryへ記録するが、secretとURLの接続文字列は出力しない。初回deployでbundleがない場合は復旧対象なしとして扱う。
- `deploy-candidate`として、同じrootから`pages deploy dist --project-name=pomdo --branch=develop-candidate --commit-hash=${{ github.sha }}`を実行し、Wranglerが返す候補deployment URLとIDを取得する。candidate branchは毎回同じ名前にして公開candidate aliasを増やさず、これはbuildの再実行ではなく同じArtifactの候補公開である。
- 候補deployment URLに対して`/api/health`がHTTP成功かつJSONの`status=ok`、`db=connected`を返すこと、`/api/test/auth`へのPOSTが404になることを確認する。候補が失敗した場合は固定`develop` aliasへのdeployを実行しない。
- 候補が成功した後、同じ`dist/`とcheckout側の`functions/`を`--branch=develop`でアップロードする。`functions/`を`dist/`へコピーしてごまかさず、Cloudflare Pages Functionsと静的Artifactを同じuploadへ含める。Buildは1回だけで、candidateとstableへのuploadが2回になる点をsummaryへ明記する。
- `CLOUDFLARE_API_TOKEN`と`CLOUDFLARE_ACCOUNT_ID`はPreview Environmentの最小権限secretを使う。
- 両deploymentのURL、commit SHA、候補検証結果、`https://develop.pomdo.pages.dev`を`$GITHUB_STEP_SUMMARY`へ書く。
- 固定aliasへ反映後に`curl --fail --retry 10 --retry-delay 5 https://develop.pomdo.pages.dev/api/health`を実行し、HTTP成功かつJSONの`status=ok`、`db=connected`を確認する。失敗してもrollback処理を実行できるようhealth stepは結果を保持する。
- stable upload後の固定alias health failure時は、`rollback-bundle/`があれば直前成功commitの`dist/`と`functions/`を同じ`--branch=develop`へ再デプロイし、復旧後の`/api/health`を確認する。これはDB migrationのrollbackではなく、Pages Previewに公式rollback APIがないための「直前成功bundleの再公開」である。復旧に失敗した場合または初回deployでbundleがない場合はWorkflowを失敗させ、deployment IDと手動復旧手順をsummaryへ残す。
- stable upload後のcandidate deploymentについて、`wrangler pages deployment list --json`で`develop-candidate`の過去deploymentを列挙し、最新candidateを1件だけ残して非最新のcandidateを`wrangler pages deployment delete <id> --force`で削除する。削除できない最新deploymentは次回candidate作成後に再試行し、古い公開URLが無制限に増えないよう保持数と失敗時のcleanup結果をsummaryへ残す。
- stable healthが成功し、rollback不要であることを確認した後だけ、`dist/`と`functions/`を`preview-last-good/`へまとめ、`actions/upload-artifact@v4`で同じworkflow runに保存する。Artifactはcommit SHAを含むmetadataとともに30日保持し、次回runの復旧用にする。upload失敗は成功deploy後の復旧資産欠落としてWorkflowを失敗させ、summaryへ記録する。

quality/migration/candidate health失敗時はstable deploy step自体を起動しないため、`develop` aliasは直前の成功deploymentのままである。stable upload失敗時も新しいalias公開が成立したと判定しない。stable upload後の固定alias health failureは、直前成功bundleを再公開して`develop` aliasを旧状態へ戻し、復旧healthが成功するまでWorkflowを成功扱いにしない。Pages Previewの公式rollback APIを使えるとは仮定しない。直前成功bundleの取得・再公開・復旧healthが失敗した場合だけ、人手のCloudflare確認とforward fixへ送る。この方式で、通常の失敗経路では失敗成果物を公開状態に残さない。

`preview` GitHub Environmentのdeployment branch policyは`develop`だけを許可する。これを設定しないと、feature branch上でguardを変更したworkflow_dispatchがPreview API tokenを取得できるため、step内guardは単独のセキュリティ対策にならない。

### 5.6 Production Workflow

`.github/workflows/deploy.yml`は`push.branches: [main]`のProduction deployに限定する。

- `concurrency.group: pomdo-production`
- `cancel-in-progress: false`
- deploy jobに`environment: production`を指定し、Production EnvironmentのCloudflare token/account IDを取得する。build jobも`build-environment: production`経由で同じEnvironmentの公開値を使う。
- quality-gateを`checkout-ref: ${{ github.sha }}`、`build-environment: production`で呼び出す。
- checksはE2E EnvironmentのE2E DBを使う。
- buildはProduction Environmentの公開Site keyとSentry DSNを使う。
- Artifactをdownloadし、再buildせずにCloudflare PagesのProduction branchへdeployする。
- deploy job自身で同じ`checkout-ref`をrepository rootへcheckoutし、Artifactの`dist/`とcheckout側の`functions/`をそろえてからdirect uploadする。Previewと同様にPages Functionsを`dist/`へコピーしない。
- Production DB migrationは実行しない。
- deploy成功時にdeployment URL、commit SHA、`https://pomdo.pages.dev`をWorkflow summaryへ書く。

Production deployのE2EでProduction DBへ接続しないことが、Preview変更によるProductionデータ汚染を防ぐ重要な条件である。Production runtime自身はCloudflare Pages dashboardのProduction environmentでProduction DB・Production auth secret・Production OAuth設定を使う。

## 6. Secret・Environment対応表

### 6.1 GitHub Actions Environment

実値はこの計画、Issue、ログ、Markdown、commitへ書かない。

| GitHub Environment | Secret/variable | 用途 |
| --- | --- | --- |
| `e2e` | `E2E_DATABASE_URL` | GitHub Actions E2EとローカルE2EのNeon E2E branch |
| `e2e` | `BETTER_AUTH_SECRET` | E2E専用Better Auth secret |
| `e2e` | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | 必要な場合だけE2E専用OAuth値。Production値は禁止 |
| `e2e` | `TURNSTILE_SECRET_KEY` | E2E用Turnstile test secret。公開テスト値ならsecretでなく固定値でもよい |
| `e2e` | `TURNSTILE_SITE_KEY` | E2E build用公開テストSite key |
| `e2e` | `SENTRY_DSN` | E2E buildで必要なら空値 |
| `e2e-pr` | `E2E_DATABASE_URL`ほかE2E専用値 | PR検証専用。required reviewer承認後だけ利用し、`e2e`とは分離した専用branch/secretを使う |
| `e2e-pr` | `TURNSTILE_SITE_KEY` / `SENTRY_DSN` | PR build専用の公開値。`e2e` / Preview / Productionのbuild値は使わない |
| `preview` | `PREVIEW_DATABASE_URL` | Neon staging branch。migration jobだけが参照 |
| `preview` | `TURNSTILE_SITE_KEY` | Preview buildの`VITE_TURNSTILE_SITE_KEY` |
| `preview` | `SENTRY_DSN` | Preview buildの`VITE_SENTRY_DSN` |
| `preview` | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | Pages deployに必要な最小権限 |
| `production` | `TURNSTILE_SITE_KEY` / `SENTRY_DSN` | Production build用 |
| `production` | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | Production Pages deployに必要な最小権限 |

`DATABASE_URL`という汎用GitHub Secretへ戻さない。E2Eは`E2E_DATABASE_URL`、Preview migrationは`PREVIEW_DATABASE_URL`を使い、job内で必要な範囲だけ`DATABASE_URL`へ代入する。

切り替え時にはRepository Settings > Secrets and variables > Actionsを棚卸しし、旧Workflowが参照していたrepository-levelの`DATABASE_URL`、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`などを削除または失効させる。削除できない互換期間を設ける場合でも、Workflowから参照を完全に除去し、期限と削除担当をIssueへ記録する。例えばPR側で`secrets.DATABASE_URL`を追加するだけでE2E DBへ到達できる状態を残さない。secret実値は確認ログへ出さず、存在確認はsecret名とEnvironment設定だけで行う。

### 6.2 Cloudflare Pages Runtime

GitHub EnvironmentとCloudflare Pages dashboardのEnvironmentは別物である。GitHub Actionsのsecret設定だけではPages runtimeのEnvironment variableは設定されないため、次の値をPages dashboardにも登録する。

| Pages runtime | `DATABASE_URL` | `E2E_TEST_MODE` | Auth/TLS/Turnstile |
| --- | --- | --- | --- |
| Preview | Neon staging branch | `false` | Preview専用`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`/`FRONTEND_URL`=`https://develop.pomdo.pages.dev`、Preview用Turnstile secret、必要ならstaging専用OAuth |
| Production | Production DB | `false` | Production用secret、`https://pomdo.pages.dev`、Production OAuth、Production Turnstile |

PreviewにProduction DB URL、Production OAuth client、Production trusted originを設定しない。E2E専用の`/api/test/auth`と固定Turnstile token経路はPreviewで利用できない。

## 7. テスト・不安定性修正方針

### 7.1 PGlite timeout

現行テストは各testの`beforeEach`でPGlite生成、`0000`/`0001` SQL適用、各testの`afterEach`でcloseしている。作成時点では全テスト成功しているが、`task-decomposition-repository.test.ts`などのtest setupが数秒かかっており、CI負荷でtimeoutの原因になり得る。

このIssueでは、次の順で原因を切り分ける。

1. `npm test -- --run`を実行し、Vitestのverbose結果でPGlite fileごとのsetup時間を記録する。
2. 新fixtureへ移行し、schema適用をfile単位で1回、各testはtruncateだけにする。
3. 同じtestを2回以上連続実行し、結果・実行時間・DB初期状態が変わらないことを確認する。
4. CI相当のNode 20/Linux環境で再実行する。
5. まだtimeoutする場合は、PGlite fileだけを直列実行する設定を検討する。test timeoutを全体で増やす、`test.skip`する、retryで隠す、という対応は採用しない。

### 7.2 E2E失敗・順序依存

- `workers: 1`と`fullyParallel: false`を維持する。
- E2E identityは既存helperのUUID命名を使い、別runのidentityと衝突させない。
- E2E DBは共有branchのため、GitHub Actionsのchecks jobを`cancel-in-progress: false`で直列化する。
- PR、Preview、Productionの全E2Eが同じconcurrency groupを使う。Workflowごとに別groupへ分けて同時実行しない。
- 既存E2Eはskip追加や期待値変更で通さない。
- retryは0回とし、失敗testは失敗として扱う。
- ローカルE2EとGitHub Actions E2Eを同時に起動しないことをREADMEとPreview手順へ明記する。

### 7.3 意図したskipとEndpoint security

`tests/e2e/v1-auth-link.spec.ts`の`E2E_TEST_MODE=false`検証は、別URLを用意した場合だけ実行する意図したskipである。通常の品質ゲートではVitestの`test-auth-endpoint.test.ts`で`false`時404を検証し、Preview deploy後のcurlでも404を確認する。別のskipが出た場合は品質ゲートを成功扱いにしない。

## 8. 受け入れ条件

Issue #154の全条件を、実装後に次で判定する。

- [ ] `develop` pushでPreview Workflowが起動する。
- [ ] `workflow_dispatch`をfeature branchから起動するとguardで失敗し、Preview deployされない。
- [ ] `main`または`develop`向けPRでquality gateが起動し、Previewへdeployされない。
- [ ] PR Workflowがlint、typecheck、Vitest、coverage、production build、Chromium E2Eを実行する。
- [ ] 予期しないE2E failureとskipが0件である。許可するskipは本計画で指定した本番モードendpoint検証1件だけである。
- [ ] `scripts/assert-playwright-report.mjs`がJSON reportを検査し、許可タイトル以外のskip、skipタイトル変更、追加skipをexit code 1で拒否する。
- [ ] 現行PGlite testのschema初期化をfile単位に整理し、timeoutを広い値の追加で隠していない。
- [ ] quality gate成功後だけstaging migrationへ進む。
- [ ] migration失敗時にPreview deployされない。
- [ ] 固定`develop` aliasへ反映する前にcandidate URLの`/api/health`が`status=ok`かつ`db=connected`を返し、`/api/test/auth`が404であることを確認する。
- [ ] buildはquality gate内で1回だけ実行され、downloadした同一`dist` Artifactがdeployされる。
- [ ] Preview deployのbranch指定が`develop`である。
- [ ] candidate branchは`develop-candidate`の1つだけを使い、非最新candidate deploymentをcleanupして公開deployment数が無制限に増えない。
- [ ] Preview deploy後の`https://develop.pomdo.pages.dev/api/health`が`status=ok`かつ`db=connected`を返す。
- [ ] quality/migration/candidate検証失敗時はstable deploy stepが起動せずaliasが旧成功deploymentのままである。stable upload後のhealth failure時は直前成功の`preview-last-good` bundleを再公開し、復旧後healthが成功するまでWorkflowを成功扱いにしない。bundleなし・再公開失敗時の手動復旧条件が記録される。
- [ ] Preview runtimeの`DATABASE_URL`がNeon staging branchで、Production DBではない。
- [ ] GitHub Actions E2EとローカルE2Eの`DATABASE_URL`がNeon E2E branchで、staging branchではない。
- [ ] Preview作成のTask・Focus SessionがProductionに現れない。
- [ ] E2Eが作成したユーザー・Task・Focus SessionがPreviewに現れない。
- [ ] Preview buildに`VITE_TURNSTILE_SITE_KEY`が入り、`TURNSTILE_SECRET_KEY`などserver-only secretがbundleへ入らない。
- [ ] Previewの`/api/test/auth`が404で、固定Turnstile tokenを受け付けない。
- [ ] Production Google OAuthのtrusted originにPreview URLを追加せずに動作する。
- [ ] developへの連続pushで古いPreview Workflowがキャンセルされ、古いcommitが最新Previewを上書きしない。
- [ ] `preview` Environmentのdeployment branch policyが`develop`だけを許可し、`e2e-pr` Environmentがrequired reviewer承認前にPRへsecretを渡さない。
- [ ] 旧repository-level secretの棚卸し・削除または失効が完了し、Workflowに`secrets.DATABASE_URL`などの直接参照が残っていない。
- [ ] E2E Workflowは共有E2E branchへ直列アクセスする。
- [ ] Productionの`main` deployとProduction DB接続が回帰しない。
- [ ] `CONTEXT.md`、ADR、README、Preview手順、Issue #148の関連環境記述が`develop`中心の環境モデルと一致する。

## 9. ブラウザでの確認手順

### 9.1 開発環境を確認する

実画面確認の前に、対象が現在のworktreeであることを確認する。

1. `git status --short --branch`で対象branchと差分を確認する。
2. `lsof -nP -iTCP:5173 -sTCP:LISTEN`と`lsof -nP -iTCP:8788 -sTCP:LISTEN`で既存serverを確認する。
3. 別worktreeのserverが使われている場合は停止または空きportを使い、現在のworktreeから`npm run dev:e2e`を起動する。
4. `http://localhost:8788/api/health`がE2E DBへ接続して`status=ok`、`db=connected`を返すことを確認する。
5. ローカルE2E実行中はGitHub Actionsを同時に起動しない。

### 9.2 Preview URLで確認する

1. `https://develop.pomdo.pages.dev/api/health`を開き、`{"status":"ok","db":"connected"}`相当のJSONを確認する。
2. `/`を開き、LPが表示されることを確認する。
3. `使ってみる`を押し、`/app`へ遷移する。匿名ユーザーが準備され、`Pomdo を5分だけ触ってみる`が初期Taskとして表示される。
4. Taskを追加し、画面へ表示された後にリロードする。追加Taskが残ることを確認する。
5. Focusを開始し、完了またはストップする。ReviewでCompleted/Interruptedの記録が仕様どおりに表示されることを確認する。
6. Settingsでlight/dark/systemを切り替え、リロード後も選択が保持されることを確認する。
7. desktop幅とmobile幅で、Now、Task追加、Focus、Review、Settingsが操作できることを確認する。
8. キーボードだけで主な操作を行い、focus ring、dialogの閉じる操作、slider操作が可能であることを確認する。
9. `prefers-reduced-motion`を有効にしてspinnerやFocus表示の過剰なアニメーションが停止または縮退することを確認する。
10. Network断をDevToolsで再現し、読み込み失敗と再試行UIが表示され、復旧後に再試行できることを確認する。
11. E2Eが作成したidentity由来のTask titleがPreviewに存在しないことを確認する。
12. Previewで一意なTaskを作成し、リロード後も残ることを確認する。Production URLを開き、そのTaskが存在しないことを確認する。
13. `POST https://develop.pomdo.pages.dev/api/test/auth`を実行し、404であることを確認する。

### 9.3 失敗系と同時実行を確認する

1. 直前の成功commitを記録する。
2. `develop`へ短時間に2commit pushし、古いWorkflowがcancelled、新しいWorkflowだけが最後の成功Artifactをdeployすることを確認する。
3. `workflow_dispatch`をfeature branchで起動し、guard failureとdeploy未実行を確認する。
4. staging migrationを意図的に失敗させる検証は、実際の共有stagingを壊さない隔離された検証方法で行う。失敗後に`develop` aliasが直前の成功deploymentを指し、deploy jobが実行されないことを確認する。
5. E2Eを意図的に失敗させ、migration/deployへ進まないこと、Playwright reportがArtifactに残ることを確認する。

## 10. 品質管理の実行手順

実装担当は、コードとWorkflowの修正後にCLAUDE.mdの順序を省略しない。

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --run`
5. `npm run test:coverage`
6. `npm run build`（Preview/Production相当の`VITE_TURNSTILE_SITE_KEY`を注入）
7. `npm run test:e2e -- --project=chromium`
8. Playwright CLIで実画面を操作する
9. light/dark/system、mobile/desktop、keyboard、reduced-motion/transparency、network断を確認する
10. `git diff --check`、`rebuild/v1`・`rebuild-v1`の旧Preview参照検索、secret名と実値の混入確認をする

Workflow変更は次も確認する。

- PR、develop push、main push、manual dispatchそれぞれのeventとbranch条件をYAML上で読み直す。
- Reusable Workflowの`needs`とoutputが、`quality → migration → deploy`を保証している。
- `actions/download-artifact@v4`のArtifact名が、同一commitのquality outputと一致している。
- Preview/Productionのbuild secretとE2E secretがjob単位で分離されている。
- Preview WorkflowにProduction DBやProduction OAuth secretの参照がない。
- E2E concurrencyが全呼び出し元で同じgroupになり、`cancel-in-progress: false`である。
- Preview concurrencyが`cancel-in-progress: true`である。
- deploy actionのdeployment URL、alias URL、commit SHAがsummaryに残る。
- `/api/health`と`/api/test/auth`のpost-deploy確認が、secretを出力しない。

## 11. ライブラリ・Action APIのバージョンと一次情報

実装時はpackage.json/package-lock.jsonにあるバージョンを変更せず、次のAPI形式を使う。新しいnpm runtime依存は追加しない。

| 対象 | 現在のバージョン/利用形 | 実装で使うAPI・CLI | 一次情報 |
| --- | --- | --- | --- |
| Node/npm | WorkflowはNode.js 20 | `npm ci`、`npm run ...` | <https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs> |
| Drizzle Kit | `drizzle-kit` 0.31.9 | `DATABASE_URL`を環境変数に設定して`npm run db:migrate`（内部は`drizzle-kit migrate`） | <https://orm.drizzle.team/docs/drizzle-kit-migrate>、<https://orm.drizzle.team/docs/drizzle-config-file> |
| Drizzle ORM | `drizzle-orm` 0.45.1 | 既存の`createDb(databaseUrl)`、`drizzle-orm/neon-http`、`createTestDb(PGlite)`を維持 | <https://orm.drizzle.team/docs/connect-neon>、<https://orm.drizzle.team/docs/get-started-postgresql> |
| Neon driver | `@neondatabase/serverless` 1.0.2 | Edge runtimeの既存`neon(databaseUrl)`を維持。CIがNeon URLを直接扱うだけで、TCP clientを追加しない | <https://neon.tech/docs/serverless/serverless-driver> |
| PGlite | `@electric-sql/pglite` 0.3.14 | `new PGlite()`、`client.exec(sql)`、既存`createTestDb(client)` | <https://pglite.dev/docs/api>、<https://pglite.dev/docs/orm-support> |
| Vitest | 4.0.18 | `npm test -- --run`、現行test globals。timeout追加ではなくfixture改善 | <https://vitest.dev/guide/> |
| Playwright | `@playwright/test` 1.58.2 | `playwright test --project=chromium`、`workers: 1`、`retries: 0`、既存`page.clock` | <https://playwright.dev/docs/test-retries>、<https://playwright.dev/docs/clock>、<https://playwright.dev/docs/test-configuration> |
| GitHub reusable workflow | GitHub Actions | `on.workflow_call`、`jobs.<job>.uses`、workflow outputs | <https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows> |
| GitHub concurrency | GitHub Actions | `concurrency.group`、`cancel-in-progress` | <https://docs.github.com/en/actions/using-jobs/using-concurrency> |
| GitHub Environment | GitHub Actions | `jobs.<job>.environment`でsecret境界を作る | <https://docs.github.com/en/actions/concepts/workflows-and-actions/deployment-environments> |
| Artifact | `actions/upload-artifact@v4` / `actions/download-artifact@v4` | build jobでupload、deploy jobで同名Artifactをdownload | <https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts>、<https://github.com/actions/upload-artifact>、<https://github.com/actions/download-artifact> |
| Cloudflare Wrangler | npm `wrangler` 4.69.0、Actionはdeployment URL outputを使える公式版 | `pages deploy dist --project-name=pomdo --branch=develop --commit-hash=<sha>` | <https://developers.cloudflare.com/workers/wrangler/commands/pages/>、<https://github.com/cloudflare/wrangler-action> |
| Cloudflare Pages Functions | repository rootの`functions/`をdirect uploadへ含める | `dist/` Artifactだけでなく同一commitをcheckoutしたrootからdeployし、Functionsを静的assetと一緒に公開 | <https://developers.cloudflare.com/pages/functions/get-started/>、<https://developers.cloudflare.com/pages/get-started/direct-upload/> |
| Cloudflare Pages Preview | Pages branch alias | `develop` branchを指定してaliasを更新 | <https://developers.cloudflare.com/pages/configuration/preview-deployments/>、<https://developers.cloudflare.com/pages/configuration/branch-build-controls/> |
| Cloudflare Pages rollback | Production rollback API。Preview deploymentはrollback targetにできない | Previewでは直前成功の`dist`+`functions` bundleをGitHub Artifactへ保存し、stable aliasのhealth failure時に同じ`develop` branchへ再公開して復旧する。Pages APIのPreview rollbackを仮定しない | <https://developers.cloudflare.com/pages/configuration/rollbacks/>、<https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/> |
| Cloudflare Pages redirects | Pages `_redirects` | `/app /index.html 200`形式。`200!`は使わない | <https://developers.cloudflare.com/pages/configuration/redirects/> |
| Vite env | Vite 7.3.1 | `VITE_TURNSTILE_SITE_KEY`だけをclient buildへ注入し、server-only secretは`VITE_`にしない | <https://vite.dev/guide/env-and-mode> |

Cloudflare Wrangler Actionは現行Workflowの`@v3`から、deployment URL outputを使える公式READMEの`@v4`へ更新する。これはnpm依存の更新ではなく、Workflow Actionのmajor version更新である。Action v4でoutput名が変わる場合は、実装時に同READMEの現行記載へ合わせ、summaryへdeployment URLを残すという要件を優先する。

## 12. ドキュメント更新

### `CONTEXT.md`

環境用語を現行コードと一致させる。

- Preview = `develop` branch alias、固定URL `https://develop.pomdo.pages.dev`、Neon staging branch、`E2E_TEST_MODE=false`
- E2E environment = GitHub ActionsとローカルE2E、Neon E2E branch、`E2E_TEST_MODE=true`
- Production = `main`、Production DB、Production OAuth
- `rebuild/v1`を共有Previewの正規名称として使わない

### `docs/adr/0012-develop-push-shared-preview.md`

既存ADRの判断を実装後のWorkflow構成に合わせて補強する。

- Reusable Workflowで品質処理を共通化する理由
- build Artifactを1回だけ検証・deployする理由
- GitHub Environment secretとCloudflare Pages runtime secretの分離
- E2E concurrencyと`cancel-in-progress`の使い分け
- migration失敗時のdeploy停止、candidate health gate、Preview aliasには公式rollbackがないため手動再デプロイまたはforward fixへ送る理由

### `README.md`

- 共有Previewの固定URLを`develop.pomdo.pages.dev`へ更新する。
- `develop` pushが自動deployの正式経路であることを記載する。
- `npm run deploy:preview`はfeature branch用で、`develop`の代替ではないと記載する。
- ローカルE2EはE2E branchを使い、GitHub Actions E2Eと同時起動しないことを記載する。
- `npm run test:e2e -- --project=chromium`、Preview health check、`/api/test/auth` 404確認を記載する。

### `docs/development/preview-deploy.md`

現在の`rebuild-v1.pomdo.pages.dev`中心の説明を次へ置き換える。

- 自動共有Preview: `develop.pomdo.pages.dev`
- DB: Previewはstaging、E2EはE2E branch
- 自動deployの順序とArtifact再build禁止
- Pages dashboardのPreview runtime secret設定
- `deploy:preview`はfeature branchだけに許可
- health check、Task保持、Turnstile、secret混入確認
- 失敗時はDB migration rollbackではなく、candidate検証と直前成功bundleの自動再公開で復旧する。bundleなし・再公開失敗時だけ手動再デプロイまたはforward fixへ送る。Pages Preview aliasの公式rollback APIは使わない

### `design-docs-for-ai/issue148-adhd-focused-pomodoro-todo-v1-rebuild-implementation-plan.md`

旧計画の設計全体を作り直さない。Issue #154が参照する環境・CI・Preview記述だけを、`rebuild/v1` / `rebuild-v1`から`develop`、staging/E2E分離、Production migrationなしのモデルへ更新する。v1のプロダクト仕様・UI・DB設計は変更しない。

## 13. 実装後の自己点検

実装を引き継ぐAIは、コードを書く前に次を確認する。

- この計画に登場する新規ファイルはすべて「新規作成」と明記されている。
- 既存ファイルの関数名、Workflow名、secret名、DB環境名が現行コードと一致している。
- `functions/api/[[route]].ts`の既存`/api/health`を重複実装しない。
- `functions/api/test/auth.ts`をPreview用に公開する変更を入れない。
- `npm run db:migrate`の接続先が、Previewでは`PREVIEW_DATABASE_URL`、E2Eでは`E2E_DATABASE_URL`であることを確認する。
- PRのchecks/buildが`e2e-pr`、信頼済みpush/manualが`e2e`を使い、PRから`e2e`・`preview`・`production` Environmentへ到達できないbranch policyになっていることを確認する。
- Production WorkflowにProduction DB migrationを追加しない。
- production buildへPreview/E2EのTurnstile secretを混ぜない。
- E2E failure・skip・retry・concurrencyを、単なるtimeout追加で隠していない。
- `develop`へのdeployが`quality → migration → artifact deploy → health check`の順になっている。
- stable aliasへ進む前にcandidate healthを通し、stable health failure時の`preview-last-good`再公開とcandidate cleanupが`if: always()`を含む失敗経路でも実行されることを確認する。
- `git diff --check`、旧branch参照検索、secret実値検索、Playwright実画面確認を実行する。
