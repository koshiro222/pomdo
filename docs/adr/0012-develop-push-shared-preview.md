# develop push後に共有Previewへ自動デプロイする

`develop` を共有Previewの正規ブランチとし、GitHub Actionsで品質確認に成功したコミットだけをCloudflare Pagesへデプロイする。PreviewはNeonのStaging DBを使い、GitHub ActionsとローカルE2Eは別のE2E DBを使うことで、手動確認用のデータと自動テストのデータを分離する。productionは引き続き`main`とproduction DBの組み合わせとし、Previewの自動デプロイやE2Eからproductionへ接続しない。

## Status

accepted

## Considered Options

- 作業ブランチごとにPreviewを自動作成する: 初期段階では環境・DB・Secretsの管理対象が増え、共有Previewで確認したい目的に対して過剰なため採用しない。
- Cloudflare PagesのGit連携だけでデプロイする: lint、typecheck、Vitest、build、Chromium E2Eを通過したコードだけを公開する品質ゲートを構築しにくいため採用しない。
- PreviewとE2Eで同じNeon branchを使う: E2Eが作成するユーザー・Task・Focus Sessionが手動確認用のPreviewデータを汚染するため採用しない。

## Consequences

- `develop`へのpushごとに共有Previewが更新され、固定URLで手動確認できる。
- E2E専用Neon branchとSecretsが必要になる。共有branchを使うため、E2Eの同時実行は制御し、テストデータの衝突を避ける。
- Staging DBへのmigrationはPreviewデプロイの一部として扱うが、production DBへの自動migrationや破壊的migrationはこの決定の対象外とする。

## Implementation constraints

- PR、Preview、Productionのlint、typecheck、Vitest、coverage、build、Chromium E2EはReusable Workflowで共通化する。品質ゲートをWorkflowごとに複製すると、修正漏れで公開条件がずれるためである。
- buildはEnvironmentごとの公開値を注入して1回だけ実行し、同じcommitのArtifactをcandidateとstableへ公開する。Preview deploy jobで再buildしない。
- E2E checksは `e2e` または `e2e-pr` Environment、Preview migrationは `preview` Environment、Production deployは `production` Environmentから値を取得する。GitHub Actions secretとCloudflare Pages runtime secretは別管理とする。
- E2E checksは `pomdo-e2e-${{ github.repository }}` で直列化し、Preview Workflowは `develop` の最新pushを優先して古い実行をキャンセルする。Production Workflowは順序を保つためキャンセルしない。
- Previewはcandidateのhealthと本番モードの `/api/test/auth` 404を確認してから `develop` aliasを更新する。Preview deploymentにはProduction向けの公式rollback APIがないため、stable health failure時は `preview-last-good` bundleを再公開し、復旧できなければ手動復旧またはforward fixへ送る。
