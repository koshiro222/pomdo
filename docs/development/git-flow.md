# Gitの開発フロー

Pomdoは、`develop`を開発内容の統合と共有Preview、`main`をProductionとして扱います。通常の変更は、`develop`から作った作業ブランチをPull Request（PR）で`develop`へ取り込みます。

## 1. developから作業ブランチを作る

作業を始める前に、`develop`を最新にしてから、Issue単位のブランチを作成します。

```sh
git switch develop
git pull --ff-only origin develop
git switch -c feature/issue-160-task-filter
```

ブランチ名には目的とIssue番号を含めます。例えば、機能追加は`feature/issue-160-task-filter`、不具合修正は`fix/issue-161-auth-error`、文書変更は`docs/git-flow-guide`です。

`main`や`develop`で直接作業したり、これらへ直接pushしたりしません。

## 2. 作業と品質確認を行う

作業ブランチで実装・テストを行い、PRを作成する前に変更に応じた品質確認を実行します。

```sh
npm run lint
npm run typecheck
npm test -- --run
npm run build
npm run test:e2e -- --project=chromium
```

例えば、UIの変更ではChromium E2Eまで実行し、DBスキーマを変更した場合は`npm run db:generate`とPGlite結合テストも実行します。実行したコマンドと結果はPR本文に記録します。

## 3. 作業ブランチからdevelopへPRを作る

作業ブランチをpushし、PRのbaseを`develop`にします。

```sh
git push -u origin feature/issue-160-task-filter
```

PR本文には、少なくとも次を記載します。

- 何を変更したか、なぜ必要か
- 実行したテスト・確認コマンド
- 未解決の運用作業や手動設定

PRのチェックとレビューが完了したら、PRを`develop`へマージします。機能ブランチから`main`へ直接マージすることは避けます。

## 4. developへのマージ後に共有Previewを確認する

`develop`へのマージを起点に、GitHub Actionsが品質チェックとProduction buildを実行し、同じArtifactを共有Previewへデプロイします。共有Previewは次で確認します。

- アプリ: <https://develop.pomdo.pages.dev>
- ヘルスチェック: <https://develop.pomdo.pages.dev/api/health>

例えば、ヘルスチェックが`status=ok`と`db=connected`を返すこと、変更した画面を実際に操作できることを確認します。Previewの詳細な仕組みは[Previewデプロイ手順](./preview-deploy.md)を参照してください。

## 5. developからmainへリリースPRを作る

共有Previewで変更を確認したら、`develop`をhead、`main`をbaseにしたリリースPRを作成します。レビューとチェックが完了したら`develop`を`main`へマージします。

```text
feature/*、fix/*、docs/* → develop → main
```

`main`へのマージ後はProductionデプロイの結果と本番ヘルスチェックを確認します。

## 緊急修正（hotfix）

Productionを先に直す必要がある場合だけ、`main`からhotfixブランチを作成して`main`へPRを作ります。`main`へマージした修正は、同じ変更が`develop`から失われないよう、続けて`main`から`develop`への同期PRを作成します。

## ブランチの後片付け

PRをマージした作業ブランチは削除します。現在はGitHubの自動削除設定が有効ではないため、必要に応じて次のコマンドを実行します。

```sh
git switch develop
git pull --ff-only origin develop
git branch -d feature/issue-160-task-filter
git push origin --delete feature/issue-160-task-filter
```

## GitHub側の保護設定について

現時点では`main`と`develop`のBranch protection / rulesetが未設定です。そのため、直接pushは技術的には可能ですが、この文書のフローでは直接pushを禁止し、必ずPRを使います。GitHub側でPR必須・チェック必須を設定した場合は、設定内容とこの文書を合わせて更新します。
