# Issue #153 実装計画: daisyUI標準デザインへの統一とテーマ・ローディング・操作状態の改善

## 1. 対象と結論

- 対象 Issue: https://github.com/koshiro222/pomdo/issues/153
- スコープ: Issue 全体
- 実装方針: daisyUI 5 の semantic color と標準コンポーネントを JSX の主表現にし、Radix UI の Dialog / Slider / Switch と dnd-kit の操作構造は維持する。画面固有のレイアウト、タイマー円盤、シートのドラッグ・開閉アニメーションだけを独自 CSS の責務として残す。
- DB/API スキーマ: 変更しない。既存の `system | light | dark`、`pomdo-theme`、`settings.update`、Turnstile 検証を利用する。
- `docs/v1-mockup.html` は削除せず、今回の視覚的な正解として参照しない。
- `CONTEXT.md` の用語を実装・テストの名前に適用する。特に `Task` / `Now` / `On Deck` / `Break` / `分解案` を別の同義語へ改名しない。

この Issue の実装は、次の三つを同時に満たす必要がある。

1. daisyUI の見た目へ移行しても、Focus、Break、Task、AI 分解、認証、設定保存の動作を変えない。
2. テーマトグルを `/`、`/app`、`/app/review`、`/app/settings` に配置し、即時反映・localStorage 復元・既存のサーバー保存を維持する。
3. ローディング・失敗・ホバー・キーボードフォーカス・reduced motion を、目視とアクセシビリティの両方で確認できる状態にする。

## 2. 現行コードから確定している前提

- daisyUI は `package-lock.json` で `5.7.32`、Radix の統合パッケージ `radix-ui` は `1.6.7` がインストールされている。
- `src/index.css` の `@plugin "daisyui"` は `light --default, dark --prefersdark` を有効にしている。ただし同じファイルに、daisyUI の semantic token と競合しうる `--color-*` の独自値、ボタン・カード・スライダー・Switch の独自 CSS が残っている。
- `src/lib/theme.ts` の `applyTheme` は `data-theme` と `pomdo-theme` を更新し、`system` の場合は `data-theme` を削除する。これを壊さず、`system` の実効テーマを判定する純粋な責務を追加する。
- `src/components/layout/AppHeader.tsx` は現在 `AppPage`（`/app`）でのみ使われ、Review / Settings にはまだ配置されていない。設定リンクだけを持ち、テーマ操作はないため、今回共通ヘッダーとして Review / Settings にも配置する。
- `src/components/landing/LandingPage.tsx` にはヘッダー相当の領域がなく、LP のデモスライダーは `input[type="range"]` である。LP のデモスライダーは変更対象外とする。
- `src/components/app/AppPage.tsx` は匿名認証・bootstrap・Task 取得完了まで `あなたの Pomdo を準備しています。` だけを表示する。匿名認証と bootstrap の失敗には既存の再試行ボタンがあるが、Task query の失敗は現在も準備中表示へ落ちるため、今回明示的な失敗・再試行分岐を追加する。認証・bootstrap の処理順は変更しない。
- `src/components/review/ReviewPage.tsx` と `src/components/settings/SettingsPage.tsx` は現在 `AppHeader` を描画していない。対象画面で共通テーマ操作を提供するため、loading / error / 通常表示の全分岐で `AppHeader` を描画する。
- `src/components/settings/SettingsPage.tsx` は `radix-ui` の `Slider.Root` に `min={0}`、`max={1}`、`step={0.05}`、`value={[volume]}`、`onValueChange`、`Slider.Thumb aria-label="音量"` を設定している。この API とアクセシブルネームを維持し、外観だけを daisyUI の `range` に近づける。
- `src/components/timer/TimerControls.tsx` は Focus の「ストップ」と Break の「スキップ」の両方に `btn-error` を付けているため、Focus / Break は neutral または outline に変更し、削除だけを error にする。
- `src/components/tasks/TaskDecompositionPreview.tsx` には既に daisyUI の `btn`、`alert`、`loading loading-spinner` が一部導入済みである。AI 固有の見出し・説明・ロード中・確定操作だけを `accent` の意味付けへ寄せ、Task の通常操作へ `accent` を波及させない。
- テーマの保存元は「ユーザーのサーバー値を初回の正」とし、初回認証前だけ localStorage 値を表示用の暫定値にする。`settings.update` 成功後に Better Auth セッションを再取得する既存 API はないため、同一画面内では hook の state と localStorage を即時の正として使い、次回の新規セッション / localStorage 削除後の読み込みでサーバー値を検証する。保存失敗時は画面表示と localStorage を維持し、既存の通知経路で再試行を促す。

## 3. 変更対象ファイル

### 新規作成

| ファイル | 変更内容 |
| --- | --- |
| `src/components/theme/ThemeToggle.tsx` | `system / light / dark` の保存値を受け取り、実効テーマと切り替え先を示す daisyUI ベースのトグルを描画する。`aria-label` は「ダークテーマに切り替え」または「ライトテーマに切り替え」と動的にする。保存やネットワーク処理は持たせない。 |
| `src/components/theme/ThemeToggle.test.tsx` | light / dark / system の表示、動的ラベル、トグルコールバック、アイコンの `aria-hidden` を検証する。 |
| `src/components/theme/ThemePreferenceProvider.tsx` | LP を含むアプリ全体で localStorage / 実効テーマ / OS preference listener を一つに保持する。認証 API は呼ばず、ユーザーのサーバー値はページから一度だけ同期する。 |
| `src/hooks/useThemePreference.ts` | Provider の state を読み、明示テーマ選択・トグル・ユーザー単位のサーバー値同期を提供する。サーバー保存の通信自体は各ページの既存 Turnstile 経路が担当する。 |
| `src/hooks/useThemePreference.test.ts` | user theme / localStorage の優先順位、画面遷移間の共有 state、system の OS 変更通知、listener の解除を検証する。 |
| `src/lib/theme.test.ts` | `system` の実効テーマ判定、light / dark の反転、`data-theme` と `pomdo-theme` の保存を検証する。`matchMedia` の dark / light をテストごとに明示する。 |
| `src/components/layout/AppHeader.test.tsx` | `/app` とサブページで ThemeToggle、設定リンク、戻るリンク、ブランド表示を検証する。 |
| `src/components/review/ReviewPage.test.tsx` | Review のテーマトグルが Turnstile token 付き `settings.update` を呼び、失敗時に Toast を表示することを検証する。 |
| `tests/e2e/v1-ui-improvements.spec.ts` | LP、App、Review、Settings のテーマトグル、App 準備中スピナー、ホバー・キーボード、音量スライダー、AI の accent、Focus / Break 操作色をユーザー操作で検証する。 |

### 変更

| ファイル | 変更内容 |
| --- | --- |
| `src/lib/theme.ts` | `resolveEffectiveTheme` と `resolveNextTheme` を追加する。`readStoredTheme`、`applyTheme`、`initializeTheme` の既存契約と localStorage キーは維持する。`system` の OS preference 変更通知を hook が購読できる形にする。 |
| `src/messages.ts` | テーマトグル用の動的アクセシブルネームと、Task query 失敗用の `tasksLoadError` / `retry` を追加する。既存の画面文言や E2E が参照する `設定`、`ストップ`、`音量`、`使ってみる` は変更しない。 |
| `src/components/layout/AppHeader.tsx` | `ThemeToggle` を共通ヘッダーへ配置する。`/app` の設定リンク、サブページの戻るリンクとブランド表示を維持し、左右のレイアウトを壊さない。テーマ値と切り替えコールバックを props で受け取る。 |
| `src/App.tsx` | `ThemePreferenceProvider` を `AppRouter` の外側に一つだけ配置し、LP から App / Review / Settings へ遷移してもテーマ state がリセットされないようにする。Provider は認証・API 呼び出しを開始しない。 |
| `src/components/landing/LandingPage.tsx` | LP ヘッダー相当の位置に `ThemeToggle` を追加し、localStorage への即時反映を有効にする。LP のタイマーデモ `input[type="range"]` は見た目も挙動も変更しない。CTA、特徴カード、フッターの semantic color とホバー表現を daisyUI 中心に整理する。 |
| `src/components/app/AppPage.tsx` | `useThemePreference` を使って AppHeader のテーマ操作と既存の Turnstile / protected action resolver を接続する。準備中分岐に `role="status"`、`aria-live="polite"`、`loading loading-spinner aria-hidden="true"` を追加する。匿名認証または bootstrap 失敗時はスピナーを出さず、現在のエラー文言と「もう一度試す」だけを表示する。`tasksQuery.isError` を準備中と分離し、Task 取得の再試行を可能にする。Focus、Break、Task の処理順は変更しない。 |
| `src/components/review/ReviewPage.tsx` | loading / error / 通常表示の全分岐で `AppHeader` を描画し、テーマトグルを既存の `settings.update` と Turnstile resolver に接続する。`user && ready` なら summary の取得中でも保存を許可し、未認証・bootstrap 前は localStorage のみを更新する。summary の取得条件、エラー文言、グラフの SVG は変更しない。読み込み中の表示には必要な `role="status"` と daisyUI spinner を適用する。 |
| `src/components/settings/SettingsPage.tsx` | loading / error / 通常表示の全分岐で `AppHeader` を描画する。既存のテーマ 3 択を `system` 選択可能なまま維持し、共通のテーマ状態・保存処理と `AppHeader` のトグルを同じ状態へ接続する。`user && ready` なら設定データ取得中でも保存を許可し、未認証・bootstrap 前は localStorage のみを更新する。Radix Slider の DOM/API と設定保存は維持し、トラック・レンジ・Thumb の見た目を daisyUI semantic color に合わせる。Radix Switch は DOM と操作性を維持し、標準の semantic color と明確な checked 状態へ寄せる。 |
| `src/components/timer/TimerControls.tsx` | Focus の「ストップ」と Break の「スキップ」から `btn-error` を外し、`btn-outline` または neutral 系の控えめなボタンにする。開始、プリセット、Break の primary / secondary の意味付けは維持する。 |
| `src/components/tasks/TaskRow.tsx` | Task 行、完了、メニュー、並べ替えボタンの通常・ホバー・focus-visible を daisyUI class 中心に統一する。行のクリック、削除、Now 昇格、dnd-kit の attributes/listeners、既存 aria-label は変更しない。 |
| `src/components/tasks/TaskList.tsx` | group、追加フォーム、Backlog / 今日完了の開閉トリガーを daisyUI の surface / border / button 表現へ寄せ、行間の境界線と disclosure のレイアウトは維持する。 |
| `src/components/tasks/TaskAddForm.tsx` | 入力欄と追加ボタンを daisyUI の `input` / `btn` semantic class 中心に整える。`タスクを追加` の label と Turnstile・mutation 処理は維持する。 |
| `src/components/tasks/TaskDetailsSheet.tsx` | Radix Dialog の Portal、Overlay、Content、ドラッグ処理、focus 管理は維持する。入力欄、アクション、削除の色付けを daisyUI class 中心にし、削除だけ `btn-error` を使う。 |
| `src/components/tasks/TaskDecompositionPreview.tsx` | AI 分解の見出し・ロード状態・確定状態に `text-accent` / `btn-accent` / `alert` などを適用する。元の Task の編集・削除・並べ替えは accent にしない。loading は `role="status"`、`aria-live="polite"`、spinner の `aria-hidden` を維持する。 |
| `src/components/ui/Toast.tsx` | Toast の surface と文字色を daisyUI の semantic token に合わせる。表示条件、閉じる処理、通知文言は変更しない。 |
| `src/index.css` | `@plugin "daisyui/theme"` の light / dark custom theme ブロックと独自の `--color-base-*`、`--color-primary`、`--color-secondary`、`--color-accent`、`--color-neutral`、`--color-info`、`--color-success`、`--color-warning`、`--color-error` を削除し、標準 light / dark の color slot を使う。加えて legacy の `--color-chrome`、`--color-border`、`--color-hairline`、`--color-text-muted`、`--color-text-faint`、`--color-primary-line`、`--color-primary-weak`、`--color-secondary-weak`、`--halo`、未使用の `--noise` を削除する。`appbar` は `bg-base-100/80`、補助文は `text-base-content/70`、境界線は `border-base-300`、AI の補助面は `bg-accent/10 text-accent-content`、LP の halo は `var(--color-primary)` を `color-mix` した局所 gradient へ置換する。`btn`、`card`、`alert`、`input`、`loading` で表現できる見た目は JSX class へ移し、Radix Slider に native range の `range` class を付けない。残す CSS はレイアウト、タイマー円盤、dnd-kit、Radix Dialog / Slider / Switch の DOM 構造、シートアニメーション、レスポンシブ、reduced motion に限定する。ホバーは `base-300` などの semantic color で明確にし、`:focus-visible` は独立したままにする。 |
| `tests/e2e/v1-bootstrap-focus.spec.ts` | 新しいヘッダー・トグル追加で既存のユーザー操作が変わらないことを確認し、必要な場合だけ locator を既存 accessible name に合わせて補正する。Focus、Break、Task の業務シナリオ自体は変更しない。 |
| `tests/e2e/v1-review.spec.ts` | Review / Settings に共通ヘッダーが追加されても、既存の記録確認・JSON export・アカウント削除の操作が同じ accessible name で成立することを確認する。 |
| `tests/e2e/v1-task-decomposition.spec.ts` | AI 分解の既存フローを維持しつつ、accent 表示や loading の aria 状態を必要に応じて検証する。分解案の編集・削除・並べ替え・確定条件は変えない。 |
| `tests/e2e/helpers/auth.ts` | 準備完了を待つ `openAppAsAnonymous` は維持し、UI 改善 E2E 用に API request を継続的に遅延 / 失敗させた状態で `/app` を開く補助関数を追加する。 |

`docs/adr/0011-daisyui-standard-visual-design.md` は既に今回の判断を記録済みのため変更しない。`src/main.tsx` の初回描画前 `initializeTheme()` 呼び出しも変更せず、Provider の初期 mount で再適用・再保存しない。DB schema、router、repository、service、`docs/v1-mockup.html`、LP デモの range API も変更しない。

## 4. 実装手順

### 4.1 テーマ状態を共通化する

1. `src/lib/theme.ts` に次の二つを追加する。

   - `resolveEffectiveTheme(theme: Theme): 'light' | 'dark'`: `light` / `dark` はそのまま返し、`system` は `window.matchMedia('(prefers-color-scheme: dark)').matches` で判定する。SSR・テストなど `window` がない場合は `light` にフォールバックする。
   - `resolveNextTheme(theme: Theme): 'light' | 'dark'`: 実効テーマが dark なら light、light なら dark を返す。保存値が `system` の場合も必ず明示テーマを返すため、OS が dark なら light、OS が light なら dark を保存する。

2. `ThemePreferenceProvider` を `src/App.tsx` で一つだけ描画する。`src/main.tsx` の `initializeTheme()` は初回描画前の FOUC 防止として残し、Provider の初期 mount では `applyTheme` や localStorage 書き込みを繰り返さない。Provider は `readStoredTheme()` で state を初期化し、ユーザー操作・OS preference 変更・サーバー値採用のときだけ `applyTheme` を呼ぶ。`useThemePreference` は Provider の state を読み、`selectTheme` / `toggleTheme` / `adoptServerTheme(userId, theme)` を提供する。`adoptServerTheme` は user ID ごとに一度だけ実行し、初回のサーバー値を localStorage の古い値より優先する。以後の画面遷移では Provider の state を優先するため、App で `dark` を保存した直後に Review / Settings が stale な `user.theme` で `system` に戻ることを防ぐ。
3. `useThemePreference` は `matchMedia('(prefers-color-scheme: dark)')` の `change` event を購読し、`system` 中に OS が light / dark へ変わったら実効テーマ、アイコン、`aria-label`、次に保存する明示テーマを再計算する。listener は unmount 時に解除し、ブラウザ API がない環境では購読を省略する。ユーザーのテーマ選択は「state 更新 → `applyTheme` → ページが持つ `persistTheme`」の順で、画面反映をネットワーク応答に待たせない。
4. `ThemeToggle` は保存を知らない controlled component とする。実装は native checkbox input に daisyUI の `toggle` class を付ける形に固定し、button に `toggle` を付けるだけの構成にはしない。実効テーマが dark のときは次の操作を示す月アイコンと「ライトテーマに切り替え」、light のときは太陽アイコンと「ダークテーマに切り替え」を表示する。アイコンは `aria-hidden="true"`、input 本体には動的 `aria-label` を付ける。
5. daisyUI の `toggle` を使用する場合でも `theme-controller` の自動切り替え機構には依存しない。`system` とサーバー保存値を維持するため、React の controlled state と `applyTheme` を単一の動作源にする。
6. LP は Provider の `selectTheme` だけを呼び、認証・API リクエストを開始しない。AppPage / ReviewPage / SettingsPage は `adoptServerTheme(user.id, user.theme)` を一度だけ呼ぶ。各ページの `canPersistTheme` は Task / summary / settings の取得完了ではなく `Boolean(user && ready)` で判定し、認証・bootstrap が完了していればデータ query 中でも保存可能にする。各ページが所有する Turnstile widget / resolver と `settings.update.mutateAsync` を `persistTheme(theme): Promise<void>` に接続し、`try/catch` までを関数内で完結させる。AppHeader は UI と callback props だけを所有し、Turnstile を描画しない。loading / error 分岐を含む AppHeader のテーマ操作は即時に Provider state と localStorage へ反映し、`canPersistTheme` が true のときだけサーバー保存する。保存失敗時は未処理 Promise rejection を残さず、`Toast` / Settings の既存 notice に表示し、Provider の state と localStorage は維持する。例えば Task 取得中に `dark` へ変更しても `user && ready` なら `settings.update` を送信し、500 応答でも画面は dark のまま通知だけを表示する。

ページごとの保存契約は次のとおりに固定する。

- AppPage: `canPersistTheme` を `Boolean(user && ready)` で判定し、既存 `resolveProtectedActionToken` を使う `async persistTheme(theme): Promise<void>` を定義する。token 取得と `trpc.settings.update.useMutation().mutateAsync({ theme, turnstileToken })` を `try/catch` で囲み、失敗は既存 `toast` state へ渡す。Task query の pending 中でもこの条件を満たせば呼び出す。
- ReviewPage: `canPersistTheme` を `Boolean(user && ready)` で判定し、`useTurnstileToken` と `Turnstile` を ReviewPage 内に一つだけ追加する。`async persistTheme(theme): Promise<void>` の中で token 取得と `settings.update` mutation を `try/catch` し、失敗時も「確認が完了していないため保存できません。ページを再読み込みして、もう一度お試しください。」を表示する。summary query の pending / error でも認証・bootstrap 済みならテーマ保存を許可する。
- SettingsPage: `canPersistTheme` を `Boolean(user && ready)` で判定し、既存の `save` を `mutateAsync` を await する Promise に変更する。テーマ 3 択とヘッダートグルの両方から同じ `async persistTheme(theme): Promise<void>` を呼び、token 取得・mutation・`try/catch` を一つの契約にする。失敗時は既存 `linkNotice` へ通知し、サウンド設定の保存契約は変えない。

### 4.2 共通ヘッダーと各画面のテーマ導線を追加する

- `AppHeader` の `/app` では左に PomdoBrand、右に ThemeToggle と設定リンクを置く。
- `/app/review` と `/app/settings` では現在の戻るリンク・ブランドを維持し、テーマトグルを同じ actions 領域に置く。Review / Settings の loading・error・通常表示の全分岐で header を先に描画し、直接 URL を開いた直後や bootstrap / query 失敗時にもトグルを操作可能にする。
- LP では `landing-inner` 内のヘッダー相当位置に ThemeToggle を置く。LP から `/app` へ遷移する既存 CTA は維持する。
- `system` を Settings の 3 択から削除しない。3 択で `system` を選んだ直後は `data-theme` を削除し、OS の実効テーマが画面へ反映されることを確認する。
- ユーザー情報がまだ無い App の準備中でも、localStorage のテーマを使ったトグルは描画できる。認証・bootstrap の失敗分岐では、トグルのために匿名認証や追加 API を開始しない。
- `AppHeader` の props は `{ theme: Theme; onToggleTheme: () => void }` とし、AppPage / ReviewPage / SettingsPage が Provider の同じ state と保存 callback を渡す。各ページの `onToggleTheme` は先に Provider の state / localStorage を更新し、`canPersistTheme` が true のときだけ内部の `persistTheme` を呼ぶ。App の Task query、Review の summary query、Settings の設定 query の完了は保存条件にしない。失敗は各ページの通知で処理し、`onToggleTheme` から rejection を外へ漏らさない。

### 4.3 daisyUI への移行境界を守って画面を整える

- 標準化するもの: ボタンの色・size・outline/ghost/soft、カードの surface・border・shadow、設定グループ、alert、入力、loading、テーマトグル、状態ラベル、Task 行のホバー。
- `src/index.css` の `@plugin "daisyui/theme"` の light / dark custom theme ブロックは削除し、冒頭の `@plugin "daisyui" { themes: light --default, dark --prefersdark; }` が提供する daisyUI 標準 light / dark の color slot を使う。標準テーマの色値を写経して再定義しない。Pomdo 固有の `--font`、サイズ、max-width、timer / sheet の shadow・motion など、色以外の構造 token は必要最小限残す。
- 独自 CSS を残すもの: `.disc` と SVG、`.sheet*` の Radix Dialog 配置・開閉・ドラッグ、dnd-kit の dragging transform / handle、Radix の `Slider.Root / Track / Range / Thumb` と `Switch.Root / Thumb` の DOM に必要な配置・data-state styling、ページの max-width / grid / responsive、reduced-motion / reduced-transparency 固有制御。
- 同じ要素に `bg-*` や `text-*` の semantic class と旧 `--color-hairline` 等を重ねて優先順位が不安定になる書き方を残さない。移行後も必要な独自 CSS は専用の構造クラスに限定する。
- 旧 `--color-chrome`、`--color-border`、`--color-hairline`、`--color-text-muted`、`--color-text-faint`、`--color-primary-line`、`--color-primary-weak`、`--color-secondary-weak`、`--halo`、未使用の `--noise` は主要コンポーネントから参照せず、変数自体を削除する。例えば補助文は `text-base-content/70`、境界線は `border-base-300`、面は `bg-base-100/200/300`、AI の補助面は `bg-accent/10 text-accent-content`、LP の halo は `var(--color-primary)` を `color-mix` した局所 gradient へ移す。残す CSS 変数は max-width・font size・timer / sheet の構造値に限定する。
- ホバーは、例えば通常の Task 行を `base-100`、ホバーを `base-300` にするなど、light / dark の双方で差が出る semantic color を使う。`:focus-visible` の outline はホバーと別に残す。
- Focus の「ストップ」と Break の「スキップ」は `btn-error` を使わない。Task 削除・アカウント削除などの破壊的操作だけ `btn-error` を使う。
- AI 分解の見出し、生成中、確定など AI の状態・操作にだけ `accent` を付ける。一般 Task の保存、削除、並べ替えは既存の primary / neutral / error の意味を維持する。

### 4.4 App 準備中・失敗中の状態を明示する

`AppPage` の既存の早期 return を次の状態に分ける。

- 認証または bootstrap が進行中、または Task query が pending: `role="status" aria-live="polite"` の一つの領域に、既存文言「あなたの Pomdo を準備しています。」と `<span className="loading loading-spinner ..." aria-hidden="true" />` を表示する。
- `anonymousAuthError`: spinner を出さず、既存の「匿名アカウントを作成できませんでした。」と「もう一度試す」を表示する。
- `bootstrapError`: spinner を出さず、既存の「Pomdo の準備に失敗しました。」と「もう一度試す」を表示する。
- `tasksQuery.isError`: spinner を出さず、Task 取得に失敗したことと再試行操作を表示する。実装では `anonymousAuthError` → `bootstrapError` → `tasksQuery.isError` → pending spinner → 通常画面の優先順位にする。再試行は既存の `tasksQuery.refetch` を使い、認証・bootstrap の処理順を変えない。
- Task query エラーの文言は `messages.app.tasksLoadError = 'Taskを読み込めませんでした。'`、再試行ボタンは `messages.app.retry = 'もう一度試す'` として `src/messages.ts` に追加する。再試行中は `tasksQuery.isFetching` を使ってボタンを disabled にし、成功後は通常の Now / timer / Task 画面へ戻す。
- 人工的な delay / 最低表示時間 / router loader 化は追加しない。

`@media (prefers-reduced-motion: reduce)` では `.loading-spinner` に `animation: none` を適用し、必要なら border の静的リングとして表示する。テストは computed style の `animationName === 'none'` または `getAnimations().length === 0` を判定し、単に極小 duration へ短縮しただけの実装は合格にしない。既存の sheet / LP reveal の reduced-motion 制御と `prefers-reduced-transparency` の既存配慮も削除しない。

### 4.5 音量 Slider と Radix Switch を整える

- `Slider.Root` の `min={0}`、`max={1}`、`step={0.05}`、controlled `value`、`onValueChange`、`Slider.Thumb aria-label={messages.settings.volume}` は変更しない。
- Radix の `Root / Track / Range / Thumb` DOM を保ったまま、`slider-root` をレイアウト専用、Track / Range / Thumb の色とサイズを daisyUI の `primary` / `base-*` に相当する semantic token へ寄せる。Radix Root に daisyUI の native input 用 `range` class は付けず、Radix 専用 CSS で描画する。
- Settings のミュート Switch も `Switch.Root` / `Switch.Thumb` を維持し、`data-state="checked|unchecked"` に応じる専用 CSS で checked / unchecked の差、focus-visible、dark theme のコントラストを改善する。
- Task の Radix DropdownMenu は `Root / Trigger / Portal / Content / Item / Separator` を維持し、`Content` の配置・Portal・keyboard highlight を壊さない範囲で menu 相当の surface / hover token だけを適用する。
- LP のタイマーデモの native range はこの変更対象に含めない。設定の Slider と同じ CSS セレクタを当てない。

## 5. 利用するライブラリ API と一次情報

現在インストールされているバージョンに合わせ、次の API だけを使用する。バージョンが変わった場合は実装前に lockfile と公式ドキュメントを再確認する。

| API / 用途 | 現行版での使い方 | 一次情報 |
| --- | --- | --- |
| daisyUI Button | `<button className="btn btn-primary">…</button>`、控えめな操作は `btn btn-outline` / `btn btn-ghost`、破壊的操作だけ `btn btn-error` | [daisyUI Button](https://daisyui.com/components/button/) |
| daisyUI Loading | `<span className="loading loading-spinner" aria-hidden="true" />`。状態文言を親の `role="status" aria-live="polite"` に置く | [daisyUI Loading](https://daisyui.com/components/loading/) |
| daisyUI Range | native demo range の基準は `<input type="range" className="range range-primary" />`。今回の音量操作本体は Radix Slider のままなので、Radix DOM へ `range` class は付けない | [daisyUI Range](https://daisyui.com/components/range/) |
| daisyUI Toggle | native checkbox input に `toggle` class を付ける。`theme-controller` 自動処理には依存せず、React の `checked` / `onChange` と `applyTheme` で保存値を管理する | [daisyUI Theme Controller / Toggle](https://daisyui.com/components/theme-controller/) |
| daisyUI Card / Alert | surface を `card` / `bg-base-*` 中心、エラーを `alert alert-error` 中心にする | [daisyUI Card](https://daisyui.com/components/card/)、[daisyUI Alert](https://daisyui.com/components/alert/) |
| Radix Slider | 現行コードと同じ `import { Slider } from 'radix-ui'`、`Slider.Root`、`Slider.Track`、`Slider.Range`、`Slider.Thumb`。`min` / `max` / `step` / `value` / `onValueChange` / `aria-label` を維持する | [Radix Slider](https://www.radix-ui.com/primitives/docs/components/slider) |
| Radix Switch | 現行コードと同じ `import { Switch } from 'radix-ui'`、`Switch.Root checked onCheckedChange`、`Switch.Thumb`。DOM を差し替えない | [Radix Switch](https://www.radix-ui.com/primitives/docs/components/switch) |
| Radix Dropdown Menu | 現行コードと同じ `DropdownMenu.Root / Trigger / Portal / Content / Item / Separator` を維持し、Content の surface と highlighted state だけを調整する | [Radix Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu) |
| React Router | 既存の `Link` と `useLocation` を維持し、ヘッダー追加のために router 構成を変更しない | [React Router](https://reactrouter.com/) |
| Playwright | `@playwright/test` の既存 `page.clock`、`getByRole`、`page.route`、`page.emulateMedia` / `page.setViewportSize` を使い、既存 E2E の固定時計・匿名 helper と共存させる | [Playwright Test](https://playwright.dev/docs/test-intro)、[Clock](https://playwright.dev/docs/clock)、[Emulation](https://playwright.dev/docs/emulation) |

実装例をコード化する場合の命名は、`resolveEffectiveTheme`、`resolveNextTheme`、`useThemePreference`、`ThemeToggle` のように処理内容と対象が読める名前にする。テスト名は「何が正しいか」を表し、実装をなぞるコメントは追加しない。コードコメントが必要になる場合は、`theme-controller` を使わない理由や Radix DOM を置換しない理由など「なぜ別案を採らないか」だけを書く。

## 6. テスト方針

### Unit / component

- `src/lib/theme.test.ts`
  - `light` は dark にならず、`dark` は light になる。
  - `system` は `matchMedia('(prefers-color-scheme: dark)')` の実効値を使う。OS が dark の system は light を保存先にし、OS が light の system は dark を保存先にする。
  - `applyTheme('system')` は `data-theme` を削除し、`pomdo-theme=system` を保存する。明示テーマは `data-theme` と localStorage の両方を更新する。
- `src/components/theme/ThemeToggle.test.tsx`
  - light / dark / system で切り替え先の label が正しい。
  - クリックまたはキーボード操作で callback が一度だけ呼ばれる。
  - Sun / Moon icon が支援技術から重複して読まれない。
- `src/hooks/useThemePreference.test.ts`
  - Provider が localStorage の値を読み、`adoptServerTheme(userId, userTheme)` の初回同期でサーバー値が localStorage の古い値に上書きされない。
  - `system` 中の `matchMedia` change で表示上の実効テーマが更新され、listener が unmount 時に解除される。
  - `selectTheme` / `toggleTheme` が明示テーマを Provider の state と localStorage に反映する。通信失敗時に表示と localStorage を維持する契約は App / Review / Settings の統合テストで検証する。
- `src/components/layout/AppHeader.test.tsx` または同等の統合テスト
  - `/app` とサブページの props で ThemeToggle、設定リンク、戻るリンク、ブランドが同時に成立する。
  - テーマ callback が AppHeader 内の UI 変更だけでなく呼び出し元へ一度だけ返る。
- `src/components/review/ReviewPage.test.tsx`
  - Review が loading / error / 準備完了の全分岐で AppHeader を描画し、テーマ toggle で `settings.update` へ `theme` と `turnstileToken` を渡す。
  - mutation 失敗時に Toast が表示され、Provider のテーマ表示は rollback しない。
- 既存 component tests
  - `TaskRow.test.tsx` は既存 accessible name と操作結果を維持する。
  - `TaskDetailsSheet.test.tsx` / `TaskDecompositionPreview.test.tsx` は Dialog・AI 分解の既存フローを維持する。新しい class は見た目の契約に必要な場合だけ assertion し、色の実装詳細を過剰に固定しない。

### E2E

新規 `tests/e2e/v1-ui-improvements.spec.ts` は `openAppAsAnonymous` と既存の E2E 用 Neon branch / 固定時計設定を使う。最低限、次を検証する。

1. `/` にテーマトグルがあり、クリックで `document.documentElement.dataset.theme`、`localStorage.getItem('pomdo-theme')`、動的 accessible name が変わる。リロード後も明示テーマが復元される。App でテーマを保存した後、`settings.update` の response を待ち、`localStorage.removeItem('pomdo-theme')` と Provider を初期化した新しい page で `/app/review` を開き、サーバー保存済みのテーマが復元されることを確認する。App → Review → Settings の遷移中に保存済みテーマが `user.theme` の stale 値へ戻らないことも確認する。
2. `/app`、`/app/review`、`/app/settings` の各画面で同じテーマトグルが操作できる。Settings で `system` を選んだ後、OS dark をエミュレートすると `data-theme` がなくても dark の semantic token が使われ、トグルで light が保存される。
3. `tests/e2e/helpers/auth.ts` の専用 helper を使い、`page.goto('/app')` 前に `/api/auth/get-session` または `/api/auth/sign-in/anonymous` の response を `route.continue` 前に遅延させ、準備中に既存文言、`role=status`、`aria-live=polite`、`loading-spinner[aria-hidden=true]` が見える。別テストで匿名認証、bootstrap の `/api/trpc/bootstrap.initialize`、Task list の `/api/trpc/tasks.list` を procedure 名で判定し、該当 request が何回 retry されても abort / 500 を返す。spinner がなく、該当エラー文言と `もう一度試す` が見えることを確認し、表示後に `page.unroute` して再試行する。Task query の失敗は `focus.sessions` が同じ batch URL に含まれても `tasks.list` を含む request として失敗させる。`openAppAsAnonymous` は準備完了待ちのため loading 検証には使わない。
4. Task 行、ヘッダー設定アイコン、dropdown item、LP CTA / feature card で hover 前後に背景・境界線・文字色のいずれかが変わり、Tab の `focus-visible` が hover 表現と別に見える。既存の accessible name を使って操作する。
5. Settings の `音量` slider に focus し、Home → ArrowUp → End を行う。`aria-valuenow` が 0、0.05、1 の順に変わり、既存の保存処理が走る。マウス操作も同じ値域で動く。
6. Focus 実行中の `ストップ` と Break 中の `スキップ` が `btn-error` ではない。Task 削除とアカウント削除は error 表現を維持する。
7. AI 分解の preview / confirming / confirm 操作に accent の semantic class があり、Task の通常編集・削除・並べ替えには accent が広がっていない。既存の編集、削除、キーボード並べ替え、確定、リロード後の保持を再確認する。
8. `/app/review` のテーマトグルを操作し、`settings.update` の request payload に `theme` と E2E 用 `turnstileToken` が含まれることを確認する。mutation を失敗させた場合は Review の Toast が表示され、localStorage と Provider の表示状態が維持されることを確認する。
9. `page.emulateMedia({ reducedMotion: 'reduce' })` で App 準備中を表示し、spinner の computed `animationName === 'none'` または `getAnimations().length === 0` を確認する。`prefers-reduced-transparency` は Playwright の `emulateMedia` では設定せず、macOS の「システム設定 → アクセシビリティ → ディスプレイ → 透明度を下げる」を有効にした手動確認で、`.appbar` の `backdrop-filter` が `none`、背景・境界線・文字が判別できることを確認する。desktop / mobile の viewport でも横溢れがない。

### 回帰観点

- 既存 `v1-bootstrap-focus.spec.ts` の LP → App、15 分 Focus、完了後 Break、30 秒中断破棄、60 秒超中断記録を壊さない。
- `v1-review.spec.ts` の Review、export、アカウント削除と LP への戻りを壊さない。
- `v1-task-decomposition.spec.ts` の preview、編集、削除、キーボード並べ替え、confirm、リロード復元を壊さない。
- Theme toggle を設置するためだけに匿名認証、bootstrap、Task query、Review query の処理順を変えない。
- `npm test -- --run` と coverage で、テーマ・コンポーネントの新規分岐がテストされていることを確認する。

## 7. 品質管理の実行手順

ルート `CLAUDE.md` の順序を厳守し、前の工程が失敗した場合は原因を修正してから次へ進む。

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --run`
5. `npm run test:coverage`
6. `npm run build`
7. `npm run test:e2e -- --project=chromium`
8. Playwright CLI で実画面を操作する
9. light / dark / system、desktop / mobile、keyboard、reduced-motion / reduced-transparency、ネットワーク断を確認する
10. `rtk git diff --check`、旧 CSS / mockup 参照の意図しない残存、secret 混入を確認する

追加で確認すること:

- `npm run build` が `VITE_TURNSTILE_SITE_KEY` の既存制約で失敗した場合、Issue の実装不備と混同せず、既存の preview 用手順または `.env.local` の設定を確認する。
- 変更対象外の `docs/v1-mockup.html` に range 用の変更が入っていないことを `git diff` で確認する。
- `package.json` の範囲指定だけでなく `package-lock.json` の実インストール版を根拠に API を使う。
- 新規テストや plan 以外の一時ファイルをリポジトリに残さない。Playwright の出力は既存 `.gitignore` の範囲に置く。

## 8. ブラウザでの動作確認手順

開発サーバーは確認対象の worktree で起動する。既存プロセスが別 worktree の場合は、空いているポートで `npm run dev:e2e` を起動し、`http://localhost:5173` がこのリポジトリの Vite、API が `http://localhost:8788` の Wrangler であることを確認する。

### LP

1. `http://localhost:5173/` を開く。
2. ヘッダー相当位置のトグルを確認する。light のとき「ダークテーマに切り替え」、dark のとき「ライトテーマに切り替え」が読める。
3. トグルをクリックし、背景、カード、CTA、本文、補助文の semantic color が一斉に変わることを確認する。
4. ページをリロードし、選択した明示テーマが復元されることを確認する。
5. CTA「使ってみる」で `/app` へ進む。LP デモの `デモの残り時間` range は変更されていないことを確認する。

### App / loading / timer

1. 新しい匿名状態で `/app` を直接開く。準備中に `あなたの Pomdo を準備しています。` と spinner が同時に表示され、完了後に Now / timer / Task が表示されることを確認する。
2. ネットワークを一時的に切断して匿名認証または bootstrap を失敗させる。spinner が消え、「匿名アカウントを作成できませんでした。」または「Pomdo の準備に失敗しました。」と「もう一度試す」が表示されることを確認する。再試行で通常画面へ戻ることも確認する。
3. `/app` のテーマトグルを操作し、即時に画面が切り替わること、設定リンクの accessible name が `設定` のままであることを確認する。
4. Focus を開始し、「ストップ」が error 色でないことを確認する。Break を開始し、「スキップ」も error 色でないことを確認する。Focus の開始・停止、Break の既存遷移は従来どおり動く。
5. Task 行と行内メニューを hover、Tab focus、キーボード操作する。通常時との差が明確で、focus-visible outline が hover 背景に埋もれないことを確認する。

### Review / Settings / volume

1. `/app/review` を直接開き、共通ヘッダー、テーマトグル、`アプリへ戻る` が表示されることを確認する。light / dark 両方でグラフと補助文が読めることを確認する。
2. `/app/settings` を開き、ヘッダーのテーマトグルと既存の `system / light / dark` 3 択が両方表示されることを確認する。
3. `system` を選択し、OS の color scheme を dark / light に切り替える。`data-theme` を付けずに実効テーマが変わることを確認する。
4. 音量 Slider をクリックし、ArrowLeft / ArrowRight / Home / End で 0〜1 を 0.05 刻みで変更する。値変更後にページをリロードして保存値が復元されることを確認する。
5. ミュート Switch、テスト再生、JSON export、アカウント削除は既存の操作と結果を維持していることを確認する。

### reduced motion / responsive

1. Chromium の reduced motion を有効にして `/app` の準備中を表示する。spinner が回り続けず、文言は表示されることを確認する。
2. `prefers-reduced-transparency` も有効にし、ヘッダーの backdrop-filter がなくても文字・境界線・ボタンが判別できることを確認する。
3. desktop 幅と mobile 幅で `/`、`/app`、`/app/review`、`/app/settings` を確認し、テーマトグル、ヘッダー、Task 行、Settings Slider が横にはみ出さないことを確認する。

## 9. 受け入れ条件チェックリスト

- [ ] 対象画面の主要コンポーネントが daisyUI 標準 class 中心になっている。
- [ ] light / dark の背景、面、本文、補助文、primary、secondary、accent、error が判別できる。
- [ ] Focus のストップと Break のスキップに `btn-error` がない。
- [ ] AI 分解の AI 固有 UI に accent が適用され、通常 Task 操作には波及していない。
- [ ] ヘッダー設定アイコン、Task 行、dropdown、ボタン、リンク、テーマトグル、設定項目、LP CTA / feature card の hover 差が明確である。
- [ ] `:focus-visible` が hover と独立して確認できる。
- [ ] `/`、`/app`、`/app/review`、`/app/settings` のすべてでテーマを切り替えられる。
- [ ] `system / light / dark`、`pomdo-theme`、サーバー側テーマ保存、リロード復元が維持される。
- [ ] `system` からのトグルは OS の実効テーマと反対の明示テーマを保存する。
- [ ] `/app` 準備中に既存文言と spinner、`role=status`、`aria-live=polite` がある。
- [ ] 認証 / bootstrap 失敗時は spinner がなく、既存エラーと再試行がある。
- [ ] reduced-motion で連続 spinner 回転が停止または静的表示になる。
- [ ] 音量 Slider は Radix の操作性・accessible name・0〜1 / 0.05 刻み・保存を維持する。
- [ ] LP のタイマーデモ range は変更されていない。
- [ ] Focus、Break、Task、AI 分解、認証、設定保存、Review、export、削除の回帰がない。
- [ ] class の有無だけで合否を決めず、light / dark の主要面・本文・primary・secondary・accent・error と Task 行の通常 / hover の computed style または目視結果を確認している。
