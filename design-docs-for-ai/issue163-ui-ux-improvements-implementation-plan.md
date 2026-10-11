# Issue #163 実装計画: UI/UX改善

- Issue: https://github.com/koshiro222/pomdo/issues/163
- 対象スコープ: Issue 全体
- 作業ブランチ: `feature/163-ui-ux-improvements`
- Issue コメント: 取得済み。コメントなし。

## 目的と確定要件

ブラウザで Pomdo を使う際の横幅を改善し、ダークテーマを daisyUI の `night` に切り替え、振り返りに当年の日別集中時間カレンダーを追加する。Issue で合意した内容は次のとおり。

- テーマ設定 `dark` は daisyUI `night`、`light` は現状どおり `corporate`。`system / light / dark`、OS追従、保存・復元は維持する。
- 振り返りにはユーザーのタイムゾーンにおける当年1月1日から12月31日までを表示する。年切替は設けない。
- 日ごとの集中時間には Completed と Interrupted の両方を含める。完了 Focus 本数の意味は変えず Completed だけを数える。
- マスの集中時間レベルは固定境界とする。0秒、1〜1799秒、1800〜3599秒、3600〜7199秒、7200秒以上の5段階。未来の日は実績0秒と区別する。
- 過去または今日に実績がある日を選択すると、日付と集中時間を表示する。今日の統計、完了タスク、Focused Days は残し、直近7日の棒グラフを年次カレンダーに置き換える。
- アプリ本体と振り返りの横幅を広げ、狭い画面では横はみ出しを発生させない。

## 現状と設計方針

### 既存のデータ経路

`src/server/routers/review.ts` の `review.summary` は `protectedProcedure.query` で、認証済みユーザーについて Focus Session、Task、日別Focus集計を取得する。今日の日付は `ctx.now` と `ctx.user.timezone` から `formatTaskCalendarDate` で求める。`listDailyFocusSummaries` はユーザーIDで絞り、PostgreSQL の `started_at AT TIME ZONE users.timezone` で日別に集計する。集計には Completed / Interrupted 双方の `duration_secs` が入り、完了本数は `completed_at IS NOT NULL` だけを数える。

`src/server/services/review-service.ts` には日付文字列のタイムゾーン変換、当日集計、Focused Days の集計がある。`ReviewPage` は `trpc.review.summary.useQuery` の型推論結果から今日の統計、直近7日、完了タスク、Focused Days を表示する。

### 選択する実装

1. DBスキーマ、Focus Session の保存規則、Task の保存規則は変更しない。既存の `listDailyFocusSummaries` のユーザー別・ローカル日付集計を再利用し、サービス層で当年の日付を全件そろえる。ユーザーの当年は、サーバーから返す `todayDate`（ユーザーのローカル日付）の年で決める。端末のローカル時刻から年を推定しない。
2. `review.summary` の応答に `todayDate` と `calendarDays` を加える。`calendarDays` は当年の全日を昇順に含む固定長配列で、各要素は既存の `DailyReviewSummary`（`date`, `totalFocusSecs`, `completedFocusCount`, `interruptedFocusCount`）を使う。閏年は366日、それ以外は365日。集計がない日も0値で生成する。既存の `days`（直近7日）は不要になるため削除する。
3. 日付配列を共通入力にする新規 `AnnualReviewCalendar` モジュールを作る。幅768px以上は日曜始まり・週列のヒートマップ、767px以下は月ごとの7列グリッドにする。両方の見た目は同じ日別データ・色レベル・選択状態を使い、携帯幅で53〜54週分の細い操作領域や横スクロールを作らない。年の最初と最後の週を埋める年外のセルは空欄として扱い、日付データに含めない。
4. 集中時間の詳細はブラウザー状態だけで表示する。過去または今日で集中時間が0秒より大きいマスを選ぶと、カレンダー下の詳細領域に日付と `totalFocusSecs` を分単位で表示する。未来日は非選択の淡い表示にし、過去の0秒の日と区別する。マスのボタン名にも日付と集中時間を含め、色だけに意味を依存しない。
5. `src/index.css` の現在の `--maxw: 528px` はヘッダー、`.app-wrap`、`.page-shell`、`.sheet` が共有する。`--content-maxw: 960px` と `--sheet-maxw: 528px` に分け、前者をヘッダーとページ本文、後者をシートに使う。これにより詳細シート/ボトムシートが画面幅いっぱいに不必要に広がる副作用を避ける。`.page-shell` を使う設定画面と状態画面も同じ本文幅を使う。モバイルでは既存の左右パディングを保ち、最大幅を超えない。

960pxはデスクトップ上で年間週グリッドを読み取れる横幅を確保しながら、既存の528pxから一気に画面全幅へ拡大しないための上限とする。既存画面のカード幅やタイマー中央寄せを保ち、全幅化はしない。

## 変更対象ファイル

### 既存ファイル

| ファイル | 変更内容 |
| --- | --- |
| `src/lib/theme.ts` | `DaisyTheme` の暗色候補を `business` から `night` にし、`resolveDaisyTheme('dark')` が `night` を返すようにする。`system`、`light`、保存キー、設定値は変更しない。 |
| `src/lib/theme.test.ts` | 暗色解決結果と `applyTheme('dark')` の `data-theme="night"` を検証する。`system` が属性を外してOS設定に任せること、ライトが `corporate` のままであることも維持確認する。 |
| `src/index.css` | daisyUI のテーマ一覧を `corporate --default, night --prefersdark` に更新する。ヘッダーとページ本文の上限を960pxに変更する。`.sheet` は新しい528pxのシート上限を使う。年次カレンダーの週表示、月表示、5段階の色、未来日、選択詳細、フォーカス表示のスタイルを追加する。 |
| `src/server/services/review-service.ts` | `DailyReviewSummary[]` と当年を受ける新規 `buildCalendarYearSummaries` を追加し、日付順の全日分を返す。欠落日を0値で埋め、閏年と週グリッドの前後パディングに依存しない日付生成にする。年間配列を作るため `summarizeRecentSevenDays` は削除する。 |
| `src/server/services/review-service.test.ts` | `buildCalendarYearSummaries` の日付数、閏年の2月29日、年初/年末、日付順、既存集計の反映、欠落日の0値を検証する。週次集計を削除しても、`summarizeToday` の日付境界テストでタイムゾーンと Interrupted の合算を維持確認する。 |
| `src/server/routers/review.ts` | 既存のタイムゾーン集計を維持し、ユーザーの `todayDate` と `calendarDays` を返す。7日配列 `days` は返さない。Focused Days と完了タスクの処理はそのままにする。 |
| `src/components/review/ReviewPage.tsx` | 今日の統計、完了タスク、Focused Days を維持し、旧週次グラフを `AnnualReviewCalendar` に置き換える。日付・当年はAPI応答を使う。 |
| `src/components/review/ReviewPage.test.tsx` | `review.summary` のモックを `todayDate` と365/366日の `calendarDays` に更新する。統計を維持し週次グラフが消えること、年次カレンダーを表示することを検証する。テーマ設定テストの期待値を `night` に変える。 |
| `tests/e2e/v1-review.spec.ts` | 直近7日を前提にした見出し・グラフ検証を年次カレンダーに更新する。Focus記録後に当年の正しい日へ集計され、その日の詳細が読めることを確認する。 |

### 新規ファイル

| ファイル | 内容 |
| --- | --- |
| `src/components/review/AnnualReviewCalendar.tsx` | `todayDate` と `calendarDays` を受け取り、レスポンシブな年次カレンダー、凡例、選択日の詳細を描画する独立した表示モジュール。props型は `AppRouter` から `inferRouterOutputs` で導出し、サーバーの応答型を重複定義しない。日ごとの強度判定、未来日の判定、週/月の並び替えをここに閉じ込める。 |
| `src/components/review/AnnualReviewCalendar.test.tsx` | 色境界（0、1799/1800、3599/3600、7199/7200秒）、未来日の区別、日付選択と詳細、キーボード操作、年外の空セルを検証する。 |

依存ライブラリの追加やDBマイグレーションは行わない。Issue計画ファイル自体は `design-docs-for-ai/` に置くリポジトリ成果物であり、`.gitignore` には追加しない。

## 実装手順

### 1. 年次集計のドメイン関数

- 新規 `buildCalendarYearSummaries(dailySummaries, year)` は対象年の1月1日から12月31日までの日付を生成し、入力として受けた日別集計を該当日に対応付ける。
- 日付計算はローカル環境のタイムゾーンに依存させない。既存サービスにある UTC の日付移動方法を再利用し、`YYYY-MM-DD` の日付文字列として返す。
- DBの集計日をMapにし、該当日は値を埋め、存在しない日は `totalFocusSecs: 0`, `completedFocusCount: 0`, `interruptedFocusCount: 0` を設定する。
- 年引数は整数で扱い、年の1/1・12/31の外のレコードを返却しない。
- 年はサーバーで求めた `todayDate.slice(0, 4)` を使う。`new Date()` やクライアントの時計を別途参照しない。

### 2. tRPC応答

- `review.summary` の認証済みユーザー絞り込みと既存Promise並列取得を保つ。
- `todayDate` は既存の `formatTaskCalendarDate(ctx.now, ctx.user.timezone)` の結果。
- `calendarDays` は上記関数に `dailySummaries` と `todayDate` 由来の年を渡して作る。
- 既存の今日のSQL要約、`countFocusedDays(sessions, timezone)`、`listTasksCompletedOnDate` は変えない。年次カレンダーはセッションを作成・変更しない。
- 既存の `listDailyFocusSummaries` はすでにユーザー単位・タイムゾーン単位で全期間を日別集約しているため再利用する。新しい全セッション取得やN+1クエリ、DB列、インデックスを追加しない。ネットワーク応答としてクライアントに返す日は当年分だけにする。

### 3. 年次カレンダーモジュール

- Desktop週表示は日曜始まりで曜日ラベルは日〜土。1月1日の曜日に合わせて前方に空セルを置き、12月31日後も週末まで空セルを置く。年によって53週または54週になるため列数を53に固定しない。54週になる2000年を単体テストに含める。
- 768px以上では日曜始まりの週列グリッド、767px以下では同じ日別配列から1月〜12月の月別グリッドを描画する。月表示はCSSブレークポイントで切り替え、いずれも7曜日列と日付の意味を保つ。年外セルは操作不可かつ支援技術から隠し、非表示レイアウトの重複コンテンツもアクセシビリティツリーに出さない。
- 今日の日付より後のセルは実績0秒のセルとは異なるクラス・境界線・凡例で示し、選択不可とする。年外のパディングセルは日付セルとして公開しない。
- 集中時間レベルの判定は秒を直接使い、0秒、1〜1799秒、1800〜3599秒、3600〜7199秒、7200秒以上に分類する。色は daisyUI のテーマ変数を基に濃淡を作り、凡例に各範囲をテキストで表示する。
- 実績のある過去/今日の日だけを `<button>` にする。ボタンには完全な日付と集中時間を含むアクセシブルな名前、視認できる `:focus-visible` 表示を付ける。クリック、Enter、Space のいずれでも同じ詳細表示にする。
- 選択がない初期状態では日付詳細を空にし、選択後は日付と `totalFocusSecs` を既存と同じ分表示に変換して表示する。別の日を選んだら内容を更新する。
- 月/週の描画は `calendarDays` のみから導出する。重複した日付集計をクライアントで計算しない。

### 4. テーマとレイアウト

- daisyUI設定のテーマ名を `business` から `night` に変更し、`resolveDaisyTheme` の返却型も更新する。`applyTheme('system')` の `data-theme` 削除と `localStorage` は変更しない。
- `:root` に `--content-maxw: 960px` と `--sheet-maxw: 528px` を定義する。`.appbar-inner`, `.app-wrap`, `.page-shell` は `--content-maxw`、`.sheet` は `--sheet-maxw` を参照し、中心軸を合わせる。
- カレンダー表示切替のCSSブレークポイントは768pxとする。既存の560px左右パディング規則を壊さないよう、767px以下で月表示、768px以上で週表示にする。
- `box-sizing: border-box` と既存の16px左右パディングを維持する。小さい viewport で本文に固定幅・最小幅を設定しない。
- スタイルは `--color-primary`, `--color-base-100`, `--color-base-200`, `--color-base-300` 等のテーマ変数を使う。色の判別を支援技術向けテキストの代替にしない。

### 5. テスト更新

- 年次集計の単体テストは `src/server/services/review-service.test.ts` に追加する。2024年の366日と2月29日、通常年365日、年境界、入力にある集計値、ない日の0値を検証する。既存の週次配列テストは削除するが、`summarizeToday` に `2026-01-02T14:59:59Z` と `2026-01-02T15:00:00Z` のセッションを与え、Asia/Tokyo の1月2日/3日に分かれること、Interrupted 時間も合計に含まれることを残す。
- UIの純粋な境界判定と操作は `AnnualReviewCalendar.test.tsx` に配置する。境界値は秒で検査し、未来日と実績0日の差、選択詳細、ボタンの名前、Tab/Enter/Spaceを検証する。
- `ReviewPage.test.tsx` では統計・タスク・Focused Days の既存確認を保ち、今日の日付と年間カレンダーを渡す。
- `tests/e2e/v1-review.spec.ts` で `/app/review` 直アクセス、年表示、今日の集計、週次グラフ不在、年次マスの選択、実セッション登録後の該当日更新、テーマのnight適用を利用者操作で確認する。
- 年の切替UIが存在しないこと、デスクトップの週表示とモバイルの月表示の両方で全日が重複なく現れることも検証する。年グリッドの列数は2026年の53週と54週になる2000年で確認する。

## 利用APIと一次資料

依存関係のバージョンは `package-lock.json` の解決済み値を基準にする。追加インストールはしない。

| ライブラリ/API | 現在の版 | 計画内の使い方 | 一次資料 |
| --- | --- | --- | --- |
| daisyUI CSS plugin `themes` | daisyUI 5.7.32 | 既存の `@plugin "daisyui" { themes: ...; }` 構文で `night --prefersdark` を有効化する。 | [daisyUI Themes](https://daisyui.com/docs/themes/) |
| React `useState` | React 19.2.4 | 選択された `DailyReviewSummary` をカレンダー内状態として保持する。既存Reactフックのimport規約に従う。 | [React useState](https://react.dev/reference/react/useState) |
| tRPC `protectedProcedure.query` / `trpc.review.summary.useQuery` / `inferRouterOutputs` | `@trpc/server` 11.0.0 / `@trpc/react-query` 11.0.0 | 既存router手続きとquery hookを維持する。新規カレンダーpropsの型は `inferRouterOutputs<AppRouter>['review']['summary']` から導出し、応答型を重複定義しない。新しいエンドポイントは追加しない。 | [tRPC Procedures](https://trpc.io/docs/server/procedures), [tRPC React Query](https://trpc.io/docs/client/react/useQuery), [tRPC Type Inference](https://trpc.io/docs/server/infer-types) |
| Drizzle `sql` / query builder | drizzle-orm 0.45.1 | 既存の `listDailyFocusSummaries` にある `sql` と集約queryをそのまま再利用し、Drizzle APIは増やさない。 | [Drizzle SQL](https://orm.drizzle.team/docs/sql), [PostgreSQL Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html) |
| Playwright `page.setViewportSize`, role locator, keyboard | `@playwright/test` 1.58.2 | 既存E2Eでdesktop/mobile viewportとキーボード操作を検証する。 | [Playwright Page API](https://playwright.dev/docs/api/class-page#page-set-viewport-size), [Playwright Locators](https://playwright.dev/docs/locators) |

年次表示の新しいAPI/依存パッケージは追加しない。日付集計は既存のユーザー timezone SQL結果を用い、クライアント環境依存の日時変換ライブラリを導入しない。

## 品質管理

実装後にルート `CLAUDE.md` の順を変えずに実行し、失敗を直してから次へ進む。

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --run`
5. `npm run test:coverage`
6. `npm run build`
7. `npm run test:e2e -- --project=chromium`
8. Playwright CLI で実画面を操作する。
9. light/dark/system、mobile/desktop、keyboard、reduced-motion/transparency、ネットワーク断を確認する。
10. `rtk git diff --check`、旧参照検索、secret混入確認を行う。旧参照として `src/` と `tests/` 内の `business`, `直近7日`, `summary.data.days` を検索し、残存箇所が仕様上不要であることを確認する。過去の計画書やADRに記録された当時の用語は検索対象に含めない。

### ブラウザーでの確認手順

1. `.dev.vars` がローカルE2E専用Neon branchを指すことを確認する。本番/Preview DBは使わない。ポート5173と8788の使用状況を確認する。作業ブランチのルートで `npm run dev:e2e` を別ターミナルで起動する。このスクリプトは5173番が使用中だと既存Viteを再利用するため、待受プロセスの作業ディレクトリが本worktreeであることも確認する。別worktreeのサーバーなら接続せず、空いているポートで本worktreeのViteとWrangler Pagesを起動してブラウザーを向ける。E2E設定の既定フロントエンドは `http://localhost:5173`。
2. 1440×900で `/app` を開く。ヘッダーとアプリ本文が同じ中心線に揃い、本文の最大幅が960px以内であること、カードやタイマーが画面全幅に伸びていないことを確認する。
3. `/app/review` を直接開く。今日の統計、完了タスク、Focused Days が表示され、当年のカレンダーがあり、年切替UIと直近7日グラフがないことを確認する。`todayDate` と年が一致し、全日が1回だけ描画される。
4. 記録のある過去/今日のマスをクリックする。詳細に同じローカル日付と集中時間が表示され、別の日を選ぶと更新することを確認する。Tabで日マスに移動し、Enter/Spaceでも詳細を切り替えられることを確認する。
5. `/app/settings` のテーマ設定で `dark`、`light`、`system` を順に選ぶ。dark は `data-theme="night"`、light は `data-theme="corporate"`、system は `data-theme` 属性を持たずOSの配色に従う。system の状態で `playwright-cli run-code "async page => await page.emulateMedia({ colorScheme: 'dark' })"` と light 指定を使い、ページの配色が追従することを確認する。設定を再読み込みして選択状態が維持されることも確認する。
6. 390×844へリサイズして `/app` と `/app/review` を確認する。カレンダーが767px以下用の月別グリッドに切り替わり、ページ全体の横スクロール・ヘッダーとの幅ずれ・文字や操作の画面外はみ出しがない。カレンダー日を操作して詳細を確認できる。768px幅では週列グリッドに切り替わることも確認する。
7. `/app` のタスク詳細シートを開き、本文幅を広げてもシート上限528pxが維持されることを確認する。
8. `prefers-reduced-motion` と透明度低減設定、ネットワーク切断時も確認する。カレンダー操作にアニメーション必須の状態がなく、テーマ色の文字/マスの意味が識別でき、query失敗時は既存エラー表示を保つ。

例: ブラウザー確認では `playwright-cli open http://localhost:5173/app/review`、`playwright-cli resize 390 844`、`playwright-cli snapshot` の順で画面遷移と狭幅表示を確認できる。

## 完了条件

- Issueの受け入れ条件と、本計画の単体/E2E/ブラウザー観点を満たす。
- 既存 Focus Session / Task レコードとDBスキーマは無変更。
- desktopとmobileで同じ日別集計を表示し、timezoneはサーバーで決めたユーザー日付に一貫する。
- 品質管理の10項目が完了し、diffに無関係な変更やsecretがない。
