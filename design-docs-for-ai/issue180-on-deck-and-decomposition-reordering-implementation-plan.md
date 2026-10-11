# Issue #180 実装計画: On Deck と AI 分解案の並べ替え

## 対象

- Issue: https://github.com/koshiro222/pomdo/issues/180
- スコープ: Issue 全体
- Issue コメント: `gh issue view --comments` で確認し、コメントなし。

## 目的

On Deck と Task 詳細シート内の AI 分解案について、移動操作をドラッグハンドルに集約する。On Deck では、ドロップ後に保存が終わるまで古い順序へ戻って見える状態をなくし、ポインターとキーボードのどちらからも順序を確定できるようにする。API、DB、Now / Today の状態遷移は変更しない。

実装時は Task と On Deck の意味を `CONTEXT.md` に合わせる。On Deck は Today に属し Now に入っていない Task の待ち行列である。Backlog と今日完了した Task は対象にしない。

## 現行コードで確認したこと

- `src/components/tasks/TaskList.tsx` の `sortOnDeck` は `deckOrder` で On Deck を並べる。On Deck の `DndContext` は PointerSensor のみで、ドロップ後は Turnstile token を取得して `tasks.reorder` を呼び、成功時に `onRefresh` する。保存前の表示順は更新されず、mutation 失敗時の処理もない。token が `null` の場合も何も表示しない。
- 同ファイルの `renderRows` は On Deck にだけ移動操作を渡し、Backlog と今日完了した Task には渡していない。並べ替え mutation は `{ id, previousId, nextId, turnstileToken }` を送る。
- `src/components/tasks/TaskRow.tsx` は `useSortable` の listeners をドラッグハンドルの button にだけ付けている。ハンドルは文字記号「⠿」、上下ボタンは `onMove` がある行だけに表示される。Task 本文、チェックボックス、3 点メニューは別の操作要素として実装済み。
- `src/components/tasks/TaskDecompositionPreview.tsx` は PointerSensor と KeyboardSensor、`sortableKeyboardCoordinates` を使い、分解案を `items` のローカル状態で管理する。確定 mutation に `items.map(...)` を渡すため、配列順がそのまま確定順となる。確定エラーは既存の `role="alert"` 表示で通知している。行には記号ハンドル、上下移動、個別削除がある。
- `src/index.css` に `.drag-handle` のタッチ操作設定、タスク行と分解案のドラッグ中表示、上下ボタンのスタイルがある。既存の `is-dragging` 表示は維持する。
- `src/components/ui/Toast.tsx` は `role="status"` / `role="alert"` を指定できる。`src/messages.ts` に日本語文言を集約している。
- `src/server/routers/tasks.ts` に既存の `reorder` procedure があり、Today の未完了 Task を対象に順序を保存する。入力形式を含め、サーバー実装と DB schema は今回変更しない。
- `src/components/tasks/TaskList.test.tsx`、`TaskRow.test.tsx`、`TaskDecompositionPreview.test.tsx` が該当する RTL テスト。E2E は `tests/e2e/` に置き、認証と失敗応答には `tests/e2e/helpers/auth.ts` の `openAppAsAnonymous` / `failAppProcedure` を利用できる。分解案のキーボード並べ替えは `tests/e2e/v1-task-decomposition.spec.ts` に既存シナリオがある。

## 決定済みの実装要件

### 両方のリスト

- 「⠿」を `lucide-react` の `GripVertical` に置き換える。アイコン自体は装飾として扱い、button の既存の日本語アクセシブルネームを維持する。
- 上下移動ボタンを削除する。分解案の個別削除ボタンは残す。
- PointerSensor のドラッグ開始領域はハンドルだけにする。本文、チェックボックス、編集・削除メニューではドラッグを開始しない。既存の PointerSensor の 6px activation distance と、タッチでハンドルを操作できる状態を維持する。
- `useSortable` の row 用 ref とハンドル用 activator ref を適切に分け、attributes / listeners はハンドルにだけ付ける。ハンドルの名前、キーボードフォーカス、focus-visible 表示を維持する。
- ハンドルと隣接する3点メニューまたは分解案の削除ボタンを視覚的に区別できる間隔とサイズを保つ。ドラッグ中の現在の行表示を保つ。ドロップ位置表示やドラッグアニメーションの再設計はしない。

### On Deck

- `TaskList` に On Deck の optimistic な順序 ID を持たせ、Task の表示データは最新の `onDeck` props から組み立てる。ドラッグ終了時に `over` が有効で、順序が変わった場合は、サーバー応答や Turnstile token を待たずに新しい順序を表示する。`SortableContext.items` と描画順は同じ ID 列を使う。
- UI の表示配列と `SortableContext.items` は常に同じ順序を使う。表示中の順序から移動 Task の直前・直後の ID を求め、既存の `tasks.reorder` 入力形式で保存する。
- token 取得開始から mutation の完了まで同期 ref と pending state で再入を防ぐ。pending 中は On Deck の `DndContext` に空の sensor 配列を渡し、新しいドラッグを始められないようにする。ハンドル button は native disabled にせずフォーカス可能なままにし、`aria-disabled="true"` で状態を伝える。成功時は既存の一覧再取得を行い、サーバーから返った順序 ID が表示に反映されるまで optimistic な順序を維持する。
- mutation が失敗した場合はドラッグ開始前の順序に戻し、既存 Toast を `role="alert"` で表示する。Turnstile token が `null`、または resolver が reject した場合も同じ失敗経路として扱う。失敗しても Task の選択状態や他の操作を壊さない。
- On Deck の DndContext に KeyboardSensor を追加する。ハンドルにフォーカスした状態から Space または Enter で開始・確定、上下矢印で移動、Escape でキャンセルできるようにする。座標計算には AI 分解案と同じ `sortableKeyboardCoordinates` を使う。先頭・末尾を含む On Deck の有効な位置へ移動できること。
- Now、Backlog、今日完了した Task を並べ替え対象や `SortableContext.items` に混ぜない。

### AI 分解案

- PointerSensor と KeyboardSensor の既存動作を保ち、ハンドル以外からドラッグを開始しない。
- 上下移動 UI と、それだけに使われている callback / 文言を削除する。個別削除、タイトル・メモ編集、キャンセル、確定は保つ。
- 並べ替えは引き続き `items` のローカル配列に反映し、確定時は画面上の順序をそのまま送る。
- 確定に失敗しても編集内容と順序を維持し、既存のエラー表示を使う。

## 変更対象ファイル

| ファイル | 変更内容 |
| --- | --- |
| `src/components/tasks/TaskList.tsx` | On Deck の KeyboardSensor 設定、表示順を即時更新する optimistic state、保存中の順序競合防止、mutation / token 失敗時の rollback と alert Toast を実装する。On Deck のみを `SortableContext` に渡す既存境界を維持する。 |
| `src/components/tasks/TaskRow.tsx` | `GripVertical` を描画し、`onMove` callback を廃止して並べ替え可否を明示する boolean prop で表す。上下移動 UI と不要な icon import を削除する。ハンドルにだけ sortable listeners / attributes / activator ref を付け、保存中はフォーカスを保ったまま `aria-disabled` を設定する。Task 本文、checkbox、menu の操作を維持する。 |
| `src/components/tasks/TaskDecompositionPreview.tsx` | 分解案の `GripVertical` を描画し、上下移動 UI と専用 callback を削除する。削除ボタン、ローカル配列によるドラッグ順、確定時の送信順、失敗時の内容維持を保つ。 |
| `src/components/tasks/TaskList.test.tsx` | 新しい順序の即時表示、payload、保存成功後の再取得、mutation 失敗 rollback と alert、token 取得失敗を検証する。 |
| `src/components/tasks/TaskRow.test.tsx` | 並べ替え可能行にだけハンドルがあり、上下ボタンがないこと、accessible name / focus、checkbox・本文・3点メニューの既存操作を検証する。 |
| `src/components/tasks/TaskDecompositionPreview.test.tsx` | 上下ボタン操作のテストをドラッグ操作のテストへ置き換える。並べ替えた表示順が確定 payload に入り、失敗時にタイトル・メモ・順序が保たれることを検証する。 |
| `src/index.css` | 既存のハンドルサイズと `touch-action: none`、focus 表示、ハンドルと隣接操作の間隔を確認して調整する。ドラッグ中表示を維持し、未使用になる上下ボタンのスタイルを削除する。 |
| `src/messages.ts` | On Deck の保存 / token 失敗 Toast 文言を追加する。削除した上下移動操作だけに使われる分解案文言があれば削除する。 |
| `tests/e2e/issue180-task-reordering.spec.ts` | 新規作成。Issue の On Deck / 分解案シナリオを Chromium でユーザー操作として確認する。 |

`CONTEXT.md` の Task / On Deck の定義は既に今回の要件と一致するため変更しない。`src/server/routers/tasks.ts`、DB schema、migration、依存関係、Backlog / 今日完了した Task の表示と操作は変更しない。

## 利用 API とインストール済みバージョン

以下のバージョンは `package-lock.json` の解決済み version で確認した。追加依存は不要。

| API | 使用方法 | バージョン・一次情報 |
| --- | --- | --- |
| dnd-kit sensors | 現行の `PointerSensor` を保ち、`KeyboardSensor` を `useSensor` / `useSensors` で追加する。`KeyboardSensor` の `coordinateGetter` に `sortableKeyboardCoordinates` を渡す。標準キーは開始・確定が Space / Enter、キャンセルが Escape。 | `@dnd-kit/core` 6.3.1、`@dnd-kit/sortable` 10.0.0。公式 sortable 概要: https://dndkit.com/legacy/presets/sortable/overview/ 。公式 KeyboardSensor: https://dndkit.com/legacy/api-documentation/sensors/keyboard/ |
| dnd-kit `useSortable` | `setNodeRef` は行、`attributes` / `listeners` / `setActivatorNodeRef` はハンドルに適用する。これにより本文やメニューをドラッグ開始領域にせず、キーボード後のフォーカス復帰もハンドルに合わせる。 | `@dnd-kit/sortable` 10.0.0。公式 API: https://dndkit.com/legacy/presets/sortable/use-sortable/ |
| Lucide React icon | `lucide-react` から `GripVertical` を名前付き import し、button 内に装飾 icon として配置する。名前は button の aria-label で提供する。 | `lucide-react` 0.575.0。React package guide: https://lucide.dev/guide/react/ 、icon: https://lucide.dev/icons/grip-vertical 。 |
| Playwright locator / route | E2E では role と accessible name でハンドルを特定して pointer / keyboard 操作する。`page.route` で `tasks.reorder` 応答を遅延または失敗させ、通信中の表示と rollback を確認する。 | `@playwright/test` 1.58.2。公式 Locator API: https://playwright.dev/docs/api/class-locator 、Page route API: https://playwright.dev/docs/api/class-page#page-route 。 |

## テスト方針

### コンポーネントテスト

既存の Vitest + Testing Library テストを拡張し、tRPC mutation は各ファイルの既存 mock に合わせて制御する。

- `TaskList.test.tsx`: 3件以上の On Deck を用意し、先頭・末尾を含む移動で表示順と `previousId` / `nextId` が一致することを確認する。token resolver が待機中でも新しい順序が表示され、mutation 成功まで維持されることを確認する。成功 callback で `onRefresh` が呼ばれること、mutation 失敗では元順へ戻り `role="alert"` が出ること、token が `null` または reject の場合も rollback と通知になることを確認する。保存中はハンドルのフォーカスを失わず、別の並べ替え mutation が始まらないことを確認する。
- `TaskRow.test.tsx`: On Deck 行ではハンドルが名前付き button としてフォーカスでき、アイコンの代替名ではなく既存の Task 名付き aria-label が読めることを確認する。上下ボタンがなく、ハンドル以外の Task 本文・checkbox・編集・完了・削除メニューが従来どおり動作することを確認する。Backlog / 完了行にはハンドルがないことも確認する。
- `TaskDecompositionPreview.test.tsx`: ドラッグで順序を変え、確定 mutation の `items` 配列が表示順と一致することを確認する。上下ボタンが表示されず、個別削除と編集が残ること、確定失敗後にタイトル・メモ・順序が保持されることを確認する。

### E2E テスト

新規 `tests/e2e/issue180-task-reordering.spec.ts` では `openAppAsAnonymous(page)` で開始し、Task 作成の小さな helper はこの spec 内に置く。reorder mutation の遅延・失敗は `page.route` で対象 procedure のみ制御し、実 DB を変更するシナリオは E2E 専用環境で実行する。

1. On Deck に3件以上を作り、最後の Task のハンドルを先頭へドラッグする。`tasks.reorder` 応答を遅らせてもドロップ直後から新しい順序であり、応答後と reload 後も同じ順序であることを確認する。
2. `tasks.reorder` を失敗させる。並び順がドラッグ前に戻り、`role="alert"` の Toast が支援技術から取得できることを確認する。Turnstile token が取れないケースは component test で補完する。
3. On Deck のハンドルにフォーカスし、Space または Enter で開始、上下矢印で移動、Space または Enter で確定できることを確認する。Escape はドラッグ前の順序へ戻し、先頭・末尾でもリスト外へ移動しないことを確認する。
4. AI 分解案をポインターとキーボードで並べ替え、上下ボタンなしで、確定後に画面上の順序が反映されることを確認する。確定 mutation の失敗後も編集済み内容と順序が画面に残ることを確認する。
5. Task 本文で Now へ移動し、checkbox と3点メニューから編集・完了・削除を操作する。これらの操作がドラッグを開始せず、Backlog と今日完了した Task にハンドルがないことを確認する。
6. 上記のハンドル操作を desktop 幅 1440px と mobile 幅 390px で行い、ハンドルと3点メニューが視認・操作でき、横スクロールが発生しないことを確認する。タッチ実機または touch 有効のブラウザでもハンドルからドラッグできることを確認する。

### ブラウザでの操作確認

1. 起動中の開発サーバーがこの checkout のコードであることを確認する。E2E を使う場合、`playwright.config.ts` が `npm run dev:e2e` を起動し `http://localhost:8788/api/health` を待つ。`scripts/start-e2e-server.mjs` が読む `.dev.vars` の `DATABASE_URL` は E2E 専用 DB branch にし、Preview / Production の接続先を使わない。
2. Playwright CLI で `http://localhost:5173/app` を開き、On Deck に Task を3件追加する。末尾のハンドルを先頭へドラッグし、ドロップ直後に順序が変わること、ページ再読み込み後も順序が保たれることを確認する。
3. ハンドルへキーボードで移動し、Space → ArrowUp / ArrowDown → Enter で順序を確定する。別の Task で Escape を押し、順序がキャンセルされることを確認する。
4. Task 本文を押して Now へ移動し、checkbox を切り替え、3点メニューから編集・削除を選ぶ。これらが並べ替えとして扱われないことを確認する。
5. Task 詳細シートを開き AI 分解案を表示する。ハンドルでポインターとキーボードの並べ替えを行い、上下ボタンがないこと、個別削除・タイトル・メモ編集・キャンセル・確定が使えることを確認する。
6. mobile 幅 390px と desktop 幅 1440px で両方の一覧を操作し、アイコンと隣接メニューの間隔、focus-visible、タッチ操作領域、横はみ出しがないことを確認する。

## 品質管理

実装後、ルート `CLAUDE.md` の順序どおりに実行し、失敗した工程を隠して次へ進まない。シェル実行時は RTK の指示に従い、各コマンドの先頭に `rtk` を付ける。

1. `rtk npm ci`
2. `rtk npm run lint`
3. `rtk npm run typecheck`
4. `rtk npm test -- --run`
5. `rtk npm run test:coverage`
6. `rtk npm run build`
7. `rtk npm run test:e2e -- --project=chromium`
8. Playwright CLI で上記の実画面操作を行う。
9. light / dark / system、mobile / desktop、keyboard、reduced-motion / transparency、ネットワーク断を確認する。
10. `rtk git diff --check`、古い「⠿」と上下移動 UI / 不要になった移動 callback の参照、secret 混入を確認する。

## 完了条件

- On Deck と AI 分解案のハンドルが `GripVertical` になり、上下移動ボタンがない。
- On Deck はポインターとキーボードで並べ替えられ、ドロップ後すぐに新順序が表示される。保存成功後と reload 後も維持される。
- On Deck の mutation または token 取得が失敗するとドラッグ前の順序へ戻り、alert 通知が表示される。
- AI 分解案は現在の pointer / keyboard 操作、編集、削除、キャンセル、確定を保ち、画面順で確定される。確定失敗時も内容と順序が残る。
- Task 本文、checkbox、編集・完了・削除メニュー、Now への移動、Backlog と今日完了した Task の表示・操作に回帰がない。
- desktop / mobile 幅でハンドルと隣接メニューが識別・操作できる。
- API、DB、migration、新規 dependency に差分がない。
