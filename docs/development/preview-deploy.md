# Preview デプロイ手順

対象は、作業ブランチを Cloudflare Pages の Preview に公開する開発者です。初回は「準備」「デプロイ後の確認」まで読み、以降は「トラブルシュート」を必要に応じて参照してください。

## Preview は `rtk npm run deploy:preview` で公開する

`rebuild/v1` ブランチの固定 URL は次のとおりです。別のブランチでは、デプロイ時に表示されるURLを使います。

- アプリ: <https://rebuild-v1.pomdo.pages.dev/app>
- ヘルスチェック: <https://rebuild-v1.pomdo.pages.dev/api/health>

推奨コマンドは次の 1 つです。

```sh
rtk npm run deploy:preview
```

この入口で、`.env.local` または `.dev.vars` から `VITE_TURNSTILE_SITE_KEY` を読み込み、production build と Cloudflare Pages への deploy を続けて実行します。Site key が見つからない場合は deploy せずに停止するため、手動で build や deploy に置き換えないでください。

## 今回の障害の原因

`VITE_TURNSTILE_SITE_KEY` を注入せずに手動で build し、その `dist` を Cloudflare Pages へ deploy したためです。

Vite の `VITE_*` 変数は build 時にブラウザ用 bundle へ埋め込まれます。当時の build 設定では変数がなくても build 自体は成功したため、未設定のまま公開できてしまいました。その結果、Preview に Turnstile widget が正しく設定されず、サーバー側の書き込みゲートに弾かれて、タスク追加や保存時に次のメッセージが表示されました。現在は、Site key がない production build を停止する設定と `deploy:preview` を使います。

> 確認が完了していないため操作できません。ページを再読み込みして、もう一度お試しください。

`TURNSTILE_SECRET_KEY` はサーバーだけで使う秘密値です。`VITE_` を付けたり、ブラウザ bundle に入れたりしてはいけません。

## 環境変数の置き場所

`.env.local` と `.dev.vars` は用途が違います。両方を用意しても、片方の値が自動的にもう片方へ渡るわけではありません。

- `.env.local`: Vite が読むファイルです。Preview 用の production build に必要な `VITE_TURNSTILE_SITE_KEY` を置きます。
- `.dev.vars`: `wrangler pages dev` が読むローカル Functions 用のファイルです。`DATABASE_URL` や `TURNSTILE_SECRET_KEY` など、ローカル実行に必要な値を置きます。

`.env.local` の例:

```dotenv
# Git 管理外。実際の値はチームの環境設定から取得する
VITE_TURNSTILE_SITE_KEY=<Preview用のSite key>
```

手動の Vite build は `.dev.vars` を読みません。`deploy:preview` は例外として `.dev.vars` からこの公開キーだけを読み込み、buildの環境変数へ明示的に注入します。

ローカル起動の全体手順は [README.md の開発手順](../../README.md#開発) にまとめています。

## デプロイ前後の確認

デプロイ前に、対象ブランチと差分を確認します。

```sh
rtk git status --short --branch
rtk git diff --check
```

Preview へ公開する変更は、コミット済みの状態を基本とします。手動で `rtk npm run build` だけを実行したり、既存の `dist` を `rtk npx wrangler pages deploy` で再利用したりしないでください。どちらも、Site key のない古い bundle を再公開する原因になります。

デプロイ後は、まず API と画面を確認します。

```sh
rtk curl -fsS https://rebuild-v1.pomdo.pages.dev/api/health
```

`{"status":"ok","db":"connected"}` が返ることを確認し、次の操作を Preview の画面で行います。

- `/app` が表示され、初期データの読み込みに失敗していない
- タスクを追加し、画面に表示された後でページを再読み込みしても残っている
- タスクのタイトル・メモ・Estimate を変更して保存し、再読み込み後も変更が残っている
- 初回の書き込み時に Turnstile の確認が完了し、上記の拒否メッセージが表示されない
- ブラウザの Network で、追加・保存に対応する tRPC リクエストが成功している

## トラブルシュート

### 「確認が完了していないため操作できません」と表示される

まず `.env.local` のキー名が `VITE_TURNSTILE_SITE_KEY` と完全に一致しているか確認します。値を修正しただけでは公開済み bundle は変わらないため、必ず `rtk npm run deploy:preview` で build からやり直してください。ブラウザの再読み込みだけでは直りません。

### `Missing script: deploy:preview` と表示される

このリポジトリにデプロイスクリプトがまだ登録されていません。手動の build/deploy コマンドで代替せず、`deploy:preview` の追加を担当者へ依頼してください。今回と同じく、環境変数の注入漏れを見逃す可能性があります。

### ローカルでは動くが Preview だけ失敗する

ローカルの開発モードや E2E ではテスト用の Turnstile token が使われる場合があり、Preview の production build が正しい証拠にはなりません。Preview の bundle に Site key を注入してから再 deploy してください。

### `/api/health` が `db` の接続エラーになる

Turnstile ではなく、Cloudflare Pages Preview 側の `DATABASE_URL` などの環境設定を確認します。環境変数の全体方針は [Issue #148 の環境変数・運用・ロールバック](../../design-docs-for-ai/issue148-adhd-focused-pomodoro-todo-v1-rebuild-implementation-plan.md#12-環境変数運用ロールバック)、匿名作成の制限は [Cloudflare Rate Limiting の運用メモ](../operations/cloudflare-rate-limit.md) を参照してください。

## 秘密値をコミットしない

`.env.local` と `.dev.vars` は Git 管理外です。次のような実値を、ソースコード・Markdown・Issue・コミットへ貼り付けないでください。

```dotenv
# これは Pages secret / GitHub secret にだけ設定する
TURNSTILE_SECRET_KEY=<秘密値>
BETTER_AUTH_SECRET=<秘密値>
DATABASE_URL=<接続文字列>
```

`VITE_TURNSTILE_SITE_KEY` はブラウザへ埋め込む公開用 Site key ですが、環境ごとの差分を管理するため、リポジトリには値を書かず `<Preview用のSite key>` のようなプレースホルダーを使います。コミット前に次も実行し、意図しないファイルが含まれていないことを確認してください。

```sh
rtk git status --short
```

秘密値を誤って公開した場合は、Preview の再 deploy だけでは不十分です。直ちに該当する secret をローテーションし、管理者へ共有してください。

最終更新: 2026-09-10
