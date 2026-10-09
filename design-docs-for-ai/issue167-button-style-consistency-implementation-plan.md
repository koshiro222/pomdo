# Issue #167 実装計画: ボタンのスタイルとvariantを全画面で統一

## 対象と目的

- 対象 Issue: https://github.com/koshiro222/pomdo/issues/167
- 対象範囲: Issue 全体
- Issue コメント: なし
- 関連する既存方針: `docs/adr/0011-daisyui-standard-visual-design.md`
- 目的: `btn` と `btn-soft` が画面ごとに混在する状態をなくし、操作の重要度・意味に応じた daisyUI 標準variantで表示を揃える。見た目だけを変更し、画面遷移、操作結果、状態、データは変えない。

## 現状と判断の根拠

- UIは共通Buttonコンポーネントに集約されておらず、各コンポーネントが JSX の `className` で daisyUI クラスを指定している。本変更では共通コンポーネントを新設せず、既存のDOMとイベントハンドラーを保ったまま、各操作のクラスを役割別に直す。
- `btn-soft` は `SettingsPage.tsx` の試聴、テーマ選択、ログアウト、export/delete、エラー時の再試行と、`GoogleLoginButton.tsx` にある。テーマ選択・削除・Googleログインは追加クラスも持つため、クラスを一括置換しない。
- Task追加、Nowカード、App内の提案操作などにはvariantのない `btn` が残っている。隣接する操作との重要度を確認し、必要な箇所だけ役割variantを加える。
- Focusプリセット、テーマ選択、Task行、年間カレンダー、ドラッグハンドルは選択状態、サイズ、形状、独自操作を持つ。共通の見た目へ合わせても、`aria-pressed`、`aria-expanded`、disabled、アクセシブルネーム、roving tab stop、ツールチップ、dnd-kit/Radixの挙動は維持する。
- 年間カレンダーの日付セルは `.annual-calendar-day` と独自CSSで表示される。日付ボタンの集中時間レベル、専用のタップ領域、desktop/mobile配置、キーボード移動を残したまま、標準ボタンの通常・hover・focus-visibleの見え方を揃える。
- E2Eの `tests/e2e/v1-ui-improvements.spec.ts` はテーマとデータ操作が `btn-soft` を持つことを検証している。新しいvariantと同じ操作結果を検証する内容に更新する。

## 設計判断

1. **色の意味は ADR 0011 に従う。** Focus開始と主要CTAは `btn-primary`、Break開始は `btn-secondary`、AI分解は `btn-accent`、Task/アカウント削除などの破壊操作は `btn-error` にする。Focus停止やBreakスキップは削除ではないため `btn-error` にしない。
2. **通常・補助操作には標準 `btn` と用途別の標準variantを使う。** 中立な選択肢や再試行は `btn-outline`、キャンセル・補助・アイコン・開閉・並べ替え操作は `btn-ghost` を基本とする。`btn-soft` は通常操作に残さない。
3. **選択中の状態は色variantと既存ARIA状態の両方で示す。** 選択中のテーマとFocusプリセットは `btn-primary`、未選択はそれぞれ `btn-outline` と `btn-ghost` にし、既存の `aria-pressed` を維持する。選択状態を操作のクリック可能性や保存値と混同しない。
4. **操作ごとの割り当ては下表を基準にする。** `Task` の新規作成とNow上の完了、Focus開始、主要CTAは `btn-primary`。Nowの編集、キャンセル、後回し、Focusプリセットの未選択、タスクの詳細・並べ替えなどは `btn-ghost`。通常の再試行、停止/スキップ、ログアウト、export、テーマの未選択は `btn-outline`。設定の削除、Task削除、AI分解案からの項目削除、未記録Focusの破棄は `btn-error`。
5. **寸法をvariant統一のために変えない。** 既存の `btn-xs` / `btn-sm` / `btn-lg`、40pxのヘッダー設定リンク、タスクの小型アイコン操作、Focusの大型開始ボタン、設定の全幅ボタン、カレンダー日セル形状を維持する。追加サイズmodifierは現行の寸法が用途に合わない場合に限る。
6. **専用UIの形状と状態はCSSで維持する。** ヘッダーの設定リンクには `btn btn-ghost btn-circle` を付け、`.iconbtn` で `width/height: 40px`、`min-width/min-height: 0`、paddingを維持し、テーマトグルとの色揃えを残す。年間カレンダーは `btn btn-ghost` をベースに加え、`.annual-calendar-day` で `height: auto`、`min-width/min-height: 0`、padding 0、aspect ratioを明示して、daisyUI既定のボタン高が日セルを押し広げないようにする。日別集中時間レベル、hover/focus-visible、画面幅別配置を専用CSSで維持する。ARIA値に連動する既存のFocus強度スタイルは、daisyUIクラスと競合しないことを確認する。
7. **設定画面の選択・レイアウトを崩さない。** テーマ選択の3列幅、`aria-pressed`、export/deleteの縦並びと同幅、サウンド試聴の34px高、disabled中の表示を維持する。Slider、Switch、Task選択checkboxなどボタン以外の操作部品のclassや挙動は変更しない。

## variant割り当て

| 操作 | variant / size | 理由と維持する状態 |
| --- | --- | --- |
| LPの `/app` CTA | 既存 `btn-primary btn-lg` | 主要遷移として維持する。 |
| Focus開始 | `btn-primary btn-lg` | ADR 0011のFocus意味付けを維持する。 |
| Task追加 | `btn-primary btn-sm` | 入力フォームの確定操作として示す。34pxの現行高を保つ。 |
| Nowカードの編集 | `btn-ghost btn-sm` | 主操作に付随する補助操作。 |
| Nowカードの完了 | `btn-primary btn-sm` | Taskの完了操作を明確にする。既存の完了処理を維持する。 |
| Focusプリセット | 選択中 `btn-primary btn-sm`、未選択 `btn-ghost btn-sm` | `aria-pressed` と選択中表示を維持する。 |
| Focus停止、Breakスキップ | `btn-outline` | 状態遷移操作。破壊操作ではない。 |
| Break開始 | `btn-secondary` | ADR 0011のBreak意味付けを維持する。 |
| App内の再試行 | `btn-outline` | エラー回復操作。既存のSettings再試行も同じvariantに揃える。 |
| Nowにする、記録する等の主要な確認 | `btn-primary` | 現在の画面で確定する主要操作。 |
| あとで、もう1本 | `btn-ghost` | 主要操作を選ばない補助操作。 |
| NextからTaskを選ぶ | `btn-outline` | Focus開始と並ぶ代替導線として区別する。 |
| Task行の本体、編集、キャンセル、アイコン、開閉、並べ替え、AI分解のドラッグ | `btn-ghost` と既存 `btn-xs` / `btn-sm` / `btn-square` | 補助操作・アイコン操作。ドラッグとキーボード並べ替えを維持する。 |
| テーマ選択 | 選択中 `btn-primary btn-sm`、未選択 `btn-outline btn-sm` | `aria-pressed` とテーマ保存を維持する。3項目の幅を揃える。 |
| 音の試聴 | `btn-ghost btn-sm` | 設定内の補助操作。現在の34px高を維持する。 |
| Googleログイン | `btn-primary` | 設定画面での主要アカウント操作。Focus outbox送信やログイン処理を維持する。 |
| ログアウト、データexport | `btn-outline` | 破壊的でない設定操作。 |
| Task削除、一括削除、アカウント削除、未記録Focusの破棄 | `btn-error` | データを失う操作。disabled/確認ダイアログを維持する。 |
| AI分解の開始・確定 | `btn-accent` | ADR 0011のAI意味付けを維持する。 |
| AI分解案の項目削除 | `btn-error btn-ghost btn-xs` | 個別項目の削除と小型アイコン形状を示す。 |
| ヘッダーの設定リンク | `btn btn-ghost btn-circle` | アイコンのみの補助遷移。40pxの領域、accessible name、テーマトグルとの色揃えを維持する。 |
| 年間カレンダーの日付 | `btn btn-ghost` をベースに専用状態CSS | 日付セルの集中時間レベルと専用寸法を残す。ボタン共通のhover/focus-visibleを視認可能にする。 |

## 変更対象ファイル

### UI

| ファイル | 変更内容 |
| --- | --- |
| `src/components/settings/SettingsPage.tsx` | `btn-soft` を除去し、上表の通り試聴・テーマ・ログアウト・export/delete・匿名認証/初期化エラー時の再試行へvariantを設定する。テーマ選択の `aria-pressed`、保存処理、列幅、export/deleteの縦配置、disabled条件は維持する。 |
| `src/components/auth/GoogleLoginButton.tsx` | `btn-soft` を除き `btn-primary` を維持する。処理中disabled、Googleアイコン、ログイン前のFocus送信確認を変更しない。 |
| `src/components/timer/TimerControls.tsx` | Focusプリセットの選択状態に `btn-primary`、未選択に `btn-ghost` を適用する。Focus開始はprimary、停止/スキップはoutline、Break開始はsecondaryにする。`aria-pressed`、タイマー値、イベントを変更しない。 |
| `src/components/tasks/TaskAddForm.tsx` | 追加ボタンを `btn-primary btn-sm` にする。入力、Enter送信、34px高、Turnstile token、pending中disabledを維持する。 |
| `src/components/app/NowCard.tsx` | 編集をghost、完了をprimaryにする。空のNow状態のFocus開始primaryは維持し、進捗表示とコールバックを変えない。 |
| `src/components/app/AppPage.tsx` | 提案・復帰確認内の標準 `btn` を上表の役割別variantにする。Break開始をsecondary、Focus記録/TaskをNowにする操作をprimary、Focus記録の破棄をerror、「あとで」/「もう1本」をghost、「Nextから1つ選ぶ」をoutlineにする。処理状態、クリック結果、表示条件を変更しない。 |
| `src/components/tasks/TaskDecompositionPreview.tsx` | cancel・ドラッグ・上下移動をghost、retryをoutlineにし、項目削除を `btn-error btn-ghost btn-xs` にする。AI確定はaccentを維持する。dnd-kitキーボード操作、disabled、Turnstile処理、並び順を変更しない。 |
| `src/components/layout/AppHeader.tsx` | 設定リンクを標準ghost/circleボタン風リンクにする。リンク先、`aria-label="設定"`、アイコン、既存40px領域を維持する。 |
| `src/components/review/AnnualReviewCalendar.tsx` | 日付ボタンに標準 `btn` / `btn-ghost` の基底variantを適用する。日付名、`aria-current`、tooltip説明、roving `tabIndex`、pointer/keyboard handler、表示データは変更しない。 |
| `src/index.css` | variant導入後も標準modifierと競合するプリセットの選択色指定を整理する。`.annual-calendar-day` の既定 `height` / `min-height` / `min-width` を上書きし、現在の格子寸法を保つ。日別強度・形状・focus-visible、`.iconbtn` の40px寸法/hover色、設定3列・data-actions縦配置、disabled表示を維持する。色は既存のdaisyUIテーマ変数を使い、固定色を追加しない。 |

### E2E

| ファイル | 変更内容 |
| --- | --- |
| `tests/e2e/v1-ui-improvements.spec.ts` | `btn-soft` の既存class期待値を置き換える。テーマ選択の選択中/未選択と `aria-pressed`、Googleログイン、試聴、export/delete、設定内retryのvariantを確認する。Focus停止がerrorでない既存検証と、テーマ保存・export/delete寸法・設定操作を維持する。 |
| `tests/e2e/v1-auth-link.spec.ts` | 既存のテストidentity移行シナリオで、認証後に表示されるログアウトがoutlineであることを確認する。Google OAuthを実行せず、test identityによる既存の移行結果を維持する。 |
| `tests/e2e/v1-bootstrap-focus.spec.ts` | Task追加、Focus開始、Now操作の既存動線にvariant期待値を追加する。仮想時計でFocus完了後のBreak提案を表示し、Break開始がsecondary、Breakスキップがoutlineであることを確認する。画面遷移とTask/Focus結果の既存検証を維持する。 |
| `tests/e2e/v1-task-decomposition.spec.ts` | AI確定がaccent、cancel/dragがghost、案の項目削除がerrorであることを既存の分解・並べ替え動線内で確認する。 |
| `tests/e2e/v1-task-bulk-delete.spec.ts` | 削除確定がerror、cancelがghostであることを確認し、既存の確認・disabled・フォーカス復帰・削除結果の検証を維持する。 |
| `tests/e2e/v1-review.spec.ts` | 年間日付ボタンに共通variantが適用されることを確認し、既存のhover/focus/arrow/touch、強度表示、tooltip、日付名の確認を維持する。 |

新しい依存、DB変更、API変更、ロジック変更はない。`LandingPage.tsx` のCTAと `ReviewPage.tsx` / `AppPage.tsx` の既存outline retryなど、既に役割variantが合っている要素は変更不要。既存のcomponent testは操作・アクセシビリティの回帰を検出するため実行し、class期待値を直接持つ場合に限って合わせて更新する。新しいtestファイルは作らない。

以下は現行コードのvariantがすでに要件に合うため、コード変更なしの回帰確認対象とする。

- `src/components/tasks/TaskList.tsx`: disclosureはghost、一括削除はerror。
- `src/components/tasks/TaskRow.tsx`: Task本体、ドラッグ、上下移動、メニュー起動はghost。完了済み表示はdisabled primary。削除メニュー項目は既存danger色。
- `src/components/tasks/TaskDetailsSheet.tsx`: cancel=ghost、save=primary、AI分解=accent、delete=error。
- `src/components/tasks/TaskBulkDeleteDialog.tsx`: cancel=ghost、確定削除=error。

## 実装手順

1. 実装直前に対象JSXの全 `btn-soft`、variantなしの `btn`、ボタン風リンクを `src/` で再検索し、本計画の割り当て表と照合する。新しいボタンが見落とされていれば、隣接操作との優先度とIssue要件でvariantを決める。
2. `SettingsPage.tsx` と `GoogleLoginButton.tsx` の `btn-soft` を操作単位で置き換える。テーマは選択中primary/未選択outlineを保ち、deleteはerror、export/logoutはoutline、試聴はghost、設定retryはoutlineとする。画面ロジックや属性を編集しない。
3. `TimerControls.tsx`、`TaskAddForm.tsx`、`NowCard.tsx`、`AppPage.tsx` の操作を上表の役割別variantに更新する。選択状態のFocusプリセットは動的classだけを変更し、`aria-pressed` と時間の保存/開始結果を維持する。
4. Task行、詳細sheet、bulk delete dialogは既存variantが役割に合うことを確認して変更しない。分解previewだけretryをoutline、案の項目削除をerrorへ変更する。Radix/dnd-kitのbutton要素、属性、イベント、focus管理は置換しない。
5. `AppHeader.tsx` の設定リンクにghost/circle基底を加え、既存CSSの40pxサイズとテーマトグルとの色揃えを確認する。カレンダー日付はghost基底を加え、標準btnのheight/min-height/min-widthをリセットして既存の格子寸法を保つ。既存の強度レベル・状態CSSを共存させ、hover時もデータ強度が読み取れ、focus-visible outlineが消えないよう `.annual-calendar-day` の専用規則を調整する。
6. `src/index.css` のテーマ選択/プリセットのARIA状態に連動した独自色指定を、JSXの動的variantと重複しないよう整理する。設定選択幅、data-actions間隔、34px操作、正方形/丸型、disabled表示は現状寸法を維持する。
7. E2Eにvariantと状態の検証を追加する。旧 `btn-soft` class期待を更新し、source中に `btn-soft` が残らないことを確認する。
8. 下記の既存component test、E2E、品質手順と実ブラウザー確認を実行する。クラス差分が意図しない高さ/幅、hover/focus-visible、disabled、light/darkの見え方へ波及していないことを確認する。

## 使用するライブラリAPIと一次情報

依存バージョンは `package-lock.json` の解決済み値を基準にする。依存追加は行わない。

| パッケージ/API | lockfile版 | 使用方法 | 一次情報 |
| --- | --- | --- | --- |
| daisyUI Button classes | `daisyui` 5.7.32 | 現行の `@plugin "daisyui"` を維持し、DOMの `className` に `btn` と用途別の `btn-primary` / `btn-secondary` / `btn-accent` / `btn-error` / `btn-outline` / `btn-ghost` を指定する。選択中variant、`btn-xs` / `btn-sm` / `btn-lg`、`btn-circle` / `btn-square` は用途に応じて併用する。`btn-soft` は使わない。これらはCSS classであり、JS APIや新しいReact componentではない。 | [daisyUI Button](https://daisyui.com/components/button/)、[daisyUI Colors](https://daisyui.com/docs/colors/) |
| React DOM `className` | `react` / `react-dom` 19.2.4 | 既存のnative button、label、`react-router` Linkに文字列の `className` を指定する。選択状態は既存stateに基づく条件式でvariantを切り替える。hook、event、DOM構造の変更は不要。 | [React DOM common props](https://react.dev/reference/react-dom/components/common) |
| Playwright locator assertions | `@playwright/test` 1.58.2 | 既存E2Eにある `getByRole` / locatorと `expect(locator).toHaveClass()`、`toHaveAttribute('aria-pressed', ...)`、`toBeDisabled()` を使う。見た目の色差だけでroleを推測せず、ARIA状態とvariant classを一緒に確認する。 | [Playwright Locator Assertions](https://playwright.dev/docs/api/class-locatorassertions)、[Playwright Test Assertions](https://playwright.dev/docs/test-assertions) |

この変更では React stateやRadix UI、dnd-kitのAPIを新たに導入しない。React classNameの条件切替とdaisyUI CSS modifierだけを使う。daisyUIのクラスは現行lockfileの5.7.32と上記v5公式Button資料を根拠にする。

## テスト方針

### コンポーネント/単体テスト

既存テストを変更の影響検出に利用する。ロジック変更はないため、既存の機能期待値は維持し、class期待値を直接検査している場合のみ新variantに合わせる。

- `src/components/tasks/TaskAddForm.test.tsx`: 作成、入力、Enter送信、disabled状態。
- `src/components/tasks/TaskRow.test.tsx` と `src/components/tasks/TaskList.test.tsx`: 完了、選択、並べ替え、Disclosure、削除ダイアログ起動。
- `src/components/tasks/TaskDetailsSheet.test.tsx`、`src/components/tasks/TaskBulkDeleteDialog.test.tsx`、`src/components/tasks/TaskDecompositionPreview.test.tsx`: 保存/キャンセル/削除/AI確定、disabled、dialog focus、dnd-kitの操作。
- `src/components/layout/AppHeader.test.tsx` と `src/components/theme/ThemeToggle.test.tsx`: 設定リンクのaccessible name、テーマトグル、checkboxのchecked/aria-label。
- `src/components/review/AnnualReviewCalendar.test.tsx`: 日付名、Focus強度、hover/focus/touch tooltip、キーボード移動。
- `src/components/review/ReviewPage.test.tsx`: 年間集計とカレンダー表示、既存ページ操作を維持する。

### E2Eテスト

- `tests/e2e/v1-ui-improvements.spec.ts`: LP CTAとSettingsへ遷移し、ログイン/試聴/theme/data actionのvariant、テーマ選択の `aria-pressed` とクラス、export/deleteのdisabled・幅、既存のFocus stopがerrorでないことを検証する。
- `tests/e2e/v1-auth-link.spec.ts`: `signInAsTestIdentity` で匿名からテスト用identityへ切り替えた後、ログアウトのoutline variantと既存の移行結果を検証する。公開Google OAuthには接続しない。
- `tests/e2e/v1-bootstrap-focus.spec.ts`: Task追加、プリセット選択、Focus開始、停止、Now操作のvariantと既存の結果/遷移を確認する。別シナリオで `page.clock.install()` / `page.clock.runFor()` によりFocus完了までを進め、Break開始（secondary）とスキップ（outline）を操作して状態遷移を確認する。
- `tests/e2e/v1-task-decomposition.spec.ts`: AI開始/確定がaccent、補助/dragがghost、項目削除がerror、並べ替えと確定結果が維持されることを確認する。
- `tests/e2e/v1-task-bulk-delete.spec.ts`: cancel/errorのvariant、確認ダイアログ、disabled、キーボード操作、フォーカス復帰、実データ削除を確認する。
- `tests/e2e/v1-review.spec.ts`: 日付セルのbtn基底クラスを検証し、desktop/mobileのhover/focus/arrow/tap、tooltip、アクセシブルネーム、集中時間レベルを維持する。
- E2EをChromiumで実行し、既存の操作回帰も確認する。variant classの確認は視覚的なhover/focus確認の代用にせず、ブラウザーでも別に観察する。

### 受け入れ確認

- `rg -n 'btn-soft' src` が0件になる。テストで「含まれない」ことを明示する場合、その否定assertionは許容する。
- 主要/AI/破壊/補助操作が上の割り当てに一致する。特にFocus stop、Break skipにerrorが付かない。
- 現行のnative `disabled` と `aria-pressed` / `aria-expanded` / accessible nameが維持され、選択状態とdisabled状態が視覚的にも認識できる。
- サイズ、形状、focus-visible、calendar intensity、テーマ別配色、モバイルのタップ領域が意図せず変わらない。
- Focus/Break/Task/AI/認証/テーマ/年間レビューのデータと動作が変わらない。

## 品質管理

実装後、ルート `CLAUDE.md` の10段階を順番に実行し、失敗を解消してから次へ進む。

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --run`
5. `npm run test:coverage`
6. `npm run build`
7. `npm run test:e2e -- --project=chromium`
8. Playwright CLIで実画面を操作する。
9. light/dark/system、mobile/desktop、keyboard、reduced-motion/transparency、ネットワーク断を確認する。
10. `rtk git diff --check`、旧参照検索、secret混入確認を行う。`src/` 内の `btn-soft` は0件にする。`tests/` に残る場合は否定assertionなど意図した参照だけであることを確認し、古いclass期待は解消する。変更差分に無関係なファイル、秘密情報、生成物が混ざっていないことも確認する。

## ブラウザー確認

### 起動と確認環境

1. `.dev.vars` の `DATABASE_URL` がローカルE2E専用Neon branchを指すことを確認する。Preview/Production DBには接続しない。
2. `playwright.config.ts` のbaseURLは既定で `http://localhost:5173`、APIは `scripts/start-e2e-server.mjs` が起動するWrangler Pages `8788` へ接続する。`5173` / `8788` の待受とプロセスの作業ディレクトリを確認し、別worktreeのViteを表示していないことを確かめる。必要なら本worktreeから `npm run dev:e2e` を起動する。
3. Playwrightのlocalhost上で操作し、ユーザーアカウントの実データ削除は行わない。削除の外観と確認UIは、ローカルE2Eデータで表示・操作を確認する。

### 操作と期待結果

1. 1440×900のlightテーマで `/` を開き、CTAがprimary、大型ボタンとして表示されること、hoverとTab focus-visibleが認識できることを確認する。クリックで `/app` へ移動する。
2. `/app` でTask追加、Nowの編集/完了、Focusプリセット選択、Focus開始・停止、Task行のメニューと並べ替えを操作する。Break開始/スキップは15分Focus完了後の提案から確認する。E2Eでは仮想時計を15分01秒進めて提案を表示し、Break開始をsecondary、スキップをoutlineとして確認する。primary/secondary/outline/ghost/errorの意味が見分けられ、Task/Focus結果と既存キーボード操作が維持される。Focusの停止とBreakのスキップはerror表示にならない。
3. Task詳細sheet、AI分解preview、一括削除dialogを開く。保存=primary、AI=accent、削除=error、cancel/drag/reorder=ghostで表示される。disabled操作は実行されず、disabled表示が読める。Radixのフォーカス移動、Escapeで閉じる操作、dnd-kitのpointer/keyboard並べ替えを維持する。
4. `/app/settings` の匿名状態で音の試聴、テーマsystem/light/dark、Googleログイン表示、export/deleteを確認する。試聴はghost、テーマ選択は選択中だけprimaryで `aria-pressed=true`、未選択はoutline、ログインはprimary、exportはoutline、deleteはerror。認証後だけ表示されるログアウトは、`tests/e2e/v1-auth-link.spec.ts` のテストidentityシナリオでoutlineを確認し、実Google OAuthは使わない。選択保存・サウンド試聴・export/delete・確認UIは現在と同じ結果になる。設定の3列幅とdata操作の縦並び・同幅を維持する。
5. 1440×900のdesktopと390×844のmobileで `/app/review` を開く。年間カレンダーの日セルに集中レベルの色が残り、日セルの幅/高さが従来の正方形グリッドを保ち、hover/focus-visible/今日 (`aria-current="date"`) が判別できる。Tab、左右上下キー、タッチ、tooltip、アクセシブルネーム、色の5段階の意味が変更されない。横スクロールや日付セルの極端な縮小・拡大がない。
6. light/dark/systemを切り替えて、primary/secondary/accent/errorおよびoutline/ghostの文字・背景・境界が両テーマで区別できることを確認する。通常、hover、focus-visible、disabled、選択中を各該当操作で確認する。
7. Playwrightでviewportをmobileにした上でタッチ操作を確認し、Theme選択、Calendarの日付、Taskアイコン操作のタップ領域が現状から不必要に小さくなっていないことを確認する。
8. OS設定を `prefers-reduced-motion: reduce` と `prefers-reduced-transparency: reduce` に切り替え、ボタン操作・表示が欠けないことを確認する。ネットワークを切断して再試行を表示し、再試行ボタンがoutlineでdisabled状態を保つことを確認する。

## 完了条件

- 対象の通常操作から `btn-soft` がなくなり、役割別variantが上記割り当てに従う。
- 操作の結果・遷移・ARIA状態・キーボード操作・サイズ/形状・disabled状態・Focus/Task/設定データは変更されない。
- 対応するcomponent/E2E test、品質管理10段階、ブラウザー確認が完了する。
- `.gitignore` へ計画ファイルを追加しない。`design-docs-for-ai/` に置くリポジトリの成果物である。
- 提出直前に本計画に列挙したパスが現行コードに存在すること、コードに変更が必要な場合は新規作成と明記されていること、計画単体で実装に着手できることを確認する。
