# Issue #157 実装計画: UI文言・アイコン色・振り返り見出し・LP動画

## 対象

- Issue: [#157 UI改善: `/app`の文言・設定アイコン・振り返り見出し・LPデモを更新する](https://github.com/koshiro222/pomdo/issues/157)
- スコープ: Issue 全体
- 目的: `/app` の表示用語を揃え、設定アイコンの色をテーマ切り替えアイコンに合わせ、振り返りページの見出しを簡潔にし、LPの操作式タイマーデモを指定された公開動画に置き換える。

## 現状と設計上の判断

- `/app` の共通ラベルは `src/messages.ts` にある。Nowが空の案内は `src/components/app/NowCard.tsx`、集中開始前にタスクを選ぶ文言は `src/components/app/AppPage.tsx` に直接書かれている。
- `src/components/tasks/TaskList.tsx` は `messages.app.onDeck` を見出しに使い、内部では `onDeck` / `sortOnDeck` を使う。画面上の見出しだけを `Next` にし、`CONTEXT.md` のドメイン用語 `On Deck` と既存の内部識別子は変えない。
- 設定リンクとテーマ切り替えは `src/components/layout/AppHeader.tsx` 内にあり、`src/components/theme/ThemeToggle.tsx` は `var(--color-base-content)` を前景色に使う。一般の `.iconbtn` は `src/components/tasks/TaskRow.tsx` のタスクメニューでも使われるため、色の変更は設定リンクだけに限定する。
- 振り返りページの見出しと集計表示は `src/components/review/ReviewPage.tsx` にある。今回変えるのは kicker と h1 の表示だけで、queryや集計結果は維持する。
- LPのデモは `LandingPage` 内の `TimerDisc`、`demoSeconds` state、range input で構成されている。`useEffect` と `useRef` はスクロール時の reveal 表示にも使われているため、動画置換後も reveal 処理には残す。
- LP動画は指定された公開R2 URLをブラウザーから直接読み込む。R2 binding、環境変数、サーバーAPI、DB変更、動画ライブラリは追加しない。

## 変更後の仕様

### `/app` の表示文言

| 表示箇所 | 現在 | 変更後 |
| --- | --- | --- |
| Now欄の見出し | `今これをやる` | `Now` |
| 待機中タスク欄の見出し | `On Deck` | `Next` |
| タスクメニューのNow移動操作 | `今これにする` | `Move to Now` |
| Nowが空の案内 | `On Deck から1つ選ぶか、このまま集中できます。` | `Next から1つ選ぶか、このまま集中できます。` |
| Just Focus選択中のタスク選択肢 | `On Deckから1つ選ぶ` | `Nextから1つ選ぶ` |

`Next` はこの画面で待機中タスクを指す短い表示名とする。タスクのToday状態、Nowへの移動条件、並び順、API名、props、保存データは変えない。`CONTEXT.md` の `On Deck` 定義も変更しない。

### 設定アイコン

- `/app` の設定ギアを、ライト・ダーク両テーマで隣の `ThemeToggle` と同じ前景色にする。
- 通常時とホバー時の色を揃える。CSS変更は設定リンクに限定し、タスクメニューの `.iconbtn` の色は維持する。
- リンクのアクセシブルネーム `設定`、`/app/settings` への遷移、既存のキーボードフォーカス表示を維持する。

### 振り返りページ

- 「今日を振り返る」の kicker を削除する。
- h1 を `今日の振り返り` にする。
- 合計集中時間、完了したFocus数、直近7日のグラフ、完了タスク、Focused Daysの表示と取得処理を維持する。

### LP動画

- `TimerDisc` による操作式デモと残り時間 range input を削除し、次の動画をLP内に表示する。
  - `https://pub-7e2638ec617c45a7a55b30232114a3a0.r2.dev/pomdo-demo.mp4`
- 通常のモーション設定では、ページ表示時にミュートで自動再生し、ループさせ、モバイルでもページ内再生する。動画コントロールは表示しない。
- `prefers-reduced-motion: reduce` では自動再生しない。静止プレビューを表示し、適切なプレビュー素材がなければ、既存のLP説明文を使った動画の代替表示にする。新しい画像素材は追加しない。OS設定が表示中に切り替わって reduce になった場合も再生を止める。
- 動画の読み込み失敗時は代替表示を出す。動画要素を扱えないブラウザー向けにも、要素内のフォールバック内容を用意する。LP本文、CTA、他のリンクはそのまま利用できる。
- 動画は自然な縦横比を維持し、画面幅に合わせて縮小する。既存のLPセクションやCTAの配置を壊さない。
- 動画に内容が分かるアクセシブルネームを付ける。

## 維持する境界

- `Task`、`Focus Session`、ユーザー設定、振り返りデータの作成・更新・削除を行わない。
- `Move to Now` は既存の `tasks.moveToNow` 操作を使い、TodayタスクをNowへ移す対象条件・順序・保存動作を変えない。
- `TaskList` の `onDeck` prop、`sortOnDeck`、tRPC/API/routerの名前や処理、サーバー側の文言は変更しない。
- アプリ全体の英語化、i18n導入、今回指定されていないコピー・LPセクションの刷新を行わない。
- Issue #153は再オープン・自動クローズしない。#153で対象外だったLPスライダーについては、本Issue #157の決定を適用する。

## 実装手順

1. `CONTEXT.md`、`docs/adr/0001-stay-on-cloudflare-pages-edge.md` と本計画の対象ファイルを読み、現在のUI、ドメイン用語、Edge実行環境の境界を確認する。これら2つの設計文書は参照用であり、今回編集しない。
2. `src/messages.ts` の `app.now`、`app.onDeck`、`task.moveToNow` を指定文言に更新する。`TaskList.tsx` は見出しに同じmessage値を表示しているので、見出しのためだけの内部名変更は加えない。
3. `NowCard.tsx` の空状態案内と `AppPage.tsx` のJust Focus時の選択肢を `Next` 表記にする。選択肢から `taskList.onDeck[0]` を開始する既存処理は維持する。
4. `AppHeader.tsx` の設定リンクに限定できるクラスまたはセレクターを用意し、`src/index.css` で `ThemeToggle` と同じ `var(--color-base-content)` を使う。一般の `.iconbtn` ルールを書き換えない。
5. `ReviewPage.tsx` からkickerを取り除き、h1を `今日の振り返り` にする。query、集計式、残りの表示は変更しない。
6. `LandingPage.tsx` から `TimerDisc`、`demoSeconds` state、range inputを取り除き、指定URLの動画表示に置き換える。reveal用の `useEffect` / `useRef` は残す。
7. `window.matchMedia('(prefers-reduced-motion: reduce)')` の初期値と変更イベントを購読し、reduce時は自動再生しないで静止プレビューまたは代替表示を出す。変更イベントはcleanupし、reduceへの切り替え時は再生中の動画に `pause()` を呼ぶ。動画の `error` イベントでは失敗状態を表示し、要素を扱えないブラウザーには要素内のフォールバック内容を提供する。いずれの場合もページ内の他の操作を妨げない。
8. `.demo-card` の動画向けCSSを追加・整理し、動画の幅をコンテナ内に収めて自然な縦横比を保つ。旧円盤・range専用のスタイルを削除し、他ページで使われる汎用セレクターには影響させない。
9. unit / E2Eテストを更新・追加し、下記の品質手順を先頭から順に実施する。

## 変更対象ファイル

### アプリケーション

- `src/messages.ts`: Now、Next、Move to Now の共通表示文言を更新する。
- `src/components/app/NowCard.tsx`: Nowが空のときの案内を `Next` 表記にする。
- `src/components/app/AppPage.tsx`: Just Focus選択中に表示されるタスク選択肢を `Next` 表記にする。選択動作と `taskList.onDeck` 参照は維持する。
- `src/components/layout/AppHeader.tsx`: 設定リンクに、色を限定して調整できるクラスを付ける。リンク先、aria-label、表示条件は維持する。
- `src/components/review/ReviewPage.tsx`: 不要なkickerを削除し、h1を更新する。
- `src/components/landing/LandingPage.tsx`: 操作式円盤デモを動画に置き換え、reduced-motionと動画エラーを処理する。不要になるTimerDisc importとdemoSeconds stateを削除する。
- `src/index.css`: 設定リンクのテーマ色と、動画のレスポンシブ表示・失敗時の代替表示を整える。タスク行アイコンとLPの他のレイアウトは維持する。

次のファイルは現状確認に使う。Issueの範囲では変更しない。

- `CONTEXT.md`: `On Deck` のドメイン上の意味を確認する。
- `docs/adr/0001-stay-on-cloudflare-pages-edge.md`: Edge実行環境とサーバー境界を確認する。
- `src/components/tasks/TaskList.tsx`: `Next` 見出しと内部 `onDeck` 名の関係を確認する。
- `src/components/tasks/TaskRow.tsx`: `Move to Now` 表示と既存callbackを確認する。
- `src/components/theme/ThemeToggle.tsx`: 設定ギアと一致させる前景色を確認する。

### テスト

- `src/components/tasks/TaskRow.test.tsx`: `今これにする` の期待値を `Move to Now` に更新し、callbackが従来どおり1回呼ばれることを維持する。
- `src/components/review/ReviewPage.test.tsx`: 新しいh1とkickerがないことを確認し、既存の集計表示も確認する。
- `src/components/landing/LandingPage.test.tsx`（新規）: `MemoryRouter` と `src/components/theme/ThemePreferenceProvider.tsx` の `ThemePreferenceProvider` の中で描画する。動画URLとミュート・ループ・インライン再生・controls非表示、通常時の自動再生属性、reduced-motion時の静止表示、error時の代替表示、動画要素内のフォールバック内容、CTA継続を確認する。`matchMedia` をstubし、reduceへの変更時に `pause()` が呼ばれ、cleanup時にchange listenerが解除されることを確認する。jsdomの未実装mediaメソッドは必要に応じてmockする。
- `tests/e2e/v1-ui-improvements.spec.ts`: 旧Review h1の期待値を更新する。ライト・ダークそれぞれで設定ギアの色がThemeToggleと一致し、ホバー・Tabフォーカスが保たれること、LP動画の表示とreduced-motion・読み込み失敗時の挙動を加える。
- `tests/e2e/v1-bootstrap-focus.spec.ts`: `/app` のNow/Next表示、NextタスクのメニューからのMove to Now、Now空状態の案内と `Nextから1つ選ぶ` を確認する。移動後のNowと既存のFocus操作が成立することを確認する。

## ブラウザーAPIと一次資料

追加ライブラリは使わない。現在の `package-lock.json` ではReact / React DOM 19.2.4が解決されており、動画は標準のHTML `<video>` 要素とReact DOMの組み込みpropsで表現する。

- 動画要素: React DOM `src`、`autoPlay`、`muted`、`loop`、`playsInline`、`controls`、`onError` — [React DOM 共通コンポーネント API](https://react.dev/reference/react-dom/components/common)、[WHATWG HTML Standard: video element](https://html.spec.whatwg.org/multipage/media.html#the-video-element)
- モーション設定: `window.matchMedia()` と `MediaQueryList` の `change` イベント — [W3C CSSOM View: matchMedia](https://www.w3.org/TR/cssom-view/#dom-window-matchmedia)、[W3C Media Queries Level 5: prefers-reduced-motion](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion)
- 追加依存、R2 binding、動画用サーバー処理は不要。

## テスト方針

### unit / component

- 共通文言を使う `TaskRow` が `Move to Now` を表示し、選択時に既存callbackを呼ぶことを確認する。
- `ReviewPage` が新しいh1を表示し、旧kickerを表示せず、集計値・グラフ・完了タスク欄を従来どおり表示することを確認する。
- `LandingPage` は外部動画URLへのネットワークアクセスに依存させず、`src/components/theme/ThemePreferenceProvider.tsx` の既存providerと `MemoryRouter` で描画して要素属性をDOMで確認する。`matchMedia` をstubして通常設定 / reduce設定を切り替え、reduceでは自動再生しないこと、`pause()` が呼ばれること、既存の説明文を使った静止代替表示があることを検証する。動画のerrorイベントを発火し、代替表示と動画要素内のフォールバック内容があり、CTAも表示されることを確認する。

### E2E

- `/app` でUIラベルとMove to Now操作後の状態を実ブラウザーで確認する。文言変更がToday / Nowの動作やFocus開始を変えていないことを確認する。
- テーマ属性をlight (`corporate`) / dark (`business`) に切り替え、設定リンクとThemeToggle内のアイコンから得るcomputed `color` が一致することを確認する。設定リンクのhover色も比較し、Tabキーでフォーカス表示を確認する。
- `/app/review` でh1と集計表示を確認する。
- `/` でvideoの `src`、`muted`、`loop`、`playsInline`、`controls` の状態を確認し、残り時間sliderがないことを確認する。安定したE2Eにするため動画リクエストはrouteで成功応答または失敗を制御し、実際のR2配信確認は手動ブラウザー確認で行う。動画要素内に非対応ブラウザー向けフォールバック内容があることも確認する。
- reduced-motionはページ表示前と表示中の両方で切り替え、自動再生の停止と代替表示を確認する。

## ブラウザーでの手動確認

実装元の作業ディレクトリから配信されていることを確認する。サーバーが起動していない場合は、リポジトリの通常の開発手順でこのcheckoutを起動する。幅390pxのmobile viewportと幅1440pxのdesktop viewportで以下を確認する。

1. `/app` を開く。Now見出しが `Now`、待機中タスク見出しが `Next` と表示され、タスク行のメニューに `Move to Now` があることを確認する。
2. Nextのタスクで `Move to Now` を選ぶ。対象タスクだけがNowに移り、残るタスクの順序、Task編集・完了、Focus開始が従来どおり使えることを確認する。
3. Nowを空にする。案内に `Next` が表示され、Just Focusの選択肢が `Nextから1つ選ぶ` になっていることを確認する。選択後に先頭のNextタスクからFocusを開始できることを確認する。
4. `/app` でlight / darkを切り替える。設定ギアとThemeToggleの色が一致すること、ギアのhover色も一致すること、Tabで設定リンクに移動したときフォーカス表示が見えることを確認する。タスクメニューのアイコン色も変更されていないことを確認する。
5. `/app/review` を開く。h1が `今日の振り返り` で、「今日を振り返る」がなく、合計集中時間・完了Focus・7日グラフ・完了タスク・Focused Daysが表示されることを確認する。
6. `/` を開く。指定R2 URLから動画が読み込まれ、ミュートで自動再生・ループし、モバイルではページ内再生されること、controlsと旧sliderがないことを確認する。動画の縦横比が保たれ、ページに横スクロールが発生しないことも確認する。
7. reduced-motionを有効にして `/` を再表示する。動画が自動再生されず静止プレビューまたは代替表示になることを確認する。通常表示中に設定をreduceへ変えた場合も動画が停止することを確認する。
8. 開発者ツールで動画URLをブロックするかE2Eの失敗routeを使う。動画の代替表示が出ても、LPのCTAから `/app` へ進め、フッターリンクも利用できることを確認する。

## CLAUDE.md 品質管理手順

コード実装後、ルート `CLAUDE.md` の順序を変えず、失敗を隠さずに実行する。

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --run`
5. `npm run test:coverage`
6. `npm run build`
7. `npm run test:e2e -- --project=chromium`
8. Playwright CLIで実画面を操作する
9. light / dark / system、mobile / desktop、keyboard、reduced-motion / reduced-transparency、ネットワーク断を確認する
10. `rtk git diff --check`、旧参照検索、secret混入確認を行う

この計画書だけを作成する段階ではアプリコードを変更しないため、上記のアプリ品質コマンドは実装時に実行する。

## 完了条件

- Issue #157の全受け入れ条件を満たす。
- `/app` の対象箇所だけが指定のNow / Next / Move to Now表記になり、ドメインモデルや保存データに変更がない。
- ギア色は両テーマとhoverでThemeToggleに一致し、リンク名・遷移・フォーカスが保たれる。
- Reviewの新しいh1と従来の集計表示が両方確認できる。
- LPの指定動画、通常時の再生条件、reduced-motion時の停止、失敗時の代替表示、mobile / desktopのレイアウトを確認できる。
- unit、E2E、品質管理、手動ブラウザー確認で退行がない。動画の読み込み失敗と非対応ブラウザーの両方で代替内容があり、LPのCTAが使える。
