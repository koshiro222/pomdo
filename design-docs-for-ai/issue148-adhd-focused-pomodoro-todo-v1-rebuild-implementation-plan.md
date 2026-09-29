# Issue #148: ADHD 向け Pomdo v1 再構築 実装計画

## 0. メタ情報

- 対象 Issue: https://github.com/koshiro222/pomdo/issues/148
- Issue タイトル: `[refactor] Pomdo を ADHD 向け集中ツールとして v1 から作り直す`
- 対象範囲: Issue 全体。PR 分割の指定はなく、Issue のコメントもない
- 対象ブランチ: `rebuild/v1`
- 成果物: この単一の実装計画に従って、現行 v0 実装を v1 へ置き換える
- GSD: 使用しない。`/gsd-*`、`.planning` の新規フェーズ、GSD 用 SUMMARY は作成しない

この計画は、実装担当エージェントが別セッションから読んでも追加調査なしに着手できることを目的とする。Issue 本文の設計合意、`CONTEXT.md`、ADR、`docs/v1-mockup.html`、現行コード、一次情報の順に確認し、旧 `.planning/` の設計内容には依存しない。

## 1. 目的と設計判断

### 1.1 なぜ必要か

現行実装は、BGM・管理者・メール/パスワード認証・localStorage ゲストデータ・旧 `todos` / `pomodoro_sessions` スキーマ・3 カラムの Bento UI が混在している。Issue #148 は部分修正ではなく、ADHD の特性がある人を中心にした公開プロダクトとして、次のコア体験に絞った v1 への縮小リセットを求めている。

- 時間を外在化する: 円盤と絶対時刻で「あと何分」を見せる
- 次の一手を 1 つだけ指す: `Now` を 0 または 1 件にする
- できた分を責めずに振り返る: `Completed` と `Interrupted` を分ける

### 1.2 採用する判断と理由

| 判断 | 採用理由 |
|---|---|
| 既存 DB の段階移行ではなく、新 Neon ブランチに新 `0000` スキーマを適用する | Issue で本番移行データがないことが確認済みで、旧スキーマとの互換層を残すより v1 の不変条件を直接表現できる |
| 匿名ユーザーを最初から Better Auth の DB ユーザーとして作る | localStorage だけのゲストとログイン後データの二重管理、`MigrateDialog`、同一端末限定データをなくし、匿名状態でも同期可能にする |
| サーバー状態は TanStack Query、実行中の Focus Session は Zustand persist に分ける | DB に実行中行を作らず、再読み込み・同一端末複数タブ・ネットワーク断に対応できる |
| Focus Session の実績から集計を都度算出する | カウンタの二重管理を避け、`Completed` / `Interrupted` の集計差を一貫して保てる（ADR 0004） |
| tRPC の router → service → repository の 3 層にする | Edge 固有の DB 入出力と、テスト可能な純粋なドメイン判定を分離する |
| `/app` は静かな単一カラム、LP だけリッチにする | 集中画面の刺激とマーケティング画面の訴求を分離し、`docs/v1-mockup.html` の UI 契約に一致させる |
| 実装ブロックを依存順に進めるが、GSD の phase/wave は導入しない | 大規模な置換に必要な順序だけを維持し、今回の「GSD は使用しない」という方針を守る |

### 1.3 仕様の優先順位

矛盾が見つかった場合は、次の順で採用する。

1. Issue #148 本文
2. `CONTEXT.md`
3. `docs/adr/0001-stay-on-cloudflare-pages-edge.md` 〜 `docs/adr/0007-absolute-time-timer.md`
4. `docs/v1-mockup.html`
5. 現行コードと現行テスト
6. `ai-rules/` の更新後の内容

旧 `.planning/` は過去の前提を含むため、形式・履歴の確認以外の設計根拠にしない。

## 2. 完了条件

### 2.1 プロダクトの受け入れ条件

- `/` は LP、CTA から `/app` に遷移する。LP を見ただけでは匿名ユーザーを作らない
- `/app` 初回到達時に匿名ユーザーとセッションを作り、サンプル Task `Pomdo を5分だけ触ってみる` を `Today` かつ `Now` に 1 件だけ seed する
- 未ログインでも Task、Focus Session、振り返りを使える。データは匿名ユーザーとして DB に保存される
- Google OAuth のみを公開ログイン手段にする。メール/パスワード、Magic Link、認証メールは存在しない
- `Now` は `users.current_task_id` で 0/1 件を構造的に保証する
- `Today`、`On Deck`、`Backlog`、`Today's Done`、`Archive` は `planned_for` と `completed_at` から都度導出する
- Focus のプリセットは 15/25/45 分、既定は 25 分。Short Break は 5 分、Long Break は 15 分
- 実行中の Focus Session は `endsAt - now` で残時間を計算し、1 秒単位で描画する。pause、Web Worker、rAF による滑らかな連続描画、自動開始はない
- 実行中の操作は「ストップ」1 つだけ。60 秒未満の中断は `focus_sessions` に保存しない。60 秒以上は `completed_at = null` の Interrupted として保存する
- タブ復帰時に終了から 60 秒以内なら Completed として `duration_secs = planned_secs`、`completed_at = endsAt` で記録する。60 秒超過なら記録/破棄を選ばせる
- Completed の Focus Session だけが完了本数、Focused Days、Estimate 進捗に寄与する。Interrupted は合計集中時間だけに寄与する
- Work 完了後は Short Break を提案し、Completed Focus が 3 本に到達したら Long Break を提案する。どちらも強制・自動開始しない
- Long Break カウンタは Long Break 開始時とアプリ起動時だけリセットし、Short Break・スキップ・「もう 1 本」ではリセットしない
- 完了/中断 RPC がネットワーク断になった場合は payload を localStorage に 1 件だけ退避し、次回起動時に再送する
- 通知許可要求は最初の「▶ はじめる」クリックの開始直前に 1 回だけ行う。拒否・無視後は再要求せず、Web Audio のチャイムとタブタイトルにフォールバックする
- `On Deck` は常時表示し、Task 行タップで Now に昇格する。Backlog から Now にした場合は `planned_for = 今日` にする
- Task の削除は明示操作だけで行い、関連 Focus Session の `task_id` は `SET NULL` にする。完了 Task は削除せず日付導出で Archive 扱いにする
- 振り返り画面は `/app/review` に分離し、今日の合計集中時間、Completed 本数、完了 Task、直近 7 日の素の SVG 棒グラフ、Focused Days を表示する
- `/app/settings` でサウンド、テーマ、アカウント、JSON エクスポート、アカウント削除、表示専用タイムゾーンを操作できる
- 匿名アカウントと Google アカウントの結合は、Google 側にドメインデータがなければ匿名側の FK と設定を新ユーザーへ付け替え、既存データがあれば匿名側を破棄する
- `docs/v1-mockup.html` のトークン、単一カラム、円盤、詳細シート、LP コピー、reduced-motion/transparency の契約に準拠する
- CI は Reusable Workflowの品質ゲートで `install → lint → typecheck → Vitest → coverage → build → Chromium E2E` を実行し、同一commitのbuild Artifactだけをdeployする。途中失敗時にデプロイしない

### 2.2 非スコープ

BGM、R2、管理者 UI、分析ダッシュボード UI、プロジェクト、タグ、期限、サブタスク、パスワード/Magic Link、認証メール、週次メール、課金基盤、PWA、任意操作のオフライン捕捉、英語、月次/年次/全期間履歴、過集中の強制ブレーキ、午前 4 時始まり、タイマー自由設定、pause、Web Worker、ダウンロードフォント、旧 Bento/コックピット分割、複数デバイス同時セッションの整合保証は作らない。なお、focus 完了/中断だけを対象にした最小 1 件の送信待ち outbox は必須とする。

## 3. 現行コードとの差分

現行の `functions/lib/schema.ts` は `users.google_id`、`users.role`、`todos.completedPomodoros`、`todos.order`、`pomodoro_sessions.type` を持つ。目標は `tasks`、`focus_sessions`、`analytics_events` と Better Auth 標準テーブルを中心にしたスキーマである。

現行の `src/app/routers/` と `functions/api/todos.ts` / `functions/api/pomodoro.ts` は二重の REST/tRPC 実装を持つ。目標は `/api/health`、`/api/auth/*`、`/api/admin/purge-anonymous` 以外を tRPC に集約する。

現行の `src/core/store/todos.ts`、`src/lib/storage.ts`、`src/components/dialogs/MigrateDialog.tsx` は localStorage ゲストとログイン後 DB の移行を前提にしている。目標は匿名ユーザーを DB の正規ユーザーとして扱い、Task/Session の主データを localStorage に置かない。

現行の `src/core/store/timer.ts` と `src/hooks/useTimer.ts` は `remainingSecs` の減算、pause、自動遷移、自動開始、開始時 INSERT を行う。目標は絶対時刻、pause なし、完了/中断時のみ INSERT、ユーザー選択式の break 提案へ置き換える。

現行の `src/components/bgm/`、`src/hooks/useBgm.ts`、`src/app/routers/bgm.ts`、`functions/api/bgm.ts`、R2 binding は全削除する。現行の `src/components/stats/StatsCard.tsx` の Recharts 依存は削除し、レビュー画面の素の SVG に置き換える。

現行の `CLAUDE.md` は品質管理手順の見出しを持たず、`ai-rules/` は旧仕様（メール/パスワード、localStorage ゲスト、BGM、JWT）を説明している。実装中に v1 の `CLAUDE.md` と `ai-rules/` を書き直し、計画内の品質手順を正とする。

## 4. ドメインモデルと不変条件

### 4.1 Users / Better Auth

`users` は Better Auth の user テーブルを 1 ユーザー 1 行で使う。標準列は `id: text PK`、`name`、`email`、`email_verified`、`image`、`created_at`、`updated_at`。追加列は次のとおり。

- `is_anonymous: boolean not null`
- `timezone: text not null`。IANA 名、例 `Asia/Tokyo`
- `current_task_id: uuid nullable FK -> tasks.id ON DELETE SET NULL`
- `sound_muted: boolean not null default false`
- `sound_volume: real not null default 0.7`
- `theme: text not null default 'system'`。`system|light|dark`
- `last_seen_at: timestamptz not null`
- `turnstile_verified_at: timestamptz nullable`

`current_task_id` はユーザー行ごとに 1 列しかないため 0/1 件であり、Task の完了/削除時には必ず NULL にする。ユーザー削除は hard delete で、関連データは FK CASCADE に任せる。

### 4.2 Tasks

`tasks` の列は `id: uuid PK`、`user_id: text not null FK -> users.id ON DELETE CASCADE`、`title: text not null`、`note: text nullable`、`estimate: integer nullable`、`planned_for: date nullable`、`deck_order: text nullable`、`completed_at: timestamptz nullable`、`created_at`、`updated_at`。

- `estimate` は未設定または 1〜8
- `planned_for = 今日` が Today、NULL または昨日以前が Backlog
- `completed_at >= 今日 0:00(TZ)` が Today's Done、前日以前が Archive
- 完了 Task を物理移動しない。Archive は `completed_at` から導出する
- `deck_order` は Today の Task だけに設定する。Backlog の並びは `created_at DESC` で、手動並び替えをしない
- 起動時に `planned_for < today(TZ)` の自 Task を `planned_for = null, deck_order = null` に一括更新する。ただし `current_task_id` が指す Task は `planned_for = today` に戻す
- Estimate 進捗は Completed Focus Session 数 / Estimate。未設定は本数のみ、超過は `4 / 4 ✓` の後に `5` を淡色表示し、赤を使わない

### 4.3 Focus Sessions

`focus_sessions`（旧 `pomodoro_sessions`）は `id: uuid PK`、`user_id: text not null FK -> users.id ON DELETE CASCADE`、`task_id: uuid nullable FK -> tasks.id ON DELETE SET NULL`、`started_at: timestamptz not null`、`completed_at: timestamptz nullable`、`duration_secs: integer not null`、`planned_secs: integer not null`、`created_at` を持つ。

- `task_id = null` は Just Focus
- `completed_at != null` は Completed、`completed_at = null` は Interrupted
- Break は記録しない
- 実行開始では INSERT せず、完了/中断で 1 回だけ INSERT する
- 中断時 `duration_secs` は実測秒数、完了時は `planned_secs` とする
- `focus_sessions(user_id, task_id, completed_at)`、`focus_sessions(user_id, started_at)` に index を作る

### 4.4 Analytics Events

`analytics_events` は `user_id: text not null FK -> users.id ON DELETE CASCADE`、`event: text not null`、`created_at: timestamptz not null default now()` とし、`UNIQUE(user_id, event)` を付ける。イベント値は `app_opened`、`first_task_created`、`first_focus_completed`、`logged_in` の 4 つだけとする。insert conflict は無視し、アプリ内の分析 UI は作らない。

### 4.5 Focus の状態遷移

クライアント persist state は `startedAt`、`endsAt`、`taskId`、`plannedSecs`、`mode`（`focus|shortBreak|longBreak`）、`longBreakCount` のみを持ち、`isActive` は `endsAt` の有無などから導出する。

- アイドル時だけ 15/25/45 分を変更できる
- Focus 開始前に Task を選べる。Now が空なら `On Deck から 1 つ選ぶ` / `このまま集中する` の二択を円盤下に出す
- `remainingSecs = max(0, ceil((endsAt - now) / 1000))` とし、`setInterval(..., 1000)` で再描画する。表示処理は時刻差分から毎回再計算し、interval の回数を正しさの根拠にしない
- Work を Completed にしたときだけ `longBreakCount += 1`
- Long Break Count が 3 に到達したら Long Break を提案する。提案は `休憩する` / `もう 1 本` の明示選択で、後者ではカウンタを保持する
- Short Break 開始ではカウンタを保持し、Long Break を実際に開始した時だけ 0 にする
- Work の Stop は 60 秒未満なら破棄、60 秒以上なら Interrupted INSERT。Break の Stop/Skip は DB に書かない
- タブ復帰で `endsAt - now` が 0 以上または超過 60 秒以内なら Completed、超過 60 秒なら記録/破棄の確認を出す
- 同一デバイスの別タブには storage event で `endsAt` 等を同期する。別デバイス同時進行の整合は保証しない

## 5. 目標アーキテクチャとデータフロー

```text
React UI
  ├─ TanStack Query / tRPC client …… サーバー状態
  ├─ Zustand persist …… 実行中 Focus、Long Break Count、UI/テーマの一部
  └─ Web APIs …… localStorage outbox、Notification、AudioContext、IntersectionObserver
        ↓
functions/api/trpc/[[route]].ts
        ↓
src/server/routers/ …… 入力検証・認可・入出力の組み立て
        ↓
src/server/services/ …… DB 非依存のドメイン判定・ユースケース
        ↓
src/server/repositories/ …… Drizzle の Neon HTTP / PGlite 入出力
        ↓
Neon PostgreSQL（本番） / PGlite（結合テスト）
```

### 5.1 `/app` 初回起動

1. React Router が `/app` のブートストラップを実行する。
2. セッションがなければ `authClient.signIn.anonymous()` を呼び、Better Auth の anonymous plugin で匿名ユーザーを作る。
3. `bootstrap.initialize` が `last_seen_at` の更新、日付スイープ、`app_opened` の記録、初回だけサンプル Task の seed を行う。seed は Turnstile の書き込みゲートを通さないサーバー内部処理とする。
4. Task、Now、On Deck、Backlog、Today's Done を tRPC query で取得し、表示する。

### 5.2 Focus 開始から完了まで

1. 最初の開始クリックで一度だけ Notification 許可を要求し、Turnstile token を用意する。
2. `focus.start` は DB 行を作らず、Turnstile を検証し、初回なら分析イベントを記録し、サーバー時刻 `now` を返す。
3. クライアントは `endsAt = serverNow + plannedSecs * 1000` を Zustand に保存して描画する。
4. 完了時は `focus.complete`、Stop 時は条件に応じて `focus.interrupt` を呼ぶ。通信失敗時は同じ payload を outbox に保存する。
5. Completed 後に `休憩する` / `もう 1 本`、または Long Break 提案の選択を待つ。Break は開始時のみクライアント状態を変更する。

### 5.3 匿名から Google への結合

1. ログインボタン近くに常時、既存 Google データがある場合はこの端末のデータを引き継がない旨を表示する。
2. リダイレクト前にクライアントが匿名ユーザーの Task ID と Focus Session ID のスナップショットを sessionStorage に保存する。これにより、結合後に匿名 ID が残ったかを判定できる。
3. Better Auth の `anonymous({ onLinkAccount: async ({ anonymousUser, newUser, ctx }) => ... })` から `linkAnonymousAccountData` を呼ぶ。**installed の `better-auth@1.5.4` では `anonymousUser` と `newUser` はどちらも `{ user, session }` の形**（`node_modules/better-auth/dist/plugins/anonymous/types.d.mts` の `AnonymousOptions.onLinkAccount` で確認）。ID は `anonymousUser.user.id` / `newUser.user.id` で参照する。`newUser.user.id` を `newUser.id` と書かない。
4. `newUser.user.id` に紐づく Task/Focus Session が一つもなければ、匿名ユーザーの `tasks.user_id`、`focus_sessions.user_id`、`analytics_events.user_id`、`users.current_task_id` を `newUser.user.id` へ付け替え、`timezone`、`sound_muted`、`sound_volume`、`theme` をコピーする。処理は 1 トランザクションで行う。
5. `newUser.user.id` に既存ドメインデータがあれば付け替えない。**どちらの分岐でも、`onLinkAccount` 完了後に Better Auth が既定で匿名ユーザー行を削除する**（`disableDeleteAnonymousUser` は設定しない）。付け替え済みの分岐では削除時点で匿名行に FK が残らないため安全に消える。付け替えなかった分岐では匿名側のドメイン行も CASCADE で消える。
6. 結合後にスナップショット ID が新ユーザーの一覧に存在しない場合、控えめな toast で破棄を通知する。`account-link-service` は `migrated | discarded` を返し、クライアントはこの戻り値でも toast 要否を判定できる（スナップショット照合は冗長な二重確認）。

## 6. 実装ブロック

各ブロックは実装・テスト・完了条件を満たしてから次へ進む。これは依存順を示す通常の作業単位であり、GSD の phase/wave ではない。

### ブロック 0: v1 の作業境界を確定する

- 意図: 旧 v0 の仕様を残したまま部分修正して設計が混在することを防ぐ
- 変更: `.gitignore` から `CLAUDE.md` と `ai-rules/` の除外を外す。`design-concept.html` 等の無関係な未追跡成果物を持ち込まない。`rebuild/v1` 以外へ向ける PR や main への直接コミットはしない
- 完了条件: 実装担当者が `.planning` の新規 GSD ファイルを作らず、この計画を唯一の実装順序として読める

### ブロック 1: 依存関係とランタイム設定を v1 に合わせる

- 意図: Edge で動かない依存・不要な BGM/R2・旧 shadcn 足場を先に除去し、後続の型エラーを明確にする
- `package.json` / `package-lock.json`: `react-router`（v7 系。v7 は `react-router` 単一 package で `createBrowserRouter` を export。`react-router-dom` は入れない）、`fractional-indexing`、`@sentry/react`、`@sentry/cloudflare`、`@marsidev/react-turnstile`、`@electric-sql/pglite`、`zod` を追加する。`@electric-sql/pglite` は devDependencies、それ以外は用途に応じて dependencies にする。現行の `radix-ui@1.4.3`、`@dnd-kit/core@6.3.1`、`@dnd-kit/sortable@10.0.0`、`@dnd-kit/utilities@3.2.2`、`superjson@2.2.6` は既に導入済みなので重複追加しない。`recharts`（現行 `3.8.0`）、`shadcn`（現行 devDep `3.8.5`）、`tw-animate-css`（現行 devDep `1.4.0`）を削除する。`drizzle-kit`（現行は `dependencies` に `0.31.9` で入っている。バージョンは維持し `devDependencies` へ移すだけ）を devDependencies に置く。`class-variance-authority` / `clsx` / `tailwind-merge` は shadcn 由来だが `src/lib/utils.ts` の `cn()` が依存する。v1 で `cn()` を残すなら 3 つとも残す。`cn()` を使わない方針なら `src/lib/utils.ts` ごと削除し 3 つも削除する（どちらでもよいが中途半端に一部だけ消さない）
- `package.json` scripts: `typecheck` を新規追加（`tsc -b`）。既存 `build` の `tsc -b` と同じ project 参照を使うため、後述の `tsconfig.functions.json` を `tsconfig.json` の `references` に追加する。`test:e2e` は既存（`playwright test`）
- **`tsconfig.functions.json`（新規）**: 現状 `functions/` はどの tsconfig の `include` にも入っておらず `tsc -b` で型検査されていない。`functions/**/*` と（型のみ参照する）`src/server/**/*` を対象にし、Edge 向けに `lib: ["ES2023"]`、`types: []`（DOM を入れない）、`moduleResolution: "bundler"` とする。`tsconfig.json` の `references` に追加し、`tsconfig.app.json` の `include` は `src` のまま（`src/server` はクライアント bundle からは型のみ import される）
- `wrangler.toml`: `BGM_BUCKET` と `[[r2_buckets]]` を削除し、`nodejs_compat` と `pages_build_output_dir = "dist"` を維持する。`compatibility_date` は実装時点の最新値へ更新する（現行 `2025-01-01`）
- `vite.config.ts`: React Router の SPA fallback と `/api` proxy の開発設定を v1 の入口に合わせる。dev は vite `5173` から `/api` を wrangler `8788` へ proxy する構成を維持し、E2E / 手動確認の baseURL は `5173` に統一する
- `index.html`: v1 の title、viewport、theme-color（light/dark 出し分け）、初回ペイント前の theme localStorage 読み込みを整える。manifest は置かない
- `public/_redirects`（新規）: `/* /index.html 200` を 1 行定義する。Vite が `public/` を `dist/` にコピーするため Pages が SPA fallback を認識する
- `components.json`、`src/components/ui/checkbox.tsx`、旧 Tailwind/shadcn の import を削除する
- 完了条件: `npm ci`、`npm run typecheck`（`functions/` と `src/` の両方を検査）、`npm run build` が依存解決エラーなく実行でき、Edge 用 Functions に Node API を持ち込まない

### ブロック 2: DB スキーマ、repository、tRPC Context を作り直す

- 意図: v1 の不変条件を DB と型で固定し、`any` と旧テーブル名を消す
- `src/server/db/schema.ts`（新規）: §4 の `users`、`sessions`、`accounts`、`verifications`、`tasks`、`focusSessions`、`analyticsEvents` と `relations()`、index、FK を定義する。users と tasks の循環 FK は Drizzle の `AnyPgColumn` 等で遅延参照する
  - **ID 型の統一**: 現行 `functions/lib/schema.ts` は `users.id` / `sessions.user_id` / `accounts.user_id` が `uuid` で、`functions/lib/auth.ts` が `advanced.database.generateId: () => crypto.randomUUID()` でそれに合わせている。v1 は Better Auth 既定の `text` ID に統一し、`users.id` / `sessions.userId` / `accounts.userId` / `verifications` 系を `text` にする。`tasks.id` / `focus_sessions.id` はアプリ生成の `uuid`（`defaultRandom()`）のままでよい（`tasks.user_id` / `focus_sessions.user_id` は `text`、`users.current_task_id` は `uuid`）
  - `drizzleAdapter` のテーブル名マッピングは現行同様 `{ user: users, session: sessions, account: accounts, verification: verifications }` を維持する（DB 上は複数形、Better Auth 内部は単数形）
  - **循環 FK の migration 生成順**: `users.current_task_id -> tasks.id` と `tasks.user_id -> users.id` の相互参照は、`drizzle-kit generate` が `CREATE TABLE` 群のあとに `ALTER TABLE ... ADD CONSTRAINT` を分離出力するか確認する。分離されない場合は生成 SQL を手で並べ替える。PGlite 適用時も同じ順序で流す
- `src/server/db/client.ts`（新規）: `drizzle-orm/neon-http` と `@neondatabase/serverless` で `createDb(databaseUrl)` を実装し、戻り値から具体的な `Db` 型を export する。テスト用に `drizzle-orm/pglite` で同じ `schema` を渡す `createTestDb(pgliteClient)` も用意し、repository は `Db` 型（両者の共通部分）を受け取る
- `src/server/repositories/user-repository.ts`（新規）: ユーザー設定、`last_seen_at` のデバウンス、匿名/Google 結合用の存在確認を実装する
- `src/server/repositories/task-repository.ts`（新規）: ユーザー単位の Task list/create/update/delete、Now、スイープ、並び順を実装する。外から `user_id` 条件を省略できない API にする
- `src/server/repositories/focus-session-repository.ts`（新規）: 完了/中断の insert と、TZ を含む日次集計 query を実装する。開始時の insert は提供しない
- `src/server/repositories/analytics-event-repository.ts`（新規）: `on conflict do nothing` の insert を実装する
- `drizzle.config.ts`: schema の新パス、PostgreSQL dialect、新 Neon branch を参照する設定へ変更する。既存 `.dev.vars` の読み込みを行う場合でも、Functions の Edge bundle からは分離する
- `drizzle/0000_v1_initial.sql`（新規）と `drizzle/meta/*`: 旧 `0000`〜`0007` と旧 meta を置き換え、v1 全テーブルを新 Neon branch に適用する。旧 DB の既存データを読み替える migration は作らない
- 完了条件: `npm run db:generate` で差分がなく、PGlite で同じ schema を起動できる。Task を削除すると Focus Session の `task_id` だけ NULL になり、他の実績は残る

### ブロック 3: Better Auth の縮小リセットと匿名ブートストラップ

- 意図: login UI とデータ保存先を v1 の匿名＋Google に一本化する
- `src/server/auth.ts`（新規。現行 `functions/lib/auth.ts` を置換）: `betterAuth`、`drizzleAdapter`、`anonymous`、Google `socialProviders`、`user.additionalFields`（`timezone` / `soundMuted` / `soundVolume` / `theme` / `lastSeenAt` / `turnstileVerifiedAt`。`current_task_id` は循環 FK なので additionalFields ではなく schema 側で持ち、Better Auth からは触らない）を設定する。`emailAndPassword`、`admin()`、`emailVerification`、password reset / verification mail の `console.log` stub、`users.role`/`banned` は持たない。**現行の `advanced.database.generateId` は削除する**（ID を `text` に統一したので Better Auth 既定の生成に任せる）。`session.expiresIn = 60*60*24*90`、`session.updateAge = 60*60*24`、本番 `trustedOrigins = ["https://pomdo.pages.dev"]` とする。ローカルは `E2E_TEST_MODE` / dev フラグ時のみ `http://localhost:5173` 等を追加する
- `src/server/services/account-link-service.ts`（新規）: 新ユーザーに Task/Focus があるかを確認し、空なら全 FK と設定を移す。既存データがあれば何も移さず、結果を `migrated|discarded` として返す。ユーザー ID の型は Better Auth の text ID に統一する
- `functions/api/auth.ts`: 互換 `/google`、`/logout`、メール/パスワード前提の処理を削除し、Better Auth handler を `/api/auth/*` に委譲する。Google の callback URL は `https://pomdo.pages.dev/api/auth/callback/google` を正とする
- `functions/middleware/auth.ts`: 旧 JWT/role 前提を削除し、Better Auth session から `SessionUser` を抽出する共通処理へ置き換えるか、不要なら削除する
- **`last_seen_at` のデバウンス更新は tRPC Context 生成時に行う**（REST の `/api/health` では更新しない）。`now() - last_seen_at >= 1時間` のときだけ `user-repository` 経由で UPDATE する。Better Auth の `databaseHooks.session.create` ではセッション作成時しか走らないのでここでは使わない
- `src/lib/auth.ts`: `authClient` から `adminClient` を削除し、anonymous、social sign-in、session、sign-out だけを使用する
- `src/hooks/useAuth.ts`（既存を置換）: `session.user` を v1 の text ID/匿名状態/設定へマッピングする。role 判定とメールフォームの戻り値を削除する
- `src/server/services/bootstrap-service.ts`（新規）: `initializeBootstrap` を idempotent にし、匿名作成後に seed、スイープ、`app_opened` 記録、Long Break Count のリセット指示（クライアントに返す）を実行する。seed Task は通常の Task と同じ CRUD で扱い、特別フラグを持たない。**seed による Task 作成では `first_task_created` イベントを記録しない**（このイベントはユーザーの手動作成が初めて成功した時に記録する）。idempotent の判定は「その user に既に Task が 1 件以上ある」または専用の `analytics_events` = `app_opened` の有無で行う
- `src/server/routers/auth.ts`（新規）: `auth.me` を提供する
- `src/server/routers/bootstrap.ts`（新規）: `bootstrap.initialize` と初期表示に必要な query を提供する
- 完了条件: 初回 `/app` 到達で匿名 DB user と sample Task が 1 回だけ作られ、再読み込みで重複しない。Google 連携時に移行/破棄が決定的に再現できる

### ブロック 4: Turnstile、レート制限、管理 API

- 意図: 匿名公開アプリの書き込み悪用を防ぎ、初回書き込みだけを過剰に妨げない
- `src/server/integrations/turnstile.ts`（新規）: Cloudflare Siteverify endpoint を Web Fetch で呼び、secret、token、remote IP を検証する。成功時のみ `users.turnstile_verified_at` を更新する
- `src/server/context.ts`（新規）: `initTRPC.context<Context>().create({ transformer: superjson })` を使い、auth context、typed `db`、schema、Cloudflare env を構成する。`protectedProcedure`（session 必須）と `turnstileProcedure`（`protectedProcedure` + `users.turnstile_verified_at` が null なら input の `turnstileToken` を Siteverify で検証し成功時に `turnstile_verified_at` をセット、既にセット済みなら token 不要で通す）は `TRPCError` を返し、`any` を使わない。`turnstileProcedure` を使うのは書き込み系のみ（`focus.start`、`focus.complete`、`focus.interrupt`、`tasks.create` など。read-only query には付けない）
- **Turnstile widget の配置**: seed された sample Task が `Now` に入っているため、初回ユーザーの最初の書き込みが `tasks.create` ではなく `focus.start` になり得る。したがって widget は `/app` レイアウト直下に 1 つだけ mount する（Task add form 内に閉じ込めない）。`@marsidev/react-turnstile` の `<Turnstile siteKey={...} options={{ appearance: "interaction-only" }} onSuccess={...} onError={...} onExpire={...} />` を使い、managed モードで challenge が不要なら不可視のまま `onSuccess` で token を得る。`execution: "execute"` は使わない（明示 `ref.execute()` 運用が必要になり、初回書き込みが `focus.start` の場合に取り回しづらい）
- token は Zustand か React context の共通状態に保持し、`turnstile_verified_at` が未セットの間だけ初回書き込み mutation の input に載せる。token は単回使用・約 300 秒 TTL なので、`onExpire` で破棄し widget に再取得させる。サーバーは毎回 Siteverify で再検証する（クライアントの「検証済み」表示を信頼しない）
- **dev / E2E**: Cloudflare 公式のテスト用キー（sitekey `1x00000000000000000000AA`（常に pass・不可視）、secret `1x0000000000000000000000000000000AA`（常に pass））を `E2E_TEST_MODE` / dev で使う。本番キーは Pages secret から渡す
- `functions/api/[[route]].ts`: `/api/health`、`/api/auth/*`、`/api/admin/purge-anonymous` だけを Hono REST として残す。`/api/hello`、`/api/todos`、`/api/pomodoro`、`/api/bgm` を削除する
- `functions/api/trpc/[[route]].ts`: Better Auth session、typed DB、schema を context に渡す。BGM bucket は渡さない
- `functions/api/admin/purge-anonymous.ts`（新規）: `ADMIN_CRON_SECRET` の Bearer/secret を検証し、`is_anonymous = true AND last_seen_at < now() - 90d` を hard delete する。UI からは呼ばない
- Cloudflare 設定: 匿名作成 `/api/auth/*` に IP あたり 1 時間 5 回の Rate Limiting rule を設定する。これはコード内の代替ロジックで済ませない
- 完了条件: token なしの初回 mutation は拒否、検証済み user の通常 mutation は通過、管理 endpoint は secret なしで 401 になる。Turnstile の secret をクライアント bundle に含めない

### ブロック 5: Focus Session の純粋なドメインと実績 API

- 意図: timer の時間計算・中断境界・cycle を UI や DB adapter から分離してテストする
- `src/server/services/focus-session-service.ts`（新規）: DB 非依存の `calculateRemainingSecs`、`classifyStop`、`classifyTabReturn`、`advanceFocusCycle`、`shouldSuggestLongBreak`、`incrementLongBreakCount` を実装する。新しい命名は「何を判定/算出するか」が名前だけで読めるものにする
- `src/server/routers/focus.ts`（新規）: `focus.start`（`turnstileProcedure`。行を作らず server now を返す）、`focus.complete`、`focus.interrupt`（いずれも `turnstileProcedure`）、outbox 再送用 mutation を実装する。payload は user ID と planned/duration の整合を検証し、user 所有の Task だけを紐付ける。成功/重複再送を冪等にするため **client-generated session ID（UUID）を必須 input にし、`focus_sessions.id` に直接使う**。同じ ID の再 insert は `on conflict do nothing` で吸収する
- **E2E での server now 制御**: `focus.start` が返す `now` はサーバー（wrangler）の実時刻で、`page.clock` はブラウザ側しか止めない。両者がずれると `page.clock.fastForward` で `endsAt` を跨げない。対策として、`E2E_TEST_MODE=true` のときだけ `focus.start` が任意 header（例 `x-e2e-now`、ISO8601）を受け取り、その値を `now` として返す。本番では header を無視する。E2E は `page.clock.install({ time })` と同じ固定時刻を header で渡し、`endsAt` 計算をブラウザとサーバーで一致させる
- `src/core/store/focus-runtime.ts`（新規）: `persist` で `startedAt`、`endsAt`、`taskId`、`plannedSecs`、`mode`、`longBreakCount` を保存し、storage event で同一端末タブへ反映する。isActive/remaining は必要に応じて selector で導出する。**アプリ起動（`/app` ブートストラップ）時に `longBreakCount` を 0 にリセットする**（§4.5。日跨ぎで自然にリセットされることを保証する）。実行中セッションが persist に残っていて `endsAt` を過ぎている場合は、起動時に `classifyTabReturn` で Completed / 確認 / 破棄を判定してから状態を掃除する
- `src/core/domain/focus-session.ts`（新規）: クライアントが使う純粋な残時間/扇形/遷移判定を server service と同じテストケースで共有する。サーバー専用依存を import しない
- `src/lib/focus-outbox.ts`（新規）: Completed/Interrupted payload を localStorage に最大 1 件保存し、起動時に送信、成功時に削除する。同じ session ID を二重 insert しない
- `src/lib/notifications.ts`（新規）: 開始直前の一度だけの `Notification.requestPermission()`、拒否後の抑止、完了時の tab title を管理する
- `src/lib/sound.ts`（新規）: `AudioContext` の oscillator と gain envelope で 1〜2 種のチャイムを合成する。音量は user 設定、ミュート時は無音。外部 URL・同梱音源は使わない
- 完了条件: fake clock で終了、60 秒境界、復帰猶予、Long Break 3 本、再送を再現できる。実行中 UI に pause/reset/preset の操作を表示しない

### ブロック 6: Task の導出、Now、並び替え

- 意図: Task の表示分類とユーザーの次の一手をサーバー/クライアントで同じ規則にする
- `src/server/services/task-service.ts`（新規）: `deriveTaskBuckets`、`sweepOverdueTasks`、`calculateEstimateProgress`、`promoteTaskToNow`、`clearCurrentTask`、`buildDeckOrder` を DB 非依存の関数として実装する。日付引数と IANA timezone を必須にし、システム timezone を暗黙に使わない
- `src/server/repositories/task-repository.ts`: list は Today/Backlog/Today's Done を返すための query とし、Now を user row と結合する。作成既定は On Deck（今日）または Backlog form から明示する
- `src/server/routers/tasks.ts`（新規）: `tasks.list`、`tasks.create`、`tasks.update`、`tasks.complete`、`tasks.delete`、`tasks.moveToNow`、`tasks.reorder` を実装する。mutation の user 条件を全 query に付ける。complete/delete で `current_task_id` を NULL にし、delete は explicit action だけで行う
- `fractional-indexing` の `generateKeyBetween(previousKey, nextKey)` を使い、D&D と「上へ/下へ」の両方で隣接キーを生成する。キー枯渇時は周辺範囲を `generateNKeysBetween` で再配分し、全体を整数 order に戻さない
- `@dnd-kit/core` の `DndContext`、`@dnd-kit/sortable` の `SortableContext`/`useSortable` を On Deck にだけ使う。Backlog に drag handle を出さない
- 完了条件: Today 外に deck_order が残らず、Backlog→Now が planned_for を今日に昇格させ、Now の完了/削除後に On Deck 先頭の昇格を提案する。Estimate 未設定/超過も仕様どおり表示する

### ブロック 7: Review 集計

- 意図: Completed/Interrupted の意味を壊さず、ユーザーの達成を赤字や streak で評価しない
- `src/server/services/review-service.ts`（新規）: `summarizeToday`、`summarizeRecentSevenDays`、`countFocusedDays` を純粋な整形/集計関数として実装する
- `src/server/repositories/focus-session-repository.ts`: 日次 SQL は `(started_at AT TIME ZONE users.timezone)::date` を使い、user timezone で grouping する。今日の合計は Completed + Interrupted、Completed 数/Focused Days/Estimate は Completed のみとする
- `src/server/routers/review.ts`（新規）: `review.summary` を返す。過去の月次・年次・全期間を追加しない
- `src/components/review/ReviewPage.tsx`（新規）: `/app/review` を実装し、7 本の素の SVG bar とスクリーンリーダー用テキストを表示する。`recharts` は使わない
- 完了条件: 東京時間の 23:59/00:00、DST がある timezone、Interrupted のみの日、Focused Days の累積を unit/PGlite で確認できる

### ブロック 8: デザイントークン、Router、画面骨格

- 意図: v1 の UI 契約を DOM と CSS に落とし、旧装飾と旧ナビゲーションを除去する
- `src/app/router.tsx`（新規）: React Router v7 の `createBrowserRouter` と `RouterProvider` で `/`、`/app`、`/app/review`、`/app/settings`、`/about`、`/legal/terms`、`/legal/privacy` を定義する。SSR、file-based route、`/app` の認証ガードは使わず、bootstrap で匿名作成する
- `src/main.tsx`: `RouterProvider` と tRPC/TanStack Query provider の順序を整理し、全画面の ErrorBoundary を配置する
- `src/App.tsx`: 旧 `window.location.pathname` 分岐と Bento 構成を削除し、router の入口へ置き換える
- `src/index.css`、`src/App.css`: `--df-*`、`--cf-*`、`--gh-*`、oklch の shadcn bridge、glassmorphism、背景画像、点滅/脈動/回転、旧 bento-card を削除する。**`docs/v1-mockup.html` の `<style>` にある `:root` トークンをそのまま移植する**。現行モックのトークン名（実装時に mockup 側を正として再確認する）:
  - 色: `--color-bg`、`--color-surface`、`--color-surface-raised`、`--color-chrome`、`--color-text`、`--color-text-muted`、`--color-text-faint`、`--color-border`、`--color-hairline`、`--color-accent`、`--color-accent-weak`、`--color-accent-line`、`--color-accent-break`、`--color-accent-break-weak`、`--color-danger`、`--color-focus-ring`、`--halo`
  - タイポ/形状/モーション: `--font`、`--fs-hero`/`--fs-h`/`--fs-now-title`/`--fs-timer`/`--fs-body`/`--fs-label`/`--fs-meta`、`--lh-*`、`--ls-*`、`--maxw`、`--r-card`/`--r-row`/`--r-pill`、`--shadow-card`/`--shadow-sheet`、`--dur`/`--dur-fast`、`--ease-out`/`--ease-spring`
  - dark はモックと同じく `@media (prefers-color-scheme: dark)` 内の `:root:not([data-theme="light"])` と `:root[data-theme="dark"]` の両方で上書きする。`prefers-reduced-motion` / `prefers-reduced-transparency` / `prefers-contrast` の分岐もモックの記述に合わせる。トークンを勝手に増減・改名しない
- `src/messages.ts`（新規）: 日本語の UI 文字列をネストした型付き object に集約し、コンポーネントに日本語文字列を散在させない。i18n runtime は追加しない
- `src/lib/theme.ts`（新規）: server の `users.theme` を正とし、初回ペイント用に localStorage mirror を更新する。system は `data-theme` 属性を外し、light/dark は `<html>` に属性を付ける
- `src/components/layout/AppHeader.tsx`（新規）: `/app` は左 Pomdo、右 settings icon のみ、タブナビは置かない。設定・レビュー画面は戻るリンクを持つ
- `src/components/app/AppPage.tsx`（新規）: Now → timer → On Deck → Backlog → Today's Done → review link の縦順、最大幅 528px の単一カラムを構成する
- `src/components/landing/LandingPage.tsx`（新規）: LP の確定コピーを使い、halo、3 本柱、スライダー式円盤デモ、IntersectionObserver reveal を実装する。reduced-motion では即時表示にする
- `src/components/legal/LegalPage.tsx`（新規）: 日本語ドラフトを静的表示し、人間の法務レビューをローンチブロッカーとして明記する
- 完了条件: `/` と `/app` が再読み込み後も直接開き、`_redirects` で SPA が復元される。light/dark/system、キーボード focus、reduced-motion で UI が崩れない

### ブロック 9: Now / Timer / Task UI

- 意図: コア体験を最小操作で成立させ、実行中の選択肢を増やさない
- `src/components/app/NowCard.tsx`（新規）: Now のタイトル/メモ/Estimate 進捗を最大表示し、編集・完了・削除を提供する。Now が空なら空状態と Just Focus 導線を表示する
- `src/components/timer/TimerDisc.tsx`（新規）: SVG の塗りつぶし扇形、中央 mm:ss、`role="timer"`、毎分更新の `aria-live="polite"` を実装する。25:00→0:00 で面積が減る。rAF で滑らかに回さない
- `src/components/timer/TimerControls.tsx`（既存を置換）: idle は preset/開始、running は「ストップ」のみ、break は「スキップ」のみとする。pause、reset、自動 start を表示しない
- `src/components/tasks/TaskAddForm.tsx`（新規）: On Deck と Backlog の同型 form。最初の form 内に Turnstile を mount し、送信 token を mutation に渡す
- `src/components/tasks/TaskRow.tsx`（新規）: check、title、meta、Now 昇格、D&D handle、menu を分離し、button/link の accessible name を明示する
- `src/components/tasks/TaskList.tsx`（新規）: On Deck は常時表示、Backlog/Todays Done は disclosure 既定閉。完了 Task は完了日だけで分類する
- `src/components/tasks/TaskDetailsSheet.tsx`（新規）: Radix Dialog を基盤にタイトル/メモ/Estimate stepper をまとめる。下から spring、handle 下ドラッグ、Escape/scrim close、reduced-motion は cross-fade、focus trap を提供する
- 完了条件: 新規 Task を作成、Task を Now にし、15/25/45 を idle 時に切り替え、開始→ストップ→完了/中断をユーザー操作だけで確認できる。Now が空の開始では二択が出る

### ブロック 10: 設定、エクスポート、アカウント削除、通知

- 意図: ユーザーがデータ・刺激・アカウントを自分で制御できるようにする
- `src/server/repositories/settings-repository.ts`（新規）と `src/server/routers/settings.ts`（新規）: `sound_muted`、`sound_volume`、`theme` を update する。timezone は自動検出値を保存し、v1 UI では変更不可
- `src/server/services/export-service.ts`（新規）と `src/server/routers/account.ts`（新規）: `{ exportedAt, user: { settings }, tasks: [...], focusSessions: [...] }` を返し、`analytics_events` を除外する。ファイル名は `pomdo-export-YYYYMMDD.json`
- `account.delete`: 確認 1 回で hard delete → sign out → `/`。削除確認にだけ `--color-danger` を使い、進捗/達成度には赤を使わない
- `src/components/settings/SettingsPage.tsx`（新規）: Sound、Theme、Account、Data、Timezone の順で mockup を再現する。匿名時は Google ボタンと警告を常時表示し、結合後破棄は toast で通知する
- `src/components/ui/Toast.tsx`（新規）: v1 の軽い toast を実装する。外部 toast ライブラリは追加せず、必要なら existing `src/core/store/ui.ts` を `toast` 目的に限定して置き換える
- `src/components/auth/GoogleLoginButton.tsx`（新規）: `authClient.signIn.social({ provider: "google", callbackURL: "/app" })` を呼ぶ。メールフォーム、`LoginDialog`、admin UI を残さない
- 完了条件: 設定を更新して再読み込み後も反映され、JSON に analytics が含まれず、削除後は LP に戻り DB の関連行が CASCADE で消える。通知要求は 2 回目に発生しない

### ブロック 11: 分析、Sentry、テスト専用認証、CI

- 意図: v1 の運用性と主要フローを本番前に再現可能にする
- `src/server/services/analytics-service.ts`（新規）: 4 イベントの insert を各初回地点に埋め込む。UI は作らない
- `src/server/test-auth.ts`（新規）: `E2E_TEST_MODE=true` の時だけ、Google UI を経由せず Better Auth 互換のテスト session を作る。テスト専用 endpoint は本番 bundle/route に登録しない。link の E2E は実際の `account-link-service` を通す
- `functions/api/test/auth.ts`（新規、E2E 専用）: `/api/test/auth` を `E2E_TEST_MODE` 条件下だけ登録し、固定 test input を検証して HttpOnly session cookie を返す。production env で route が 404 になるテストも入れる
- **E2E の env 供給**: `npm run dev` は vite + `wrangler pages dev` を起動する。wranglerは `.dev.vars` からenvを読むため、CIでは `e2e` または `e2e-pr` Environmentの値から `.dev.vars` を生成するstepを入れる（`E2E_DATABASE_URL`を `DATABASE_URL` として使い、`E2E_TEST_MODE=true`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL=http://localhost:5173`、`TURNSTILE_SITE_KEY`、`TURNSTILE_SECRET_KEY`、`SENTRY_DSN`は空）。`playwright.config.ts` の `webServer.command` は `npm run dev` のままでよいが、`webServer.env` か生成した `.dev.vars` で上記を渡す。`playwright.config.ts` の `firefox` / `webkit` project は残してもよいがCIは `--project=chromium` のみ実行する
- **vitest の環境分離**: `vitest.config.ts` は `environment: 'jsdom'` を全体既定にしている。`tests/integration/**` の PGlite テストは Node 環境が必要なので、各ファイル冒頭に `// @vitest-environment node` を付けるか、`test.projects`（vitest v4）で `tests/integration/**` を `environment: 'node'` の別 project にする。`vitest.config.ts` の `exclude` は現状 `tests/e2e/**` のみ。`tests/integration/**` は除外しない
- `src/lib/sentry.ts`（新規）: `@sentry/react` の `Sentry.init({ dsn, sendDefaultPii: false, tracesSampleRate: 0.1 })` と `ErrorBoundary` を設定する。DSN 未設定の local/test は無効化する
- `functions/entry.ts`（新規）または Functions entry: `@sentry/cloudflare` の `withSentry` で Pages handler を包む。Edge で Node API を使わない
- `.github/workflows/deploy.yml`: `main` push で install、typecheck、lint、Vitest、build、Chromium E2E、Cloudflare Pages deploy を直列化する。`DATABASE_URL`、Turnstile、Sentry 等の secret は GitHub/Pages secret から渡す
- `.github/workflows/e2e.yml`: 旧コメントアウト/production ダミー job を削除する。E2E は `deploy.yml` に統合し、CI では Chromium のみとする
- 完了条件: Sentry は PII を送らず、E2E_TEST_MODE=false の本番では test endpoint が存在せず、CI の検査失敗で deploy step に到達しない

### ブロック 12: ドキュメントと旧実装の整理

- 意図: v1 実装後に旧ルールを参照して仕様が逆戻りすることを防ぐ
- `CLAUDE.md`: Edge 制約、匿名＋Google、Turnstile、tRPC 集約、BGM/R2 なし、三層構造、v1 の品質管理手順を記載する。現行ファイルは `.gitignore` から外して tracked にする
- `ai-rules/ARCHITECTURE.md`、`ai-rules/TESTING.md`、`ai-rules/TROUBLESHOOTING.md`、`ai-rules/ISSUE_GUIDELINES.md`、`ai-rules/COMMIT_AND_PR_GUIDELINES.md`、`ai-rules/WORK_FLOW.md`: v1 の単一の正に書き換える。テスト helper のパスは v1 で新設する `tests/e2e/helpers/auth.ts` に統一し（旧 `tests/helpers/auth.ts` は削除）、ドキュメント・計画・実コードで表記を揃える
- `README.md`: v1 の起動、env、DB、test、deploy を簡潔に書き直す
- `.planning/DESIGN.md`: 削除する
- `.planning/` の旧成果物: 公開前の履歴整理で削除する。新しい GSD phase/roadmap は作らない
- `public/audio/README.md`、`public/bg/README.md`、BGM/R2 関連の README/コードを削除する。`public/favicon.svg` は残す。`src/assets/react.svg` は削除する
- 完了条件: `rg` で `MigrateDialog`、`admin()`、`emailAndPassword`、`recharts`、`BGM_BUCKET`、`pomodoro_sessions`、`todos`、`pause`（非スコープ説明を除く）などの旧実装参照がない。旧 ADR と `docs/v1-mockup.html` は残す

## 7. 変更対象ファイル一覧

### 7.1 変更

| ファイル | 変更内容 |
|---|---|
| `.gitignore` | `CLAUDE.md` と `ai-rules/` を tracked にできるよう除外を削除。生成物の除外は維持 |
| `package.json` | v1 依存、scripts（`typecheck` 追加）、devDependencies を整理 |
| `package-lock.json` | `package.json` と一致する lock 更新 |
| `wrangler.toml` | R2 削除、Edge/Pages 設定維持、`compatibility_date` 更新 |
| `tsconfig.json` | `references` に `tsconfig.functions.json` を追加 |
| `tsconfig.app.json` | `include` は `src` のまま。必要なら `src/server` 用に DOM 型が漏れない設定を確認 |
| `drizzle.config.ts` | schema パスを `src/server/db/schema.ts` に、DB を v1 Neon branch に変更 |
| `vite.config.ts` | SPA fallback、`/api`→`8788` proxy、E2E baseURL 5173 |
| `vitest.config.ts` | `tests/integration/**` を除外しない。PGlite 用に env 分離（`// @vitest-environment node` か `test.projects`） |
| `playwright.config.ts` | v1 の 3 spec に更新、`globalSetup` 見直し、`webServer.env` で E2E 用 env を wrangler に供給 |
| `index.html` | v1 metadata と theme 初期化 |
| `src/main.tsx` | Router、provider、Sentry ErrorBoundary の入口 |
| `src/App.tsx` | 旧 pathname/Bento app を削除し router へ移行 |
| `src/App.css` | 旧 Vite/Bento CSS を v1 style へ置換または空にする |
| `src/index.css` | semantic tokens、theme、a11y、reduced motion/transparency へ置換 |
| `src/lib/trpc.tsx` | tRPC v11 の typed context に対応する client/provider へ更新 |
| `src/lib/auth.ts` | admin client を削除し anonymous/social/session client へ更新 |
| `src/hooks/useAuth.ts` | Better Auth user/session と v1 API に更新 |
| `src/components/timer/TimerControls.tsx` | pause/reset/autostart 前提を削除 |
| `src/components/timer/TimerDisplay.tsx`、`src/components/timer/TimerRing.tsx` | `TimerDisc` へ置換するか削除 |
| `src/core/store/timer.ts` | `focus-runtime.ts` へ移行後に削除 |
| `src/core/store/todos.ts` | サーバー Task query 前提へ置換後に削除 |
| `src/core/store/ui.ts` | toast だけに限定して必要なら更新 |
| `src/lib/storage.ts` | Task/Session/BGM の永続化を削除し、theme と focus outbox の専用モジュールへ分割後に不要部分を削除 |
| `functions/api/[[route]].ts` | health/auth/admin だけに縮小 |
| `functions/api/trpc/[[route]].ts` | typed auth/db/schema context と Sentry 対応 |
| `functions/api/auth.ts` | Better Auth handler のみへ縮小 |
| `functions/lib/auth.ts` | `src/server/auth.ts` へ移動後に削除 |
| `functions/lib/db.ts` | `src/server/db/client.ts` へ移動後に削除 |
| `functions/lib/schema.ts` | `src/server/db/schema.ts` へ移動後に削除 |
| `functions/middleware/auth.ts` | Better Auth session middleware へ置換または削除 |
| `.github/workflows/deploy.yml` | 品質検査後 deploy の直列 workflow へ更新 |
| `README.md` | v1 README へ書き直し |

### 7.2 新規作成

| ファイル | 責務 |
|---|---|
| `public/_redirects` | SPA fallback |
| `tsconfig.functions.json` | `functions/**` と `src/server/**` の型検査（Edge lib、DOM 型なし） |
| `.dev.vars.example` | v1 の env キー一覧（実値なし）。ローカル/CI の `.dev.vars` 生成の雛形 |
| `src/server/db/schema.ts`、`src/server/db/client.ts` | Drizzle schema/client（`createDb` / `createTestDb`） |
| `src/server/context.ts` | tRPC typed Context/procedure |
| `src/server/auth.ts` | Better Auth 設定 |
| `src/server/routers/root.ts`、`auth.ts`、`bootstrap.ts`、`tasks.ts`、`focus.ts`、`review.ts`、`settings.ts`、`account.ts` | v1 tRPC routers |
| `src/server/services/account-link-service.ts`、`bootstrap-service.ts`、`focus-session-service.ts`、`task-service.ts`、`review-service.ts`、`export-service.ts`、`analytics-service.ts` | DB 非依存のドメイン/ユースケース |
| `src/server/repositories/user-repository.ts`、`task-repository.ts`、`focus-session-repository.ts`、`analytics-event-repository.ts`、`settings-repository.ts` | Drizzle 入出力 |
| `src/server/integrations/turnstile.ts` | Cloudflare Siteverify |
| `src/server/test-auth.ts`、`functions/api/test/auth.ts` | E2E 専用 auth |
| `src/core/domain/focus-session.ts`、`src/core/store/focus-runtime.ts` | timer の純関数/実行中状態 |
| `src/lib/focus-outbox.ts`、`notifications.ts`、`sound.ts`、`theme.ts`、`sentry.ts` | ブラウザ API/補助処理 |
| `src/messages.ts` | 日本語 message registry |
| `src/app/router.tsx` | React Router route 定義 |
| `src/components/layout/AppHeader.tsx` | v1 header |
| `src/components/landing/LandingPage.tsx` | LP |
| `src/components/app/AppPage.tsx`、`NowCard.tsx` | `/app` 骨格/Now |
| `src/components/tasks/TaskAddForm.tsx`、`TaskRow.tsx`、`TaskList.tsx`、`TaskDetailsSheet.tsx` | Task UI |
| `src/components/timer/TimerDisc.tsx` | 円盤 timer |
| `src/components/review/ReviewPage.tsx` | 振り返り |
| `src/components/settings/SettingsPage.tsx`、`src/components/auth/GoogleLoginButton.tsx`、`src/components/ui/Toast.tsx`、`src/components/legal/LegalPage.tsx` | settings/auth/toast/legal |
| `src/core/domain/focus-session.test.ts`、`src/server/services/*.test.ts`、`tests/integration/*.test.ts` | 純関数/service/PGlite test |
| `tests/e2e/v1-bootstrap-focus.spec.ts`、`v1-auth-link.spec.ts`、`v1-review.spec.ts` | 主要 E2E 3 フロー |
| `tests/e2e/helpers/auth.ts` | test endpoint を使う v1 認証 helper |
| `ai-rules/*.md` | v1 のルール一式。既存 ignored ファイルを tracked 化 |

### 7.3 削除または旧パスから移動

| 対象 | 理由 |
|---|---|
| `functions/api/todos.ts`、`functions/api/pomodoro.ts`、`functions/api/bgm.ts` | REST/todos/pomodoro/BGM を廃止し tRPC に集約 |
| `src/app/routers/`（`_shared.ts`、`bgm.ts`、`context.ts`、`pomodoro.ts`、`root.ts`、`todos.ts`） | `src/server/routers/` と `src/server/context.ts` へ再構成。旧 todos/pomodoro/bgm router は破棄 |
| `src/components/bgm/`（`__tests__/` 含む全ファイル）、`src/hooks/useBgm.ts` | BGM/R2 非スコープ |
| `src/components/dialogs/LoginDialog.tsx`、`MigrateDialog.tsx` | email/password と localStorage migration を廃止 |
| `src/components/auth/LoginButton.tsx` | `src/components/auth/GoogleLoginButton.tsx` へ置換 |
| `src/components/stats/StatsCard.tsx`、`StatsCard.test.tsx` | `/app/review` の SVG へ置換（`recharts` も削除） |
| `src/components/layout/Header.tsx`、`Header.test.tsx`、`Footer.tsx`、`src/components/tasks/CurrentTaskCard.tsx` | v1 layout/header/Now へ置換 |
| `src/components/pages/ResetPasswordPage.tsx`、`VerifyEmailPage.tsx` | password/email verification 非スコープ |
| `src/components/todos/`（`TodoInput.tsx`、`TodoItem.tsx`、`TodoItem.test.tsx`、`TodoList.tsx`、`__tests__/card-header.test.ts`） | `src/components/tasks/*` へ置換 |
| `src/components/timer/`（`TimerDisplay.tsx`、`TimerRing.tsx`、`__tests__/card-header.test.ts`） | `TimerDisc.tsx` へ置換。`TimerControls.tsx` は残して v1 仕様へ書き換え |
| `src/core/store/timer.ts`、`src/core/store/todos.ts`、`src/core/store/auth.ts` | `focus-runtime.ts` / サーバー Task query / Better Auth `useSession` へ置換後に削除 |
| `src/hooks/useTimer.ts`、`useTimer.test.ts`、`usePomodoro.ts`、`useTodos.ts` | v1 の Focus / Task フックへ置換 |
| `src/lib/animation.ts` | v1 のモーション方針（`framer-motion` + `useReducedMotion`）に統合。残す価値がなければ削除 |
| `src/assets/react.svg`、`components.json`、`src/components/ui/checkbox.tsx` | starter/shadcn 足場の削除 |
| `public/audio/`（`README.md` 含む）、`public/bg/`（`README.md` 含む） | BGM/背景画像 非スコープ。`.gitignore` の該当行も削除 |
| `drizzle/*.sql`（`0000`〜`0007` 系）、`drizzle/meta/*`（`_journal.json`、`*_snapshot.json`） | v1 の新 `0000_v1_initial` に置換。実際の削除対象は Git diff で確認 |
| `tests/bgm-api.test.ts`、`tests/bgm-router.test.ts`、`tests/unit/bgm.test.ts`、`tests/unit/helpers/r2-mock.ts`、`tests/unit/helpers/trpc-context.ts` | BGM / 旧 tRPC context 非スコープ |
| `tests/e2e/migration.spec.ts`、`tests/e2e/bgm.spec.ts` | migration/BGM 非スコープ |
| `tests/e2e/auth.spec.ts`、`timer.spec.ts`、`todo.spec.ts`、`todo-highlight.spec.ts` | v1 の 3 本（§9.4）へ置換 |
| `tests/global-setup.ts`、`tests/helpers/auth.ts` | email/password seed と旧 sign-in を廃止。v1 は `tests/e2e/helpers/auth.ts`（新規）が `/api/test/auth` を使う。`globalSetup` は不要なら `playwright.config.ts` から外す |
| `functions/lib/auth.ts`、`functions/lib/db.ts`、`functions/lib/schema.ts` | `src/server/auth.ts`、`src/server/db/client.ts`、`src/server/db/schema.ts` へ移動後に削除 |
| `.github/workflows/e2e.yml` | `deploy.yml` に E2E を統合 |
| `.planning/DESIGN.md`、旧 `.planning/` 成果物 | 公開前の履歴整理で削除、GSD を継続利用しない |

**catch-all ルール**: 上記および §7.1 / §7.2 に「残す」「新規」と明記されていない `src/**` / `functions/**` / `tests/**` / `drizzle/**` の既存ファイルは、v0 機能に属するものとして削除する。判断に迷うファイル（`src/lib/utils.ts`、`src/global.d.ts`、`src/test/setup.ts`、`src/test/accessibility-test-utils.tsx`、`src/main.tsx` 等）は §7.1 の「変更」側に該当するか確認してから残す。Issue #148 の「推奨ビルド順序」1 は `src` / `functions` / `drizzle` / `tests` の全消しを起点に置いているが、本計画は Better Auth テーブル・`favicon.svg`・ADR・`docs/v1-mockup.html`・tsconfig/vite/wrangler の土台を保持したいため、全消しではなく上記の明示リスト + catch-all で同じ結果（v0 参照ゼロ）を得る。

「新規」パスは実装時に作るもの、それ以外の既存パスは現行 tree に存在することを確認済みである。`src/server/routers` 等を作る場合は、古い import が一つも残らないように一括で参照を更新する。

## 8. ライブラリ API と一次情報

実装開始前に `npm ls --depth=0` と `package-lock.json` で実解決版を確認する。以下の版はこの計画作成時の現行 lock/tree の確認値であり、追加依存は install 後に lock の実解決版を記録する。

| ライブラリ | 現在の実解決版 | v1 で使う API/書き方 | 一次情報 |
|---|---:|---|---|
| React | 19.2.4 | component、`useEffect`、`useMemo`、`useSyncExternalStore`。timer は 1 秒 `setInterval` と時刻差分で更新 | [React 公式](https://react.dev/reference/react) |
| Better Auth | 1.5.4 | server: `betterAuth`、`drizzleAdapter`、`anonymous({ onLinkAccount: async ({ anonymousUser, newUser, ctx }) => ... })`（`anonymousUser` / `newUser` は `{ user, session }`。ID は `.user.id`。型は `node_modules/better-auth/dist/plugins/anonymous/types.d.mts` で確認済み）、`socialProviders.google`、`user.additionalFields`、`session.expiresIn` / `session.updateAge`。client: `createAuthClient`、`anonymousClient()`、`signIn.anonymous()`、`signIn.social()`、`useSession()`、`signOut()` | [Anonymous plugin](https://www.better-auth.com/docs/plugins/anonymous)、[OAuth](https://www.better-auth.com/docs/concepts/oauth)、[Session management](https://www.better-auth.com/docs/concepts/session-management) |
| Zod | 追加 | tRPC の各 procedure の `.input()` スキーマに使う。tRPC 11 は zod を同梱しないため明示追加。install 後に v3/v4 系のどちらが解決されたか lock で確認し、`z.object` / `z.string().uuid()` / `z.enum` など使用 API を版に合わせる | [Zod](https://zod.dev/)、[tRPC input validation](https://trpc.io/docs/server/validators) |
| tRPC server/client | 11.0.0 | server: `initTRPC.context<Context>().create({ transformer })`、`t.router`、`t.procedure.use`、`TRPCError`、`fetchRequestHandler`。client: `createTRPCReact`、`httpBatchLink`、`trpc.useUtils()`、`invalidate()`、`setData()` | [tRPC server](https://trpc.io/docs/server/routers)、[tRPC React](https://trpc.io/docs/client/react)、[Fetch adapter](https://trpc.io/docs/server/adapters/fetch) |
| Drizzle ORM | 0.45.1 | `pgTable`、`timestamp({ withTimezone: true })`、`.references()`、`index`/`uniqueIndex`、`relations`、`db.transaction`、`returning`、`sql`。本番 client は `drizzle(neon(databaseUrl), { schema })` を `drizzle-orm/neon-http` から import | [PostgreSQL schema](https://orm.drizzle.team/docs/sql-schema-declaration)、[Relations](https://orm.drizzle.team/docs/relations)、[Transactions](https://orm.drizzle.team/docs/transactions)、[Neon](https://orm.drizzle.team/docs/connect-neon)
| Neon serverless | 1.0.2 | Edge では `neon(env.DATABASE_URL)` と `drizzle-orm/neon-http`。TCP を開く `neon-serverless` は使わない | [Neon serverless driver](https://neon.tech/docs/serverless/serverless-driver) |
| TanStack Query | 5.90.21 | `QueryClient`、`QueryClientProvider`、query `enabled`、mutation `onSuccess`、`invalidateQueries`。サーバー状態を Zustand に複製しない | [TanStack Query React](https://tanstack.com/query/latest/docs/framework/react/overview) |
| React Router | 追加、v7 系 | package は `react-router` 単体（v7 で `react-router-dom` は統合済み。`react-router-dom` を入れない）。`createBrowserRouter(routeObjects)` と `RouterProvider` を root 外で 1 回だけ作成し、`Link`/`useNavigate` で client navigation。`/app` は loader auth guard ではなく bootstrap | [React Router createBrowserRouter](https://reactrouter.com/api/data-routers/createBrowserRouter)、[RouterProvider](https://reactrouter.com/api/data-routers/RouterProvider)、[v7 upgrade / single package](https://reactrouter.com/upgrading/v6) |
| Zustand | 5.0.11 | `create` と `persist`。`partialize` で実行中 session の必要項目だけ保存し、`persist.rehydrate()` を `storage` event から呼び出す | [Persist middleware](https://zustand.docs.pmnd.rs/middlewares/persist) |
| `@dnd-kit/core` / sortable | 6.3.1 / 10.0.0 | `DndContext`、`SortableContext`、`useSortable`、drag handle の `attributes`/`listeners`。On Deck のみ | [dnd-kit docs](https://docs.dndkit.com/) |
| `fractional-indexing` | 追加 | `generateKeyBetween(previousKey, nextKey)`。大量再配列だけ `generateNKeysBetween`。整数再採番はしない | [fractional-indexing README](https://github.com/rocicorp/fractional-indexing) |
| `radix-ui` | 1.4.3 | 統合 package の `Dialog`、`Popover`、`Slider`、`Switch`、`DropdownMenu`。Radix の state/ARIA/focus behavior を使い、style は semantic tokens で定義 | [Radix UI primitives](https://www.radix-ui.com/primitives) |
| Framer Motion | 12.35.1 | `motion`、`AnimatePresence`、`useReducedMotion`。sheet の入退場と LP reveal に限定し、timer の連続アニメーションには使わない | [Motion reduce motion](https://motion.dev/docs/react-use-reduced-motion)、[AnimatePresence](https://motion.dev/docs/react-animate-presence) |
| `@marsidev/react-turnstile` | 追加 | `<Turnstile siteKey={...} options={{ appearance: "interaction-only" }} onSuccess={...} onExpire={...} onError={...} />`。`/app` レイアウト直下に 1 つだけ mount（§ブロック 4）。`execution: "execute"` は使わない。token を初回書き込み mutation の input に渡し、secret は server の Siteverify のみ。token は単回・約 300 秒 TTL。dev/E2E は Cloudflare のテストキー（sitekey `1x00000000000000000000AA` / secret `1x0000000000000000000000000000000AA`） | [React Turnstile props](https://github.com/marsidev/react-turnstile/blob/main/docs/props.mdx)、[Cloudflare Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)、[Turnstile testing keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) |
| `@sentry/react` / `@sentry/cloudflare` | 追加 | client `Sentry.init`、`Sentry.ErrorBoundary`。Functions handler は `withSentry` で wrap。`sendDefaultPii:false`、`tracesSampleRate:0.1` | [Sentry React](https://docs.sentry.io/platforms/javascript/guides/react/)、[Sentry Cloudflare](https://docs.sentry.io/platforms/javascript/guides/cloudflare/) |
| PGlite | 追加 devDependency | test で `new PGlite()`（インメモリ）を使い、`drizzle-orm/pglite` の `drizzle(client, { schema })` に渡す。v1 の `0000` SQL はファイルを読んで `client.exec()` で流す（drizzle-kit の journal ベース `migrate` はフォルダ前提なので使わない）。循環 FK のため `CREATE TABLE` → `ALTER TABLE ADD CONSTRAINT` の順序を保つ。`tests/integration/**` は `// @vitest-environment node` | [PGlite API](https://pglite.dev/docs/api)、[PGlite Drizzle](https://pglite.dev/docs/orm-support) |
| Playwright | 1.58.2 | E2E は `await page.clock.install({ time })` を page load 前に行い、`await page.clock.fastForward(...)` または `runFor(...)` で `endsAt` を跨ぐ。通常の `waitForTimeout` を時間仕様の検証に使わない。**`focus.start` の server now はサーバー実時刻なので、`E2E_TEST_MODE` 時に header で固定時刻を渡してブラウザ clock と一致させる**（§ブロック 5） | [Playwright Clock](https://playwright.dev/docs/clock) |
| Cloudflare/Hono | Hono 4.12.3、Wrangler 4.69.0 | `Hono`、`handle`、Web `fetch`、`c.env`。Node `crypto`/`fs`/`net` を Functions runtime に import しない | [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)、[Hono Cloudflare](https://hono.dev/docs/getting-started/cloudflare-workers) |
| Web APIs | ブラウザ標準 | `Notification.requestPermission()`、`AudioContext`/`OscillatorNode`/`GainNode`、`Intl.DateTimeFormat(..., { timeZone })`、`storage` event、`IntersectionObserver`、SVG path | [Notification](https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission)、[AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)、[Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)、[storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event) |

API 名が上表と違う場合は、実装時の lock 版の公式ドキュメントを優先し、推測で旧 API を混ぜない。特に Better Auth の anonymous callback の引数形（`{ user, session }` ラッパ）、React Router v7 の import 元、Radix 統合 package の export、Turnstile の appearance/execution オプション、PGlite の constructor、Zod の解決メジャー版は install 後に一次情報で照合する。

## 9. テスト方針

### 9.1 純粋なドメインテスト

対象と配置は次のとおり。テスト名は「状態 → 操作 → 期待結果」を日本語または英語の具体的な文で表し、実装手順ではなく What を検証する。

- `src/core/domain/focus-session.test.ts`: 残時間、扇形の 0/1、60 秒未満/以上の中断、復帰 60 秒境界、Completed/Interrupted、cycle、Long Break Count
- `src/server/services/focus-session-service.test.ts`: server 側の同じ判定と payload
- `src/server/services/task-service.test.ts`: Today/Backlog/Today's Done/Archive、Now 昇格、期限超過 sweep、deck key、Estimate 未設定/超過
- `src/server/services/review-service.test.ts`: Completed/Interrupted の集計差、7 日、Focused Days、TZ 日跨ぎ
- `src/server/services/account-link-service.test.ts`: 新ユーザー空、既存データあり、全 FK/settings の移行、破棄結果
- `src/lib/theme.test.ts`、`src/lib/focus-outbox.test.ts`: system/light/dark mirror、1 件 outbox、成功時削除、重複送信抑止

必ず境界値を含める。例: `endsAt - now = 59,999ms` は未完了/中断破棄、`60,000ms` は Interrupted、終了超過 `60,000ms` は確認、`60,001ms` は確認対象、Tokyo の日付が 00:00 を跨ぐ時刻は別日集計とする。

### 9.2 PGlite + Drizzle 結合テスト

`tests/integration/` に配置し、各テストで PGlite を初期化して v1 `drizzle/0000_v1_initial.sql` を適用する。Neon や Cloudflare R2 には接続しない。

- user ごとの Task/Focus 分離
- `current_task_id` の complete/delete 時 NULL 化
- Task delete 時の `focus_sessions.task_id SET NULL`
- Focus 開始で行が増えず、complete/interrupt で 1 行だけ増える
- Interrupted が Completed 本数、Focused Days、Estimate から除外される
- `analytics_events` の unique conflict がエラーにならない
- anonymous→Google の FK/settings 移行と、Google 側既存データ時の破棄
- `last_seen_at` が 1 時間未満では更新されず、1 時間以上で更新される
- TZ を使う今日/7 日集計が DB query と純関数の期待値に一致する
- Turnstile token 無し mutation が service/repository へ到達しない（middleware test も含む）

### 9.3 コンポーネント/アクセシビリティテスト

既存の Testing Library + jsdom 設定を v1 に更新し、`src/components/**/*.test.tsx` に置く。

- `TimerDisc`: `role="timer"`、日本語 aria-live、1 秒更新、break accent、0:00
- `TaskDetailsSheet`: Dialog role、Escape/scrim close、focus return、Estimate 1〜8/未設定
- `TaskRow`/`TaskList`: accessible name、Now 昇格、完了、削除、Backlog/Today 表示
- `SettingsPage`: theme/sound/export/delete の操作と red の用途制限
- LP: CTA、確定コピー、reduced-motion 時の即時表示
- `prefers-reduced-motion`、`prefers-reduced-transparency`、`prefers-contrast` の CSS/JS 分岐

### 9.4 E2E

`tests/e2e/` に Chromium を主対象として次の 3 本を作る。`tests/e2e/helpers/auth.ts` は `/api/test/auth` を使い、旧 email/password `TEST_USER` と `globalSetup` の sign-up を削除する。

1. `v1-bootstrap-focus.spec.ts`: LP→`/app`、匿名作成、sample Task、Task 追加、Now 昇格、Focus 開始、`page.clock` で Completed、break 提案、60 秒未満/以上の Stop、reload 後の outbox/復帰
2. `v1-auth-link.spec.ts`: 匿名データを作成、テスト専用 sign-in で既存データなし Google identity に結合、Task/Focus/settings の移行を確認。別ケースで Google identity に既存データを入れ、匿名 ID が破棄され toast が表示されることを確認。E2E_TEST_MODE=false の endpoint 404 も確認
3. `v1-review.spec.ts`: Completed と Interrupted をテスト fixture で作り、今日の時間/完了本数、完了 Task、7 日 SVG、Focused Days を確認。settings の theme/sound/export/delete と LP 復帰も実行

Playwright は page clock を page load 前に install する。例として 25 分 session の `endsAt` を跨ぐには、固定時刻 `2026-09-03T09:00:00+09:00` で install し、開始操作後に 25 分以上を `fastForward` する。これにより実時間待ちを避けながら、ユーザーが開始→終了を操作したのと同じ画面遷移を検証する。

## 10. 品質管理の実行手順

現行 `CLAUDE.md` には「品質管理の実行手順」が存在しないため、この Issue では次を v1 の手順として `CLAUDE.md` と `ai-rules/TESTING.md` に明記する。実装後は必ず上から順に実行し、失敗を隠して次へ進めない。

1. `npm ci`: lock に基づいて依存を再現する
2. `npm run lint`: ESLint の警告/エラーをなくす
3. `npm run typecheck`: `tsc -b` で Functions/React 両方を確認する
4. `npm test -- --run`: Vitest の unit/component/integration を一括実行する
5. `npm run test:coverage`: coverage を収集する。数値を CI gate にはしない
6. `npm run build`: Vite/Functions の production build を確認する
7. `npm run test:e2e -- --project=chromium`: Playwright の主要 3 フローを実行する
8. `/playwright-cli` skill で実際の起動中アプリをユーザー目線で操作する。対象ポートと作業 tree が一致することを確認し、必要なら `npm run dev` を空きポートで起動する
9. light/dark/system、mobile/desktop、keyboard、reduced-motion/transparency、ネットワーク断をブラウザで確認する
10. `rtk git diff --check`、`rtk git status --short`、`rg` で旧機能参照と secret 混入を確認する

実装後の E2E は `ai-rules/TESTING.md` の指示に従い、まず Playwright CLI で実画面の role/name/label を確認してから locator を固定する。Python/JavaScript/Bash でブラウザを直接操作する代替手段は使わない。

## 11. ブラウザでの手動動作確認

### 11.1 起動と対象確認

1. `npm run dev` を実行し、Vite（`5173`）と Pages Functions（wrangler `8788`）の URL を確認する。`.dev.vars` が v1 の env キー（§12.1）で埋まっていることを先に確認する。
2. ブラウザで `http://localhost:5173/` を開き、Network/console にエラーがないことを確認する。API は vite の proxy 経由で `8788` に転送される。
3. `http://localhost:5173/api/health`（proxy 経由）と `http://localhost:8788/api/health`（直接）の両方が現在の worktree の Functions と DB に対して `status: ok` を返すことを確認する。別 worktree の既存 server を使っていないことをポート/起動ログで確認する。

### 11.2 LP と匿名ブートストラップ

1. `/` を開く。見出し「集中は、気合いじゃない。」、3 本柱、Google ではなく CTA「今すぐ使ってみる」が表示される。LP 閲覧だけでは匿名 DB user が増えない。
2. CTA を押す。`/app` に遷移し、匿名 user が作成される。
3. Now に「Pomdo を5分だけ触ってみる」が 1 件表示され、再読み込みしても重複しない。On Deck/Backlog/Today's Done の順序と単一カラムを確認する。

### 11.3 Task と Now

1. On Deck の追加 form で `請求書を確認する` を追加する。Today/On Deck に表示され、Backlog には表示されない。
2. Backlog の disclosure を開き、同じ form で `いつか読む記事` を追加する。Backlog に表示される。
3. Backlog の Task 行をタップする。`planned_for` が今日になり、Now に昇格する。
4. Task のメニューから詳細シートを開く。タイトル、メモ、Estimate を変更し、保存後に行と Now に反映される。Estimate は未設定、1、8、8 超過拒否を確認する。
5. On Deck の handle をドラッグし、上へ/下へボタンでも並べ替える。再読み込み後も順序が保たれ、Backlog の順序は created_at 降順のままにする。
6. Now を完了する。`current_task_id` が NULL になり、今日完了したことへ移り、On Deck 先頭を Now にする提案が一度表示される。
7. Task を削除する。確認後に行が消え、関連 Focus Session は残り `task_id` が NULL になる。

### 11.4 Focus と休憩

1. idle 状態で 15/25/45 を押し、円盤中央と扇形の面積が変わる。実行中は preset が操作できず、操作は「ストップ」だけになる。
2. Now がある状態で「▶ はじめる」を押す。最初の一回だけ Notification 許可要求が開始直前に出る。許可なら session が開始し、拒否なら以後再要求されない。
3. 開始後にタブを別に切り替え、戻る。残り時間は壁時計の差分で進み、1 秒刻みで表示される。pause/自動開始/回転 spinner は存在しない。
4. 60 秒未満で「ストップ」を押す。確認なしで idle に戻り、review の Focus Session 数/時間が増えない。
5. 60 秒以上で「ストップ」を押す。Interrupted として合計集中時間だけ増える。Completed 数、Focused Days、Estimate は増えない。
6. 25 分を clock/test 時刻で跨ぐ。Completed になり、Short Break の「休憩する（5分）」/「もう1本」が出る。どちらも自動開始されない。
7. Completed Focus を 3 本にする。Long Break の「長めに休む（15分）」が提案される。「もう1本」ではカウンタが保持され、「長めに休む」を押した時だけ 0 に戻る。
8. Focus 中にネットワークを切断して終了する。表示は失敗で壊れず、再接続して再読み込みすると outbox が 1 件だけ送信される。二重の実績ができない。
9. 同一 URL を 2 タブで開き、片方で開始/終了する。もう片方の `endsAt` と表示が storage event で同期する。別デバイスまで同期されるとは期待しない。

### 11.5 空の Now と Just Focus

1. Now を空にして「▶ はじめる」を押す。
2. 円盤直下に `On Deck から1つ選ぶ` と `このまま集中する` が inline で出る。
3. 前者では選択した Task に紐付き、後者では `task_id = null` の Just Focus になる。どちらも Focus 開始後は choice が消える。

### 11.6 Review

1. `/app/review` へ移動する。
2. 今日の合計集中時間は Completed + Interrupted、完了した Focus Session 数は Completed のみであることを確認する。
3. 完了 Task 一覧、直近 7 日の 7 本 SVG bar、今日の強調、Focused Days の「累計 N 日」を確認する。未達の赤字、streak、目標線はない。
4. timezone の日付境界付近で再確認し、ブラウザの timezone ではなく user の `Asia/Tokyo` 等で集計されることを確認する。

### 11.7 Settings、認証、削除

1. `/app/settings` を開く。音量 slider、ミュート switch、テスト再生、system/light/dark、匿名状態の Google ボタン、常時警告、export、delete、`Asia/Tokyo（自動検出）` 表示がある。
2. theme を dark/light/system に変更する。`<html data-theme>` と初回ペイントの localStorage mirror が正しく、再読み込み後も維持される。
3. Google ボタン近くの警告を確認する。過去に同じ Google account を使っていた場合に端末データを引き継がない可能性が明記されている。
4. テスト専用 auth で結合を実行する。匿名側にだけデータがある場合は Task/Focus/settings が引き継がれ、Google 側に既存データがある場合は匿名側が破棄され、toast が出る。
5. JSON export を押す。`pomdo-export-YYYYMMDD.json` が保存され、`exportedAt`、settings、tasks、focusSessions があり、analytics_events はない。
6. アカウント削除を押す。確認は 1 回だけ、hard delete 後に sign out し `/` の LP へ戻る。DB の Task/Focus/analytics/session が CASCADE で消える。

### 11.8 アクセシビリティ、motion、responsive

1. キーボードだけで CTA、Task form、Now、sheet、timer、settings を操作する。focus ring が見え、sheet を閉じた後に opener へ focus が戻る。
2. スクリーンリーダーで `role="timer"` と毎分更新の「残り N 分」、Task 行、switch、slider、Dialog の label を確認する。
3. `prefers-reduced-motion: reduce` を有効にする。sheet は cross-fade、LP は即時表示、timer の時間表現は変えず、点滅/脈動/回転がない。
4. `prefers-reduced-transparency`/`prefers-contrast` を有効にする。header が不透明化し、border/text のコントラストが落ちない。
5. mobile 幅 375px と desktop 幅 1440px で `/`、`/app`、review、settings を確認する。水平 scroll、画面外 Dialog、操作不能な drag handle がない。

## 12. 環境変数・運用・ロールバック

### 12.1 環境変数

- 維持: `DATABASE_URL`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`BETTER_AUTH_SECRET`、`BETTER_AUTH_URL`、必要な本番 `FRONTEND_URL`
- 追加: `TURNSTILE_SITE_KEY`、`TURNSTILE_SECRET_KEY`、`SENTRY_DSN`、`ADMIN_CRON_SECRET`、`E2E_TEST_MODE`
- 削除: `JWT_SECRET`、`GOOGLE_REDIRECT_URI`、`APP_URL`
- `TURNSTILE_SECRET_KEY`、`BETTER_AUTH_SECRET`、`ADMIN_CRON_SECRET` はフロントへ公開しない。`TURNSTILE_SITE_KEY` だけを client に渡す
- ローカルは `.dev.vars`（gitignore 済み、`wrangler pages dev` が読む）に置く。上記キー一覧を `.dev.vars.example`（新規、tracked）に実値なしで用意し、README と CI の `.dev.vars` 生成 step から参照する
- CI（E2E）は `e2e` または `e2e-pr` Environmentの値から `.dev.vars` を生成し、`E2E_DATABASE_URL` を `DATABASE_URL` として使う。`E2E_TEST_MODE=true`、`BETTER_AUTH_URL=http://localhost:5173`、TurnstileはCloudflareテストキー、`SENTRY_DSN`は空にする

### 12.2 Staging/production

- DB は旧 DB を参照用に残したまま、新 Neon branch を作り、新 `0000` migration を適用する
- Preview は Cloudflare Pages の `develop` branch alias（固定URL: `https://develop.pomdo.pages.dev`）、Neon staging branch、Preview専用のAuth/Turnstile設定を使う。Googleの本番callback/trusted originは `pomdo.pages.dev` のままにする
- Preview URLは実Google OAuthのtrusted originへ追加しない。`https://develop.pomdo.pages.dev/api/health` と本番モードで404になる `/api/test/auth` を使って検証する
- 90 日 purge は GitHub Actions の日次 cron から `POST /api/admin/purge-anonymous` を `ADMIN_CRON_SECRET` 付きで呼ぶ

### 12.3 手戻り時の扱い

- 新 DB は旧 DB と別なので、初期 migration 前は新 branch を破棄して再作成できる。既存本番 DB の migration を書き換えたり destructive SQL を本番旧 DB に向けたりしない
- v1 のスキーマ/コードがPreview stagingで失敗した場合は、前回成功時の `dist/` と `functions/` bundleを `develop` aliasへ再公開する。Pages PreviewにはProduction向けの公式rollback APIがないため、bundle再公開に失敗した場合は手動復旧またはforward fixへ送る。旧DBとの互換APIは実装しない
- 実装後に必要となった互換・移行は、この Issue の完了後に別 Issue として扱う

## 13. 実装担当者の提出前セルフチェック

- [ ] `design-docs-for-ai/issue148-adhd-focused-pomodoro-todo-v1-rebuild-implementation-plan.md` だけを計画成果物として参照し、GSD コマンド/新規 phase を使っていない
- [ ] Issue #148 の全要件が、実装ブロック・変更ファイル・テスト・ブラウザ確認のいずれかに対応している
- [ ] 計画に登場する既存ファイルパスは現行 tree で確認済みで、新規パスには「新規」と明記している
- [ ] DB 列は `users.current_task_id`、`tasks.planned_for`、`tasks.deck_order`、`tasks.completed_at`、`focus_sessions.completed_at`、`focus_sessions.duration_secs`、`focus_sessions.planned_secs`、`analytics_events.event` など現行計画と同じ用語で統一している
- [ ] `get`、`check`、`change`、`handle` など処理内容を隠す新規関数名を採用していない。例: DB 一覧は `listTasks`、日時計算は `calculateRemainingSecs`、移行は `linkAnonymousAccountData`
- [ ] テストは implementation detail でなく「何が正しいか」を検証する名前になっている
- [ ] API 使用例は package lock の版と一次情報 URL の組み合わせを確認している
- [ ] `npm ci`、lint、typecheck、Vitest、coverage、build、Chromium E2E、Playwright 手動確認を実行している
- [ ] 旧 BGM、admin、email/password、MigrateDialog、pause、Recharts、R2、localStorage Task/Session 保存が残っていない
- [ ] 法務レビューが LP/legal 公開のローンチブロッカーとして明記されている
- [ ] `functions/lib/auth.ts` の `advanced.database.generateId` を削除し、`users.id` / `sessions.userId` / `accounts.userId` を `text` に統一した
- [ ] `onLinkAccount` で `newUser.user.id` / `anonymousUser.user.id`（`.user` 経由）を参照している
- [ ] `tsconfig.functions.json` を作り `npm run typecheck` が `functions/` も検査する
- [ ] Turnstile widget が `/app` 直下に 1 つだけあり、`focus.start` が最初の書き込みでも検証が通る
- [ ] E2E で `focus.start` の server now をブラウザ clock と一致させる仕組み（`E2E_TEST_MODE` の header）がある
- [ ] `tests/integration/**` が Node 環境で走る設定になっている
- [ ] §7.3 の catch-all ルールで、明示リスト外の v0 ファイルが残らない

## 14. レビュー反映履歴（3 周）

この計画は現行コード（`rebuild/v1` ブランチ tree）・`node_modules` の実型定義・一次情報と突き合わせて 3 周レビューし、以下を修正済み。

### 1 周目: 現行コードとの整合・正確性

- `better-auth@1.5.4` の `onLinkAccount` 引数は `{ anonymousUser, newUser, ctx }` で、`anonymousUser` / `newUser` は `{ user, session }` ラッパ。ID 参照を `newUser.user.id` に修正（§5.3、§8）。既定の匿名ユーザー削除がどちらの分岐も処理することを明記。
- 現行 `users.id` は `uuid` + `advanced.database.generateId`。v1 は `text` 統一のため `generateId` 削除を明記（§ブロック 2・3）。`drizzleAdapter` の複数形テーブル名マッピングも明記。
- 現行 `functions/` はどの tsconfig にも入っておらず型検査されていない。`tsconfig.functions.json`（新規）+ `typecheck` script（新規）を追加（§ブロック 1、§7.1、§7.2）。
- `drizzle-kit` は現行 `dependencies` に `0.31.9`。バージョン維持で devDependencies へ移すだけと明記。`class-variance-authority` / `clsx` / `tailwind-merge` の去就を `src/lib/utils.ts` の `cn()` 方針に紐付け。
- §7.3 の削除リストが不完全だったため、`src/core/store/auth.ts`、`src/hooks/{usePomodoro,useTodos,useTimer}.ts`、`src/components/auth/LoginButton.tsx`、`src/components/todos/`、旧 E2E spec（`auth`/`timer`/`todo`/`todo-highlight`）、`__tests__/card-header.test.ts` 群などを追記し、**catch-all ルール**を追加。Issue の「全消し」推奨との差分理由も明記。
- テスト helper のパスを `tests/e2e/helpers/auth.ts` に統一（§ブロック 12 と §7.2/§9.4 の食い違いを解消）。

### 2 周目: 仕様忠実性・アーキテクチャ

- Turnstile widget を「最初の Task add form 内」に置くと、seed された Now タスクで最初の操作が `focus.start` になった場合にゲートを通せない。widget を `/app` 直下に 1 つだけ mount する方針へ変更（§ブロック 4・5、§8）。`execution: "execute"` をやめ `appearance: "interaction-only"` に。token の単回性・TTL・再取得も明記。
- `focus.start` / `focus.complete` / `focus.interrupt` が `turnstileProcedure` であることを明示（§ブロック 5）。
- `docs/v1-mockup.html` の実トークン集合と計画の列挙が不一致（`--color-accent-break-weak` 欠落、タイポ/モーション系トークン未記載）。「モックの `:root` をそのまま移植」＋現行トークン名の一覧に置換（§ブロック 8）。
- seed Task 作成では `first_task_created` を記録しないことを明記（§ブロック 3）。
- `last_seen_at` デバウンス更新の担当レイヤを tRPC Context に確定（§ブロック 3）。
- Long Break Count のアプリ起動時リセットを `focus-runtime.ts` の責務として明記（§ブロック 5、§4.5 と整合）。
- `zod` を §8 のライブラリ表に追加（tRPC 11 は同梱しない）。React Router v7 の単一 package 化も明記。

### 3 周目: テスト・CI・運用

- E2E の `page.clock` はブラウザ側のみ。`focus.start` の server now と乖離して `endsAt` を跨げない問題に対し、`E2E_TEST_MODE` 時の固定時刻 header を追加（§ブロック 5、§8 Playwright 行、§13）。
- `wrangler pages dev` への env 供給が未定義。CI で GitHub secret から `.dev.vars` を生成する step、`.dev.vars.example`（新規）、Turnstile テストキー運用を追加（§ブロック 4・11、§12.1、§7.2）。
- `vitest.config.ts` は `environment: 'jsdom'` 全体既定。PGlite の `tests/integration/**` を Node 環境で走らせる指定を追加（§ブロック 11、§8 PGlite 行、§7.1）。
- PGlite への migration 適用は drizzle-kit の journal ベース `migrate` ではなく `.sql` を `client.exec()` で流す方式に明記。循環 FK の `CREATE TABLE`→`ALTER TABLE ADD CONSTRAINT` 順序を保つ注意を追加（§ブロック 2、§8）。
- `deploy.yml` の直列に `lint` を追加（§ブロック 11）。
- §13 セルフチェックに上記の検証項目を追加。
