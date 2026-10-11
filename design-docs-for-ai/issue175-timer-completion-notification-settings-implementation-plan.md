# Issue #175 実装計画: タイマー完了通知設定

## 対象

- Issue: https://github.com/koshiro222/pomdo/issues/175
- スコープ: Issue 全体
- Issue コメント: `gh issue view --comments` で確認し、コメントなし。

## 目的

`/app/settings` から、Pomdo がタイマー完了通知を出すかどうかと、ブラウザが Pomdo に通知を許可しているかを別々に確認・管理できるようにする。Focus Session / Break の完了時には両方の状態を確認して通知し、設定がオフでも既存の完了記録・サイクル遷移・完了音・タブタイトル変更を維持する。

## 現行コードで確認したこと

- `src/lib/notifications.ts` の `requestNotificationPermissionOnce()` は初回 Focus 開始時に呼ばれ、`pomdo-notification-permission-requested` があると許可要求を止める。
- 同ファイルの `notifyFocusCompleted()` はブラウザ通知と `document.title` の変更を同じ関数で行う。
- `src/components/app/AppPage.tsx` は Focus 完了と Break 完了で共通文言の通知を呼ぶ。タブ内の `completedRuntimeId` / `completedBreakRuntimeId` だけでは複数タブ間の重複を防げない。Focus 中断と Break スキップは完了処理を通らない。
- `src/core/store/focus-runtime.ts` の Zustand persist は `pomdo-focus-runtime` を localStorage に保存し、他タブの `storage` イベントで再水和する。
- `src/components/settings/SettingsPage.tsx` にはサウンド、テーマ、アカウント、データ、タイムゾーンの各セクションがある。既存の `save()` はアカウント設定をサーバー保存するため、完了通知設定には流用しない。
- `src/messages.ts` に設定画面の日本語文言がまとまっている。
- `CONTEXT.md` には「完了通知設定」と「ブラウザ通知の許可」の定義が既にある。重複する用語を追加せず、実装後も現在の区別と矛盾しないことを確認する。
- `CLAUDE.md` の品質管理手順と `playwright.config.ts` の Chromium E2E 構成を確認した。

## 実装方針

### 1. Pomdo 独自設定をブラウザ単位で保存する

- `src/lib/notifications.ts` に、完了通知設定の読み込み・保存を集約する。
- localStorage の専用キー `pomdo-timer-completion-notifications-enabled` を新設する。値が未保存ならオン、文字列 `false` のときだけオフとする。アカウント ID やサーバー設定には結び付けない。
- 同じブラウザのアカウント切替後も値を共有する。現在のタブでは操作直後に React state を更新し、別タブでは設定キーの `storage` イベントを受けて読み直す。
- localStorage の読み書きが失敗した場合は例外を画面・タイマー処理へ漏らさない。設定を読めない場合は通知を送らず、設定画面に読み込み / 保存できない状態を伝える。保存に失敗したときも、画面上の切替え操作自体はタイマーへ影響させない。

### 2. ブラウザ許可状態を読み、明示操作からだけ要求する

- `Notification` が利用できるかを確認した後、`Notification.permission` を `granted` / `default` / `denied` として表示する。API 非対応は別状態にする。
- 許可状態は設定画面表示時に読み、`visibilitychange` でページが visible になったときと `pageshow` でも再読込する。これにより、ブラウザのサイト設定から戻った後に再読み込みせず表示を更新する。
- `default` の場合に限り、設定画面の「通知を許可」ボタンから `Notification.requestPermission()` を実行する。ブラウザのユーザー操作を失わないよう、クリックハンドラーから別の非同期処理を挟まずに呼び出す。Promise の reject も捕捉し、許可状態を再読込して画面に失敗を伝える。
- 既存の `pomdo-notification-permission-requested` は新しい許可要求の抑止条件にしない。`denied` では要求を呼ばず、ブラウザのサイト設定で許可する手順を案内する。
- Pomdo 独自設定のオン / オフとブラウザ許可状態を、それぞれ独立した説明・表示・操作として実装する。

### 3. 完了通知を完了副作用から分離し、複数タブで一度だけ送る

- `src/lib/notifications.ts` の通知生成とタブタイトル変更を分離する。Focus 完了・Break 完了のどちらでも完了処理内で従来のタイトル変更を直ちに行い、完了音も維持する。ブラウザ通知だけを Pomdo 設定と `Notification.permission === 'granted'` で制御し、非同期の lock 待ちを完了記録や UI 遷移に await しない。
- 通知タイトルは Focus 完了が「集中セッションが終わりました」、Break 完了が「休憩が終わりました」とする。通知テストは「Pomdoの通知テストです」とする。
- 通知を出す条件は完了処理の時点で評価する。Focus の中断、Break のスキップ、通知テスト以外の任意操作から完了通知を呼ばない。
- 重複防止には `navigator.locks.request('pomdo-completion-notification', ...)` の同一オリジン排他ロックを使い、ロック内で完了識別子の claim を確認・保存してから設定と許可状態を判定する。Focus は既存 `createRuntimeSessionKey()` が返す session ID、Break は同関数が返す `break-${startedAt}` を識別子として使い、claim のキーは `pomdo-completion-notification-claim:${runtimeKey}` とする。通知を出さない完了も claim する。これにより、完了時にオフ / 未許可だった実行について、別タブが遅れて処理したり設定が後でオンになったりしても通知しない。claim は通知生成より先に保存し、通知生成が失敗しても別タブが同じ完了を再通知しないようにする。localStorage の単純な読み取り後書き込みだけでは同時タブ間の排他を保証できないため、代替の非原子的処理を追加しない。
- 完了識別子ごとの claim は、同じ実行の復帰・再描画で再通知しないために保持する。通知の `tag` にも完了識別子を使い、ブラウザ側の置換が可能な場合の重複表示を抑える。
- ロック・保存・`new Notification(title)` が失敗しても catch し、Focus の API 記録、outbox、Break 遷移、音、タイトル変更を継続する。ロック API が利用できないときは重複保証のない通知を送らず、タイマー処理を継続する。
- 通知テストは設定がオンかつ許可が `granted` の場合だけ有効にする。クリック時は完了識別子 claim、タイマー、音、タブタイトルを変更しない。通知生成に失敗した場合は設定画面内に失敗を伝える。

### 4. 設定画面と文言

- 通知セクションを `SettingsContent` に追加し、既存 `.settings-group` / `.setting-row` のレイアウトを使う。
- Pomdo のオン / オフは既存と同じ `radix-ui` の `Switch.Root` で制御する。ブラウザ許可の状態はテキストでも提示し、「通知を許可」またはサイト設定への案内と「通知テスト」ボタンを表示する。
- 通知テストは Pomdo 設定がオフ、許可が `default` / `denied`、または API 非対応なら `disabled` にし、状態に応じた次の操作を近くに表示する。通知許可ボタン自体は Pomdo のオン / オフとは独立させる。
- スイッチは読み上げ可能な名前・状態を持たせ、許可状態と案内を `aria-describedby` 等で関連付ける。状態更新は読み上げ可能にし、Tab / Space の操作と既存 focus-visible 表示を保つ。
- 新しい日本語文言は `src/messages.ts` の `messages.settings` にまとめる。状態名、許可操作、ブロック中の案内、非対応の案内、テスト操作、テスト失敗、保存失敗を含める。

## 変更対象ファイル

| ファイル | 変更 |
| --- | --- |
| `src/lib/notifications.ts` | localStorage 設定の読み書き、許可状態の取得・明示要求、完了種別ごとの通知、複数タブ claim、タイトル変更との分離を実装。初回 Focus からの自動許可要求を削除する。 |
| `src/lib/notifications.test.ts` | 新規作成。既定オン、永続化、許可状態、旧要求済みキーの無視、設定に応じた通知可否、通知生成失敗、claim による同一完了の抑止を検証する。 |
| `src/components/app/AppPage.tsx` | Focus / Break 完了時に種別と実行識別子を通知処理へ渡す。Focus 開始時の `requestNotificationPermissionOnce()` 呼び出しを削除する。音・タイトル・完了記録・遷移を通知可否から独立させる。 |
| `src/components/settings/SettingsPage.tsx` | `SettingsContent` に通知設定セクション、許可状態の再読込、明示許可、通知テストを追加する。サーバー設定 mutation は使わない。 |
| `src/messages.ts` | 通知設定、4 種類の許可状態、許可方法、テスト、失敗状態の表示文言を追加する。 |
| `tests/e2e/issue175-notification-settings.spec.ts` | 新規作成。Issue のユーザー操作シナリオ、複数タブ、許可状態、アクセシビリティを Chromium E2E で検証する。 |
| `CONTEXT.md` | 現在「完了通知設定」「ブラウザ通知の許可」が定義済み。追加・変更は不要。実装後に設定の保存範囲と定義が一致するか確認する。 |

DB schema、repository、router、migration、Service Worker、Web Push、`package.json` に変更を加えない。新しい依存パッケージも追加しない。

## 利用 API とバージョン

この機能で使う通知・保存・排他 API はブラウザ標準 API であり、npm ライブラリを追加しない。インストール固定値は `package-lock.json` で確認済み。

| API | 現在の正しい利用形 | バージョンと一次情報 |
| --- | --- | --- |
| Notifications API | `Notification.permission` を読み、設定ボタンのユーザー操作中に Promise 形式の `Notification.requestPermission()` を呼ぶ。許可後は `new Notification(title, { tag })` で通知する。許可要求はページ表示時や Focus 開始時に呼ばない。 | ブラウザ標準 API。Notifications API Standard: https://notifications.spec.whatwg.org/ 。ユーザー操作・モバイルでの constructor 制限: https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API |
| Web Locks API | `navigator.locks.request(lockName, async () => { ... })` のコールバック内で claim の確認・保存と通知生成を行う。既定の排他モードを使う。 | ブラウザ標準 API。https://w3c.github.io/web-locks/#dom-lockmanager-request 。HTTPS と localhost の secure context で動かす。 |
| Web Storage / StorageEvent | 同一オリジンの `localStorage.getItem()` / `setItem()` で設定と claim を保持し、他タブでは `window.addEventListener('storage', ...)` で設定キーの変更を読む。変更したタブ自身は state を直接更新する。 | WHATWG HTML Standard: https://html.spec.whatwg.org/multipage/webstorage.html 。 |
| Page Visibility / pageshow | `document.visibilityState === 'visible'` の `visibilitychange` と `window` の `pageshow` で許可状態を読み直す。 | WHATWG HTML Standard: https://html.spec.whatwg.org/multipage/interaction.html#page-visibility 。 |
| `radix-ui` Switch | lockfile の `radix-ui@1.6.7` と現行 `SettingsPage.tsx` に合わせ、`Switch.Root` の `checked` / `onCheckedChange` と `Switch.Thumb` を使う。 | 導入済み `radix-ui@1.6.7`。Radix 公式 API: https://www.radix-ui.com/primitives/docs/components/switch 。 |
| TypeScript DOM 型 | DOM 型から `NotificationPermission`、`Notification.requestPermission()`、`LockManager` を利用し、新しい API 型定義を追加しない。 | lockfile の `typescript@5.9.3`。 |
| Playwright | テスト用 context に `grantPermissions(['notifications'])` を設定し、`page.clock.install({ time })` / `page.clock.runFor(...)` でタイマーを進める。 | lockfile の `@playwright/test@1.58.2`。https://playwright.dev/docs/api/class-browsercontext#browser-context-grant-permissions 、https://playwright.dev/docs/clock 。 |

実装時に API を別ライブラリの API へ置き換えない。特に `Notification.requestPermission()` を deprecated callback 形式で呼ばない。

## テスト方針

### Unit: `src/lib/notifications.test.ts`

- localStorage 未設定時はオン、保存後は同一ブラウザで復元され、`false` 以外の未定義・不正値で意図せずオフにならない。読み書きが失敗したときは完了通知を送らず、タイマー処理は継続する。
- `granted` / `default` / `denied` / Notification API 非対応を別々に識別する。
- 古い `pomdo-notification-permission-requested=true` が残っても、明示要求は実行される。Focus 開始向けの自動要求関数は残さない。
- Focus / Break の通知文言が異なり、設定オフまたは未許可なら通知を作らない。通知生成が throw しても helper が例外を外へ投げない。
- 同じ完了識別子で並行して通知要求を行っても claim が一度だけ成功する。完了時オフだった通知を後からオンにしても、遅れて処理する別タブから通知が出ない。lock が取得できない場合にタイマー側へ例外を伝えない。
- 完了通知を抑止してもタイトル更新の処理を独立して呼べる。

### E2E: `tests/e2e/issue175-notification-settings.spec.ts`

Playwright の通知権限設定または `Notification` の制御可能なテスト double を使い、OS の通知 UI に依存しないようにする。実際のブラウザサイト設定変更はブラウザ操作確認にも含める。

1. 空の localStorage と `default` 許可状態で `/app` を開く。Focus 開始では許可要求が出ず、設定画面の「通知を許可」クリックだけが要求する。旧要求済みキーありでも同じ結果にする。
2. `granted` と Pomdo オンで Focus を完了させ、「集中セッションが終わりました」が通知される。ページが visible の場合と別ページを前面にした場合を確認する。
3. Break 完了では「休憩が終わりました」が出る。
4. Focus / Break 実行中に別タブで Pomdo 設定をオフにし、完了時は通知が出ない一方、完了 API / 記録、サイクル、音、タイトル変更は通常どおりである。
5. 同一 runtime を2タブで完了させ、通知の生成回数が全体で最大1回である。
6. Pomdo 設定をオフにした後、匿名アカウントからテスト用認証済みアカウントへ切り替えてもオフが保たれ、完了通知設定を保存する `settings.update` リクエストが発生しない。
7. 通知テストは許可済みかつオンで1回出る。テスト前後で runtime、完了音の呼び出し、`document.title` が変わらない。オフ / `default` / `denied` / 非対応ではボタンが無効で、次の操作が読める。
8. 許可状態をテスト double 上で変更し、ページを visible に戻すと再読み込みなしで表示が変わる。
9. Focus 中断と Break スキップでは通知が出ない。
10. キーボードだけでスイッチ・許可・通知テストを操作し、名前・状態・disabled が読み上げ可能で、フォーカスリングが見える。

## ブラウザでの操作確認

1. 実行中サーバーが別 worktree のコードでないことを、5173 / 8788 の待受プロセスと作業ディレクトリで確認する。必要なら現 worktree の E2E 開発サーバーを起動する。`scripts/start-e2e-server.mjs` は `.dev.vars` の `DATABASE_URL` を使うため、Preview / Production の URL を設定しない。
2. Playwright CLI で `http://localhost:5173/app` を開く。通知許可が default の新規ブラウザプロファイルを使い、Focus を開始してもブラウザの許可ダイアログが出ないことを確認する。
3. 設定へ移動し、完了通知スイッチが初期オンであること、許可状態が default と表示されることを確認する。「通知を許可」を選びブラウザで許可した後、同画面に戻ると granted 表示へ更新されることを確認する。
4. 「通知テスト」を押す。ブラウザ通知の文面は「Pomdoの通知テストです」で、Focus の残り時間・音・タブタイトルは変わらない。Pomdo 側をオフにするとボタンが disabled になり、再度オンにすると許可済み状態で実行できる。
5. Focus と Break をそれぞれ完了させ、対応する文面の通知を確認する。実行前に別タブを開いて一方をバックグラウンドにし、どちらの可視状態でも通知 API が呼ばれること、同一完了につき1回だけであることを確認する。
6. サイト設定で許可を denied にして Pomdo へ戻る。再読み込みなしで denied 表示になり、再要求ボタンが出ず、サイト設定から戻す案内が表示されることを確認する。許可を戻したケースでも画面が granted に更新されることを確認する。
7. Focus を中断し、Break をスキップする。いずれもブラウザ通知が出ない。通知をオフにした完了では通知だけが抑止され、既存の音・タイトル・記録・遷移が維持される。
8. Tab / Space でスイッチを操作し、各ボタンのフォーカス表示と読み上げ可能な状態を確認する。mobile 幅でも設定画面が横にはみ出さないことを確認する。

通知 API が存在しても、ブラウザや OS によって foreground 表示の扱いが異なる。テストでは通知 API 呼び出しを検証し、実機確認では OS の表示も確認する。Service Worker に依存するモバイル環境の通知は今回の対象外であり、constructor 失敗は捕捉してタイマーを継続する。

## 品質管理

ルート `CLAUDE.md` の順序を変えずに実行し、失敗した工程を隠して次へ進まない。この作業環境の RTK 運用指示に従い、シェル実行では各コマンドの先頭に `rtk` を付ける。例えば `rtk npm run lint`。

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --run`
5. `npm run test:coverage`
6. `npm run build`
7. `npm run test:e2e -- --project=chromium`
8. Playwright CLI で現 worktree の実画面を操作する。
9. light / dark / system、mobile / desktop、keyboard、reduced-motion / transparency、network断を確認する。
10. `rtk git diff --check`、旧参照検索、secret 混入確認を行う。旧参照検索では `requestNotificationPermissionOnce` と `pomdo-notification-permission-requested` の利用箇所を確認し、新実装の許可要求を塞いでいないことを確かめる。

## 完了条件

- Issue の受け入れ条件と、Issue 本文の8シナリオおよび追加したアカウント共有・アクセシビリティ確認を満たす。
- ブラウザ許可と Pomdo の設定を別々に表示し、設定は同一ブラウザ内だけに保存する。
- 同じ Focus / Break 完了から複数タブで通知を作らない。
- 通知 API や localStorage の失敗でタイマー記録・音・タイトル・遷移を失わない。
- DB / API / migration / Service Worker / Web Push の差分がない。
