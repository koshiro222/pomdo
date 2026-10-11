# Issue #165 実装計画: 振り返りカレンダーの日別情報をホバー中心に表示

## 対象と目的

- 対象 Issue: https://github.com/koshiro222/pomdo/issues/165
- 対象範囲: Issue 全体
- 背景仕様: Issue #163（https://github.com/koshiro222/pomdo/issues/163）、PR #164（https://github.com/koshiro222/pomdo/pull/164）
- 目的: 年間カレンダーの日ごとの情報を、選択操作なしでポインター・キーボード・タッチから確認できるようにする。日セルを全日操作可能にし、選択欄と未来日専用の装飾をなくす。

Issue #165 にはコメントがない。本文、Issue #163、PR #164、既存コードを照合した。実装対象は表示と操作に限り、集計 API や日別データは変更しない。

## 設計判断

1. 専用カレンダー／ツールチップライブラリを追加せず、現在の React と CSS で実装する。日付セル、週表示・月表示、集計データは既存構造を活かし、タッチ時だけ閉じる挙動も既存ライブラリの標準ツールチップに依存せず制御する。
2. 記録日・過去の0秒日・未来日をすべて同じ `<button>` の日セルにする。これで全日がキーボード・タッチの対象になり、0分と未来日も同じ方法で説明できる。表示値は `day.date > todayDate` の日は必ず0秒として扱い、tooltip と色レベルが未来日の API 値に誤って依存しないようにする。API の集計データは変更しない。当日判定は `aria-current="date"` にのみ使い、クリック選択状態には使わない。
3. 日情報は日付ボタンのアクセシブル名と、表示中の `role="tooltip"` / `aria-describedby` の両方で提供する。ツールチップはフォーカス可能な要素を含めない。標準 `title` 属性は外す。
4. 1セルだけを Tab 順に置く roving `tabIndex` を使う。初期の Tab 停止位置は今日とし、矢印キーは表示方向に沿って移動する。デスクトップ週表示では左右が週単位、上下が日単位、モバイル月表示では左右が日単位、上下が週単位。年の先頭・末尾では範囲外へ移動しない。CSS の切替幅と同じ 767px 境界で方向を判定する。
5. ホバー・フォーカスで開いたツールチップはポインターが離れる／フォーカスが外れると閉じる。タッチでは日セルのタップ完了（touch pointer の `pointerup`）で開き、別の日セルへのタップでは前の日の情報を閉じてタップ先の日情報に切り替える。日セル外へのタップ、同じ日を再タップ、Escape、Tab でカレンダー外へ移動した場合は閉じる。ツールチップを出すために日付の選択や下部欄への移動は行わない。
6. 週表示・月表示、日曜始まり、色の5段階と閾値、今日の統計、タスク表示、集計 API は維持する。未来日は0秒の背景色・枠線と同じにし、未来日専用のクラス・斜線・凡例項目をなくす。

矢印キーの方向別の意味は Issue で明示されていないため、表示上の隣接セルに移る挙動を採用する。GitHub の Contributions Calendar が矢印キーでセルを移動する点、および WAI-ARIA APG の roving tab stop と矢印ナビゲーションを参考にする。ただし、既存 DOM は週グリッドと月グリッドで形が異なるため、APG の完全な `grid` / `row` / `gridcell` 構造とはせず、既存の名前付き `group` と日付ボタンを維持する。支援技術向けに矢印キー操作を説明する非表示説明をグループに関連付ける。

## 変更対象

| ファイル | 変更内容 |
| --- | --- |
| `src/components/review/AnnualReviewCalendar.tsx` | 全日セルを名前付きボタンとして描画し、初期 Tab 停止位置・roving `tabIndex`・画面幅に応じた矢印移動を実装する。ホバー、フォーカス、タッチの表示状態を追加し、日付・曜日・集中時間の独自ツールチップを `role="tooltip"` と `aria-describedby` で関連付ける。選択日 state、`aria-pressed`、`title`、選択欄、「1マスが1日です」、未来日固有ラベルと凡例項目を削除する。Less / 5 swatches / More の凡例を出し、5段階の読み上げラベルに既存閾値を残す。 |
| `src/index.css` | 未来日斜線・選択装飾・選択欄の CSS を削除する。日付ボタン共通のフォーカス表示を保ち、ツールチップの重なり順、読みやすさ、画面端での配置を追加する。デスクトップ週グリッド、767px 以下の月グリッド、5色の現行色定義は維持する。 |
| `src/components/review/AnnualReviewCalendar.test.tsx` | 選択状態のテストをツールチップ・矢印移動・Tab 停止位置・タッチ起点の表示状態へ置き換える。記録日、過去0秒日、未来日それぞれの情報表示、Escape／外側操作での閉じ方、未来日と過去0秒日の同レベル属性、凡例のラベルと閾値、365/366セルと強度境界を検証する。 |
| `src/components/review/ReviewPage.test.tsx` | 既存の統計・タスク表示を保持することを確認し、記録日のクリックで選択欄が変わる期待値を削除する。フォーカスでツールチップを確認でき、旧案内・選択欄・「1マスが1日です」がないことを確認する。 |
| `tests/e2e/v1-review.spec.ts` | 既存の desktop/mobile レイアウト・年内日数確認を保ち、記録日・過去0秒日・未来日の hover、矢印キー移動、Tab での退出、タッチタップと外側タップを追加する。既存の Focus 完了から Review へ進むフローの選択欄操作をツールチップ確認へ更新する。API エラー表示の検証は維持する。 |

`src/components/review/ReviewPage.tsx`、`src/server/routers/review.ts`、`src/server/services/review-service.ts` は変更しない。ページは既存 summary をカレンダーへ渡すだけで、集計処理は現在の `Completed` と `Interrupted` の両方を対象にしている。見た目と操作だけの変更で API 契約を変える理由はない。

## 実装手順

1. `AnnualReviewCalendar.tsx` の現在の `CalendarDayCell` で、`isRecorded` による button / span の分岐を外し、全日を `type="button"` の日セルにする。日付は既存の UTC 日付文字列・`getWeekday` で扱い、`day.date > todayDate` なら表示用集中秒数を0にする。ツールチップの日付行を `YYYY年M月D日（曜）`（曜日は「日・月・火・水・木・金・土」の1字）、時間行を `集中時間 N分` とする。例: `2026年10月7日（水）` / `集中時間 0分`。
2. `AnnualReviewCalendar` に roving tab stop 用のフォーカス日と、`{ date, source }`（source は hover / focus / touch）の単一 tooltip 状態、セル DOM を引ける ref を追加する。状態を1つにして、outside tap 後に残った DOM focus が tooltip を再表示する競合を防ぐ。初期フォーカス日は `todayDate`。フォーカス移動は同じ年の `calendarDays` の範囲内に限定し、矢印キーの移動後は対象 button に実フォーカスを移す。修飾キーやボタンの標準 Enter / Space 操作は奪わない。
3. 週表示と月表示で矢印の移動量を切り替え、端のセルは範囲外へラップしない。マウス／ペンの `pointerenter` / `pointerleave` は hover の状態だけ更新し、フォーカスは `focus` / `blur` で状態管理する。`pointerType === 'touch'` の `pointerup` でタップ完了を判定し、touch tooltip は hover leave によって消さない。日セル外の `pointerdown` は開いている touch tooltip を閉じ、別日セルの `pointerup` はその日の内容に切り替え、同じ日再タップ／Escape／グリッド外への Tab 移動は閉じる。日セル `onClick` は選択や別画面操作を起こさない。
4. 表示中の情報は1つの独自 DOM ツールチップに描画し、対象ボタンだけ `aria-describedby` で参照する。`title` 属性は出力しない。tooltip 要素は `role="tooltip"` のままフォーカス可能にせず、ポインターをトリガーから tooltip へ動かしても hover 表示が消えないよう、tooltip 上にポインターがある間は開いた状態を保つ。配置は active button の `getBoundingClientRect()` を使った fixed overlay とし、`useLayoutEffect` でビューポート内に水平クランプし、上下の空きに合わせて反転する。表示中は resize / scroll で座標を更新し、cleanup する。フォーカスアウト時は次のフォーカス先が同じ日セル群の内側か確認し、矢印移動中に表示をちらつかせない。
5. 日セルの `data-focus-level` は既存 `getFocusIntensityLevel` で決めるが、未来日は表示用集中秒数を0に固定し level 0 にする。これで未来日も0秒の過去日と同じ背景・枠線になる。今日のセルだけ `aria-current="date"` を維持する。表示される凡例は `Less`、既存 5 段階の色見本、`More` の順にし、各色の支援技術向け説明に次の閾値を含める: 0秒、1〜1799秒、1800〜3599秒、3600〜7199秒、7200秒以上。
6. `src/index.css` の `.annual-calendar-day.is-future`、`.annual-calendar-swatch.is-future`、`.is-selected`、`.annual-calendar-selection` 関連 CSS を削除または整理する。5色・focus-visible のアウトラインとブレークポイント（`max-width: 767px`）は保つ。ツールチップに `prefers-reduced-motion` 前提のアニメーションは追加しない。
7. コンポーネントテストと E2E を新しい操作契約に更新し、旧選択 UI に依存する参照が残っていないことを検索する。

## 利用 API と一次情報

この変更に新しい依存パッケージは追加しない。現在の `package-lock.json` 解決バージョンに合わせる。

| パッケージ / API | lockfile のバージョン | 計画で使う API と一次情報 |
| --- | --- | --- |
| `react` / `react-dom` | 19.2.4 | `useState`（表示状態）、`useRef`（日付ボタン参照）、`useEffect`（touch 外側 pointer listener と resize / scroll listener の登録・cleanup）、`useLayoutEffect`（active button の矩形計測と tooltip 座標の確定）、`useId`（tooltip id）、DOM props `onPointerEnter` / `onPointerLeave` / `onPointerUp` / `onPointerDown` / `onFocus` / `onBlur` / `onKeyDown` / `tabIndex` / `aria-describedby`。表示方向の判定には browser API `window.matchMedia('(max-width: 767px)')` を使う。公式: [useState](https://react.dev/reference/react/useState)、[useRef](https://react.dev/reference/react/useRef)、[useEffect](https://react.dev/reference/react/useEffect)、[useLayoutEffect](https://react.dev/reference/react/useLayoutEffect)、[useId](https://react.dev/reference/react/useId)、[React DOM common props/events](https://react.dev/reference/react-dom/components/common)、[Window.matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia)。 |
| `@testing-library/react` | 16.3.2 | 既存の `render`, `screen` と `container` を用いて role/name/description、tab order、属性・表示を検証する。公式: [React Testing Library API](https://testing-library.com/docs/react-testing-library/api/)。 |
| `@testing-library/user-event` | 14.6.1 | `userEvent.setup()`、`user.hover` / `user.unhover`、`user.tab`、`user.keyboard`、`user.pointer` を用いて実際の操作に近いイベント列を送る。touch 操作は `TouchA` pointer を press / release して `pointerup` を発生させる。公式: [Convenience APIs](https://testing-library.com/docs/user-event/convenience/)、[Keyboard API](https://testing-library.com/docs/user-event/keyboard/)、[Pointer API](https://testing-library.com/docs/user-event/pointer/)。 |
| `vitest` | 4.0.18 | `vi.stubGlobal('matchMedia', ...)` で jsdom にない viewport query を desktop / mobile で切り替え、`vi.unstubAllGlobals()` で復元する。公式: [Mocking globals](https://vitest.dev/guide/mocking.html#globals)。 |
| `@playwright/test` | 1.58.2 | 既存 E2E の `page.getByRole`、`locator.hover` / `focus` / `tap`、`page.keyboard.press`、`page.clock.install({ time })` と `page.addInitScript`、モバイルタップ用 `browser.newContext({ hasTouch: true })` を使う。`tap` は `hasTouch: true` が必要。公式: [Locator API](https://playwright.dev/docs/api/class-locator)、[Keyboard API](https://playwright.dev/docs/api/class-keyboard)、[Browser API](https://playwright.dev/docs/api/class-browser)、[Clock API](https://playwright.dev/docs/clock)、[Page API](https://playwright.dev/docs/api/class-page)。 |

アクセシビリティ挙動の参照: [WAI-ARIA APG Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)、[WAI-ARIA APG Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)、[GitHub Contribution Graph のアクセシビリティ改善](https://github.com/orgs/community/discussions/49015)。APG Tooltip Pattern は同ページに work in progress と記載されているため、必須要件（フォーカス時表示、Escape、`role="tooltip"`、`aria-describedby`）の参考として使い、タッチ動作は Issue #165 の指定を優先する。

## テスト方針

### コンポーネント: `src/components/review/AnnualReviewCalendar.test.tsx`

- 既存の 365 / 366 日、年外日付の除外、日付順、色境界の確認を残す。境界値 0、1、1799、1800、3599、3600、7199、7200 秒が level 0〜4 に対応することを確認する。
- 2026-01-01（過去0秒）、2026-01-02（今日）、2026-01-03（未来0秒）の全てがボタンとしてフォーカスでき、アクセシブル名が日付・曜日・集中時間を含むことを確認する。未来例は 2026-10-07 を使い `2026年10月7日（水）` と `集中時間 0分` を検証する。未来日に誤って正の API 値を与えた fixture も表示上0分・level 0になることを確認し、未来日の色が API の異常値で変わらないようにする。
- マウス hover で独自 tooltip が表示され、unhover で消える。`title` ヒントに依存せず、`role="tooltip"` の内容に曜日と `集中時間 0分` が出る。
- `before` / `after` の sentinel button でコンポーネントを囲み、Tab で一度だけ今日の日セルへ入ること、矢印キーで desktop / mobile の表示方向に隣接セルへ移動しその tooltip が出ること、Tab で `after` button へ抜けることを確認する。年の端では移動しない。jsdom の `window.matchMedia` は現行 `src/test/setup.ts` で stub されていないため、このテストで mobile / desktop の `matches` を返す `vi.stubGlobal` を設定し、各テスト後に復元する。
- 日付 button が `aria-pressed` や選択状態を持たず、hover / focus / Enter / Space のいずれでも選択欄が生成されないことを確認する。
- touch pointer の `pointerup` でタップを完了したセルの tooltip が表示され、同じセル再タップ／別セルタップ／日セル外タップ／Escape の各操作で仕様どおり閉じる、または別セルへ切り替わることを確認する。日セル外タップでフォーカスがボタンに残った状態でも閉じたままであること、日セル外タップ時の `document` listener は touch tooltip が開いている期間だけ登録され閉じる際に cleanup されることも確認する。
- 未来日と過去0秒日の `data-focus-level` がともに `0` で、未来日に正の fixture 値があっても表示は0分、`is-future` / 斜線スタイルがない。凡例は視覚上 `Less`、5 swatches、`More` の順で、5段階の隠し説明が正しい閾値を保持する。「1マスが1日です」と未来日項目は存在しない。
- 表示中の button の `aria-describedby` が tooltip id を指し、非表示時は dangling reference がない。viewport geometry の計測が必要な配置確認は jsdom でなく E2E の実ブラウザーで行う。

### ページ: `src/components/review/ReviewPage.test.tsx`

- 今日の合計集中時間、完了 Focus 数、完了タスク、累計 Focus 日数、年間カレンダーの表示が引き続き確認できる。
- カレンダーの日ボタンを focus すると日情報を読めることを確認し、旧クリック選択欄・未選択案内がないことを確認する。

### E2E: `tests/e2e/v1-review.spec.ts`

- 既存の直接遷移、日数重複なし、12か月、768px desktop grid / 390px mobile month grid、横はみ出しなし、API エラー状態を維持する。
- Review E2E の固定時刻を 2026-10-06 に合わせ、記録日 2026-10-06（火）の hover、過去0秒日 2026-10-05（月）の hover、未来日 2026-10-07（水）の hover の tooltip 文言を確認する。これにより Issue の未来日例 `2026年10月7日（水）` と `集中時間 0分` を同じ E2E で検証する。
- Desktop と mobile の両方で focus + 矢印移動を行い、フォーカス先の日情報が更新されること、Tab で他 UI へ抜けられることを確認する。
- touch 用テストでは `browser.newContext` に `baseURL`、`hasTouch: true`、390×844 viewport を設定し、新しい匿名ページであることを前提に `page.clock.install({ time: fixedNow })` と `page.addInitScript` で `pomdo-e2e-now` を `fixedNow.toISOString()` に設定してから `/app/review` を開く。既存 helper `setServerNowFromBrowserClock` で backend も 2026-10-06 に合わせてから `locator.tap()` を使い、未来日のタップ表示、別日への切替、カレンダー外タップで閉じることを確認する。日付タップで API mutation、フィルタ、選択欄表示が発生しないことも確認する。
- 年初・年末のセル、モバイルの月初／月末のセルで tooltip が viewport 内に収まり、ページスクロール後もフォーカス中のボタンに追従する。ポインターをトリガーから tooltip へ動かしても表示が消えず、tooltip から離れると閉じることを確認する。
- Focus 完了から Review を開く既存ユーザーフローでは日付 hover / focus で完了日の合計を確認し、完了 Focus 数と今日の統計が維持されることを検証する。

## 品質管理

実装担当はルート `CLAUDE.md` の「品質管理」順序を守り、失敗を隠さず上から実行する。

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --run`
5. `npm run test:coverage`
6. `npm run build`
7. `npm run test:e2e -- --project=chromium`
8. Playwright CLI で実画面を操作する。
9. light / dark / system、mobile / desktop、keyboard、reduced-motion / reduced-transparency、ネットワーク断を確認する。
10. `rtk git diff --check`、旧参照検索、secret 混入確認を行う。

E2E は `playwright.config.ts` が `BASE_URL` 未指定時に `npm run dev:e2e` を起動する。Playwright CLI で画面を確認する前に、対象サーバーがこの worktree のコードを返していることを確認する。実装変更は表示操作のみであるため、DB migration や API schema 更新は発生しない。

## ブラウザでの動作確認

1. 開発サーバーで `/app/review` を開き、広い desktop 幅（例: 1440×900）にする。年間の週表示、12か月、今日の統計、完了タスクが表示され、既存の週列レイアウトと5段階の色が維持されることを確認する。
2. E2E と同じ匿名テストユーザー、固定時刻 2026-10-06 のデータを用意し、15分の完了 Focus が記録された 2026年10月6日（火）のマスへポインターを置く。独自 tooltip に「2026年10月6日（火）」と「集中時間 15分」が出て、マウスを離すと閉じることを確認する。過去0秒の10月5日と未来日の10月7日も hover すると `0分` と曜日が出る。ブラウザー標準の `title` による表示ではないことを確認する。
3. Tab でカレンダーの日セルへ入り、日付と集中時間が支援技術に伝わるラベルとして読まれることを確認する。矢印キーでフォーカスと tooltip が移動し、Tab でカレンダー外へ出ることを確認する。desktop では左右が週、上下が曜日の移動になる。
4. カレンダー下に選択日欄がなく、日セルをクリックしても選択枠・選択状態・別の表示変更が起きないことを確認する。見出し横に「1マスが1日です」がなく、凡例が Less・5色・More の順で、未来日専用の斜線や説明がないことを確認する。
5. viewport を 390×844 にし、月表示の7列配置・既存の日付位置・横スクロールなしを確認する。タッチ端末または Playwright touch context で日付をタップし tooltip が出ること、別日タップで日付情報が更新されること、日セル外タップで閉じることを確認する。mobile では左右が日、上下が週の移動になる。
6. 今日を 2026-10-06 に固定したデータで、未来日の 2026-10-07 をタップまたは focus して「2026年10月7日（水）」「集中時間 0分」を確認する。
7. light / dark / system を切り替えて tooltip と色差が読めること、reduced-motion / reduced-transparency 設定で表示・操作が変わらないこと、ネットワークを offline にした後も読み込み済み Review の日セル操作が不正な選択や API 更新を行わないことを確認する。

## 完了条件

- Issue #165 の全受け入れ条件を満たす。記録日・過去0秒日・未来日の全てで hover / focus / touch から日付・曜日・集中時間が確認できる。
- 全日セルが同一のキーボード操作対象で、矢印移動と Tab 退出が desktop / mobile の両表示で機能する。フォーカス中の日情報がアクセシブル名と tooltip 説明から確認できる。
- 選択状態・選択欄・未選択案内・「1マスが1日です」・未来日専用凡例と装飾が取り除かれ、凡例の Less / 5段階 / More と既存の色閾値が保たれる。
- デスクトップ週表示、モバイル月表示、Review API、Completed + Interrupted の日別時間、今日の統計に回帰がない。
- コンポーネントテスト、ページテスト、振り返り E2E と CLAUDE.md に記載の品質管理を完了する。
