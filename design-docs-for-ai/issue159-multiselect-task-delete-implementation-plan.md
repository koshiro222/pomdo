# Issue #159 実装計画: Task の複数選択と一括削除

## 対象

- Issue: [#159 UI改善: タスク一覧の完了チェックを複数選択に置き換え、一括削除できるようにする](https://github.com/koshiro222/pomdo/issues/159)
- スコープ: Issue 全体
- 目的: /app で Now・On Deck・Backlog の未完了 Task を削除対象として複数選択できるようにし、誤完了を防ぎながら一度の確認でまとめて削除する。完了操作、Focus Session、既存のTask操作とデータ不変条件は維持する。

## 現状と設計判断

- TaskList は On Deck、Backlog、Today's Done を表示し、Now は NowCard が独立して表示する。deriveTaskBuckets は現在の Now を On Deck から除くため、Now の選択欄は NowCard に追加する。
- TaskRow の未完了チェックは onComplete を即時実行する。これを削除対象のチェックボックスに置き換え、未完了 Task の完了操作は同じ行の Radix Dropdown Menu に messages.task.complete を使って追加する。NowCard の明示的な「完了」ボタンは維持する。
- Today's Done の行頭には現行どおり押せない完了チェックを表示し、選択用チェックボックスを付けない。Archive は選択 UI の対象外とする。
- 選択IDの Set は /app の AppPage に一時状態として持つ。NowCard と TaskList は同じ状態と選択変更 callback を受け取るため、選択は区分をまたぎ、Backlog を折りたたんでも残る。保存、URL反映、サーバー永続化は行わない。AI分解後の Task も独立した通常Taskとして1件ずつ選択する。
- 未完了 Task を完了したとき、または単件削除に成功したときは該当IDを選択から除く。再取得後に完了・削除済みとなったIDも選択候補から除き、Today's Done が一括削除対象に残らないようにする。
- 一括削除の確認には、既存依存の radix-ui の Dialog を使う。確認画面には件数、Task名の一覧、キャンセル・削除操作を表示し、対象Taskに実行中Focusが結び付いている場合はタイマーと記録への影響を明記する。AppPage は実行中Focusの taskId を TaskList へ渡し、確認対象との一致で注意表示を決める。キャンセルでは選択を維持する。
- 一括削除は新しい tasks.deleteMany mutation と deleteTasks repository 関数で実装する。サーバーで turnstileProcedure を使い、削除条件をユーザーIDと選択Task IDの両方に限定する。既存の単件 tasks.delete と確認操作は残す。
- src/server/db/schema.ts では users.currentTaskId と focusSessions.taskId の外部キーが Task 削除時に SET NULL になる。Focus の実行状態は src/core/store/focus-runtime.ts にあり、削除でタイマーを止めない。完了・中断を記録する際は src/server/routers/focus.ts の既存解決処理がTaskの存在を再確認し、削除済みならTaskなしで保存する。この仕様を変更しない。
- Now を一括削除した場合、Now枠を空にし、自動昇格はしない。既存の次Task提案を表示する場合は、今回削除したIDを除いた On Deck の先頭だけを候補にする。既に表示中の提案が削除対象なら提案を消す。

## 変更後の動作

### 選択

1. Now、On Deck、Backlog の未完了 Task に常時表示する選択チェックボックスを付ける。Now はカード上で選択する。
2. チェックボックスは選択状態だけを更新する。Task の完了、Now変更、編集、並べ替え、ドラッグを発生させない。
3. 選択IDを区分横断で共有し、Backlog を閉じても保持する。チェックボックスには Task 名を含む削除対象選択のアクセシブルネームを付ける。選択数は読み上げ可能な状態領域で伝える。
4. 選択が1件以上ある時だけ、選択数と一括削除操作を TaskList 上部に表示する。削除操作のアクセシブルネームにも選択件数を含める。
5. Today's Done と Archive には選択操作を表示しない。Today's Done の押せない完了チェックは残す。
6. 分解確定後の各 Task はほかの Task と同じチェックボックスで個別選択する。分解単位のグループ選択は追加しない。

### 完了

- 未完了 TaskRow の即時完了チェックを選択チェックボックスに置き換える。
- Dropdown Menu に「完了」を追加し、既存 tasks.complete mutation と完了後の再取得を使う。
- 完了したTaskは選択から解除し、Today's Done に移った後は選択できないようにする。
- NowCard の「完了」操作と Today's Done の表示を維持する。
- TaskRow のタイトル操作、編集、Nowへの移動、On Deck の上下移動とドラッグ、単件削除は維持する。

### 一括削除と確認

- 選択操作後に一括削除を選ぶと、件数と選択されたTask名をすべて示す確認Dialogを1回だけ開く。Task名は一覧として表示し、長い一覧をスクロールできるようにする。
- 実行中Focusの taskId が選択IDに含まれるときは「Taskを削除してもタイマーは続き、Focus SessionはTaskに紐づかない記録になる」ことをDialogに表示する。タイマーを止めたり、実行状態を消したりしない。
- キャンセル、Dialogの閉じる操作、EscapeではTaskを変更せず、選択も維持する。
- 確認後は選択IDをまとめて送信する。サーバーは選択されたTaskだけを、現在の認証ユーザー所有分に限って削除する。別ユーザーのTask、未選択Task、Focus Session の行は削除しない。
- mutation 成功時だけ選択を解除し、Task一覧、Review集計、Focus Session一覧を再取得する。Nowを削除したときは枠を空のままにし、自動で次TaskをNowへ移さない。
- 通信/API失敗時は成功扱いにせず、エラーを通知し、選択を維持したままTask一覧を再確認できるように再取得する。単件削除はこれまでどおり利用できる。

## 実装手順

1. CONTEXT.md、docs/adr/0006-derived-task-state.md、docs/adr/0008-flat-task-decomposition.md、対象ソースとテストを読み直す。これらのドメイン資料は用語と維持する不変条件の確認に使い、変更しない。
2. TaskRow の props を、未完了Task向け選択状態・選択変更 callback と、完了 callback に分ける。未完了行頭は controlled checkbox にし、完了済み行は現在の disabled check 表示にする。未完了行のDropdown Menuに messages.task.complete を追加する。選択チェックのクリックが task-main、完了、ドラッグ・並べ替え操作へ伝播しないようにする。
3. AppPage に選択IDの Set を持たせ、NowCard と TaskList へ渡す。選択可能IDは currentTask、taskList.onDeck、taskList.backlog から作る。データ更新後に選択IDをこの集合と同期させ、完了済み・削除済みTaskを選択状態から除く。TaskList内の行完了・単件削除、および AppPage内のNow/詳細シートの単件削除成功でも、対象IDを共通の選択解除処理に渡す。
4. TaskList の On Deck / Backlog / Today's Done の描画で選択状態と callback を TaskRow に渡す。Done rows には選択callbackを渡さない。Backlogの開閉状態は既存のローカル状態に保ち、開閉によって親の選択IDを変えない。
5. TaskList 上部に選択数と一括削除ボタンを表示し、選択IDから現在のTaskデータとTask名を引いて確認Dialogを開く。件数が0なら操作バーとDialogを表示しない。
6. 新規 src/components/tasks/TaskBulkDeleteDialog.tsx を作る。既存 TaskDetailsSheet.tsx と同じ radix-ui の Dialog.Root / Portal / Overlay / Content / Title / Description の構成を使い、初期フォーカス、閉じる時のフォーカス復帰、フォーカス閉じ込め、Escape、Cancelを確認する。選択Task名の一覧を読み上げ可能にし、実行中Focusの注意を説明に含める。pending中は確定を再実行できないようにする。
7. src/messages.ts に選択用のアクセシブルネーム、選択件数、一括削除ボタン、確認Dialogの件数・説明・Focus注意、処理中、API失敗の文言を追加する。単件 deleteConfirm と既存の表示文言は維持する。
8. src/server/repositories/task-repository.ts に deleteTasks(db, userId, taskIds) を追加する。Drizzle の inArray(tasks.id, taskIds) と eq(tasks.userId, userId) をAND条件にした単一 DELETE を発行し、削除できたIDを .returning({ id: tasks.id }) で返す。空配列は安全に [] を返す。既存 deleteTask の単件処理は変更しない。
9. src/server/routers/tasks.ts にUUID配列を1件以上受け取る tasks.deleteMany を追加する。既存 taskIdInput の Turnstile token と同じ扱いの入力スキーマを作り、turnstileProcedure でユーザー認証・Turnstile保護を適用する。deleteTasks(ctx.db, ctx.user.id, input.ids) の結果IDを返し、該当IDが0件なら既存 delete に揃えた失敗応答にする。routerからTask以外のFocusデータを削除しない。
10. 一括mutationとDialogの開閉・失敗状態は TaskList に置く。確認確定時に tasks.deleteMany.useMutation() を呼び、成功時に AppPage へ削除IDを通知して選択を解除し、Task一覧を更新する。Now削除後の nextTaskSuggestion は AppPage が管理し、削除IDを除いた現在の On Deck から最初のTaskを候補にする（候補がなければ提案を消す）。Nowは自動昇格しない。削除前から表示中の候補も削除IDに含まれていれば消す。失敗時はDialogを閉じ、TaskList内のrole=alertで失敗を通知し、選択を残したまま AppPage の refresh callback でTask/Review/Session情報を再取得する。再取得で削除済み・完了済みIDが分かった場合は選択可能集合との同期で取り除く。
11. src/index.css に選択チェック、選択中の行、NowCard上の選択操作、操作バー、Dialog内Task一覧のスタイルを追加する。既存 .task-row / .check の完了表示、.task-main 操作、ドラッグハンドル、NowCardの完了ボタンを壊さない。390px幅で件数と削除ボタンが操作しやすく折り返すことを確認する。
12. 下記のunit / repository / integration / E2Eテストを追加・更新した後、ルート CLAUDE.md「品質管理」の順番を上から実行し、最後に手動ブラウザー確認を行う。

## 変更対象ファイル

### アプリケーション

- src/components/app/AppPage.tsx: 選択ID、選択可能Taskの導出と再取得後の同期、実行中Focus taskIdのTaskListへの受け渡し、Now削除後の提案処理を持つ。既存のFocus runtime操作・完了/中断処理と単件削除callbackを維持し、選択中の完了・削除はIDを解除する。TaskListから削除成功IDを受けて選択と提案を更新する。
- src/components/app/NowCard.tsx: 未完了Nowを選択するチェックボックスを追加し、既存の編集・完了・Just Focus操作を保つ。
- src/components/tasks/TaskList.tsx: 未完了行へ選択callbackを配り、Today's Done に選択UIを付けない。選択操作バー、deleteMany mutation、確認Dialog、失敗時のrole=alertを置く。AppPageから受け取った実行中Focus taskIdをDialogへ渡し、単件削除・完了・一括削除後に AppPage へ対象IDを通知する。
- src/components/tasks/TaskRow.tsx: 未完了の完了チェックを選択checkboxに置き換え、完了を行メニューに追加する。完了済みTaskは現在の押せないチェック表示を維持する。
- src/components/tasks/TaskBulkDeleteDialog.tsx（新規）: Task名・件数・実行中Focus注意を含む、アクセシブルな一括削除確認を実装する。
- src/messages.ts: 選択、件数、一括削除、Focus注意、処理中・失敗の文言を追加する。
- src/index.css: 選択UI、選択中の行、操作バー、確認Dialogの表示を追加し、mobile/desktopのレイアウトを整える。
- src/server/routers/tasks.ts: Turnstile保護されたUUID配列入力の tasks.deleteMany を追加する。既存の単件 delete を維持する。
- src/server/repositories/task-repository.ts: 所有者IDと選択IDの両方で絞る deleteTasks を追加する。既存 deleteTask は維持する。

### テスト

- src/components/tasks/TaskRow.test.tsx: 未完了checkboxがTask名付きで認識でき、操作時に選択callbackだけを呼ぶこと、完了項目がメニューにあること、完了済み行に選択checkboxがないことを確認する。
- src/components/tasks/TaskBulkDeleteDialog.test.tsx（新規）: 件数・Task名・Focus注意の表示、Cancel/Escapeで onConfirm が呼ばれないこと、確認操作が一度だけ実行されること、pending中に再実行されないことを確認する。
- src/components/tasks/TaskList.test.tsx（新規）: deleteMany の pending / error / success をmockし、pending中の二重送信防止、失敗時の選択維持・alert・refresh、成功時の親通知を確認する。
- src/server/repositories/task-repository.test.ts（新規）: PGliteで所有者の選択Taskだけが消え、未選択Taskと他ユーザーTaskが残ること、Now参照がNULLになること、Focus Sessionの行・時間が残り taskId だけNULLになることを確認する。
- tests/integration/v1-database.test.ts: 既存のTask削除によるFocus Session外部キー動作を維持し、一括repository経由の削除でも同じ履歴保持を確認する。
- tests/integration/v1-task-bulk-delete.test.ts（新規）: PGlite上で tasks.deleteMany のTurnstile入力・ユーザー境界を確認し、Task削除後に既存Focus SessionはtaskIdだけNULLになること、削除前に開始したFocusを完了/中断したSessionもtaskId=NULLで保存されることを確認する。
- tests/e2e/v1-task-bulk-delete.spec.ts（新規）: 匿名ユーザーでNow / On Deck / Backlog横断選択、選択時に完了・Now・順序が変わらないこと、Backlog折りたたみ後の維持、確認に全Task名と件数が出ること、Cancel保持、確定後に選択分だけ削除・選択解除、tasks.deleteMany がエラー応答を返す場合にDialogが閉じてエラーが読み上げられ、選択が残ることを確認する。
- tests/e2e/v1-bootstrap-focus.spec.ts: NowCardの完了ボタン、行メニューからの完了、Today's Done表示、通常のFocus操作が変更後も成立することを確認する。
- tests/e2e/v1-task-decomposition.spec.ts: 分解で生成されたTaskの一部だけを他のTaskと同じ選択UIで削除でき、残りの生成Taskは独立して残ることを確認する。

## 利用APIと一次資料

依存追加は行わない。現行の package-lock.json が解決するバージョンを基準にし、実装前にlockfileが更新されていないことを確認する。

- React / React DOM 19.2.4: useState で選択IDの Set を画面内に保持し、ネイティブ checkbox は controlled input として checked と同期的な onChange を使う。checkboxの値は event.currentTarget.checked から読む。一次資料: [React useState](https://react.dev/reference/react/useState)、[React DOM input](https://react.dev/reference/react-dom/components/input)
- radix-ui 1.6.7: 既存の Dialog API を使い、Dialog.Root、Dialog.Portal、Dialog.Overlay、Dialog.Content、Dialog.Title、Dialog.Description を組み合わせる。Title/Descriptionによる読み上げ、focus管理、Escape動作を利用する。一次資料: [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- @trpc/react-query 11.0.0: 既存と同じ生成hookの trpc.tasks.deleteMany.useMutation() と mutate(input, { onSuccess, onError }) を使う。一次資料: [tRPC React useMutation](https://trpc.io/docs/client/react/useMutation)
- drizzle-orm 0.45.1: inArray と eq / and でIDと所有者を絞り、PostgreSQLの .returning({ id: tasks.id }) で実削除IDを受け取る。一次資料: [Drizzle filters / inArray](https://orm.drizzle.team/docs/operators#inarray)、[Drizzle DELETE / returning](https://orm.drizzle.team/docs/delete)
- src/server/db/schema.ts の onDelete: 'set null' による外部キー動作を使う。スキーマ変更、migration、別のデータ削除処理は追加しない。

## テスト方針

### Unit / component

- TaskRow の選択操作は選択callbackだけを呼び、onComplete / onMoveToNow / onEdit / onMove を呼ばないことを確認する。Tabでcheckboxにフォーカスし、Spaceで選択を切り替え、Enterでフォーカス中の行メニュー項目を実行できることを確認する。
- TaskBulkDeleteDialog をReact Testing Libraryで描画し、削除件数・Task名一覧・Focus注意が accessible name / description として読めること、キャンセルとEscapeでmutationを呼ばないことを確認する。
- 一括mutationの pending / error / success の表示をテストし、失敗時は選択解除や成功表示が起きないことを確認する。ネットワーク呼び出しはmockし、外部APIに依存させない。

### Repository / integration

- PGlite上で複数IDの削除を確認する。削除条件は userId とID集合の両方に適用され、選択外・他ユーザーのTaskを残す。
- Nowが対象なら users.currentTaskId がNULLになる。過去のFocus Sessionは行とdurationを保持し、focus_sessions.task_idだけNULLになる。
- 空ID配列はAPI入力で拒否され、repositoryは安全な空結果を返す。未存在IDや他ユーザーIDを含んでも他ユーザーのデータを変更しない。
- Focus中Task削除後、Focusの完了または中断で既存 focus router がTaskなしのSessionを記録することを検証する。Task削除時にruntimeやFocus履歴を消す実装を追加しない。
- tasks.deleteMany を含むrouter統合テストでは、未検証ユーザーのtokenなし要求が拒否されること、Turnstile確認済み匿名ユーザーが自分のIDだけを削除できることを確認する。別ユーザーIDは削除結果・Task一覧のどちらにも漏らさない。

### E2E

- 実ブラウザーで各区分を横断した選択、折りたたみ維持、確認キャンセル、選択分だけ削除、失敗後の再確認、選択解除を確認する。
- 選択しただけで完了、Now移動、順序変更、Focus状態変化がないことを確認する。行メニューからの完了、NowCardの完了、Today's Done の押せない完了表示が残ることを確認する。
- 分解生成Taskの一部だけを削除し、選択外の生成Task・通常Taskが残ることを確認する。
- Focus中Nowの削除確認に注意が出ること、キャンセルではFocusが継続すること、削除後もStopでき、保存されたFocus SessionがTaskなしで記録されることを確認する。保存行のtaskId確認はrepository/routerテストでも行う。
- キーボードで選択、確認を開く、Cancel、再度開く、削除を行う。checkbox名、選択数 role=status、DialogのTitle/Descriptionをrole/label locatorから確認する。
- 390px幅と1440px幅でNowのcheckbox、選択件数、削除ボタン、Dialogの名前一覧が視認でき、横スクロールや操作不能な重なりがないことを確認する。

## ブラウザーでの手動確認

実装後は現在のcheckoutから配信される開発環境を使う。別worktreeのサーバーを誤って確認しないよう、起動元の作業ディレクトリとportを確認し、必要ならこのcheckoutから npm run dev を起動する。幅390pxのmobile viewportと幅1440pxのdesktop viewportで行う。

1. /app を開き、Now・On Deck・Backlogに未完了Taskを用意する。Now、On Deck、Backlogから1件ずつ選択する。件数が3になり、Now枠、Taskの完了状態、On Deck順序、Focus状態が変わらないことを確認する。
2. Backlogを閉じる。選択件数が維持されることを確認し、一括削除を開く。確認に3件と各Task名が表示されることを確認してCancelする。Taskが残り、チェックと選択件数が維持されることを確認する。
3. Backlogを再度開き、選択を一部変更する。確認を再度開いて表示名を確認し、削除を確定する。選択したTaskだけが消え、未選択Taskが残り、選択数が0に戻ることを確認する。
4. Nowを含む一括削除を行う。NowCardが空になり、自動で別TaskがNowに移らないことを確認する。次Task提案が表示される場合、そのTaskが削除対象に含まれず、削除済み候補が提案に残らないことを確認する。
5. Focus中のNowを選択して削除操作を開く。Task削除後もタイマーが継続しFocus記録がTaskに紐づかない説明があることを確認する。Cancel後にFocusが継続すること、再度確認して削除した後もタイマーが継続すること、完了または60秒以上経過後の中断を記録できることを確認する。
6. 行メニューから未完了Taskを完了し、Today's Doneに移って選択チェックがなく押せない完了表示があることを確認する。NowCardの明示的な完了操作、Task編集、Now移動、並び替え、単件削除も確認する。
7. AI分解を確定し、生成されたTaskから一部だけ選択・削除する。選択外の生成Taskと既存Taskが残ることを確認する。
8. キーボードだけでcheckboxへTab移動し、Spaceで選択、選択数の読み上げ、削除確認Dialog、Cancelと確定を操作する。VoiceOverなどのスクリーンリーダーからTask名付きcheckbox、選択件数、Dialogの名前とFocus注意が読めることを確認する。
9. 別の匿名ユーザーで /app を開き、自分のTaskだけが操作対象になることを確認する。Turnstile保護、他ユーザーTaskとの分離、Focus Session履歴の保持が既存動作のままであることを確認する。

## 品質管理

実装後はルート CLAUDE.md「品質管理」の順番を変えず、失敗を隠さずに行う。

1. npm ci
2. npm run lint
3. npm run typecheck
4. npm test -- --run
5. npm run test:coverage
6. npm run build
7. npm run test:e2e -- --project=chromium
8. Playwright CLIで実画面を操作する。
9. light / dark / system、mobile / desktop、keyboard、reduced-motion / reduced-transparency、ネットワーク断を確認する。
10. rtk git diff --check、旧チェック操作参照の検索、secret混入確認を行う。

この成果物は実装計画のみで、アプリコードは変更しない。上記品質手順は実装を行うエージェントが実行する。

## セルフレビュー履歴

1. Issue受け入れ条件と画面構成を照合し、NowがTaskListに含まれない点、完了・単件削除の選択解除経路、Focus警告をDialogへ渡す経路を明記した。失敗時に成功表示を出さず、選択を維持して再取得する動作と、checkbox・件数・DialogをVoiceOverで確認する手順も追加した。
2. 状態と既存mutationの責務を読み直し、選択IDはAppPage、一括mutation・Dialog・失敗表示はTaskListが持つ構成に整理した。親へ成功IDを返すcallbackと、それぞれのcomponent testの配置を明記した。
3. IssueのFocus要件をサーバー保存境界まで追い、既存履歴の外部キー切り離しと、削除後に完了/中断される実行中Focusの taskId 再解決が別経路だと確認した。新規integration testで両方を区別して検証するようにした。ネイティブcheckboxはSpaceで切り替え、Tabはフォーカス移動、Enterはメニュー項目実行として操作確認を明確にした。

## 実装完了条件

- Now、On Deck、Backlogの未完了Taskが選択でき、Today's Done と Archive は選択できない。Backlogを閉じても選択が残る。
- 選択チェックはTaskを完了せず、Now・順序・Focus状態を変更しない。完了は行メニューから可能で、NowCardの完了とToday's Done の表示を維持する。
- 確認に件数・全Task名・該当時のFocus注意が表示される。キャンセルはデータを変えず、成功後は選択を解除する。失敗時は成功扱いせず、選択と実データを再確認できる。
- 確認後は選択された現在ユーザー所有Taskだけを削除する。Focus Session履歴は残し、Task参照だけをNULLにする。Focus中のタイマーは継続し、その後のSessionはTaskなしで保存される。
- Now削除後に自動昇格しない。次Task提案を出す場合、削除Taskを候補に含めない。
- 既存の単件削除、匿名ユーザー操作、Turnstile保護、ユーザー分離、分解後の独立Task、キーボード・スクリーンリーダー操作、mobile/desktop表示が維持される。
