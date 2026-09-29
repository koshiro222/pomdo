# AI分解はプレビューを経て、既存のTaskをフラットなTask群へ置き換える

## 1. 対象と実装の結論

- 対象Issue: https://github.com/koshiro222/pomdo/issues/151
- Issueタイトル: `[feature] AIによるタスク分解機能を追加する`
- 対象範囲: Issue全体
- 変更の目的: 大きすぎる、または曖昧なTaskを、1ポモドーロで終わる複数の実行可能なTaskへ変換し、着手できる粒度にする

実装は `TaskDetailsSheet` に「AIで分解する」を追加し、AI生成結果をDBへ保存せずに分解案として表示する。ユーザーが編集・削除・並び替えを終えて「確定」を押した時点でだけ、元Taskの削除と新Task群の保存を1つのDBトランザクションとして実行する。

生成物は親子関係を持たない通常のTaskである。`tasks` テーブルに親Task用のカラムは追加しない。コード識別子・テスト名・UIの英語表現は `Decomposition` を使い、`Breakdown`、`Split`、`Subtask` は使わない。これは `CONTEXT.md`、ADR 0008、ADR 0009 の合意に従う。

## 2. 現行コードから確定している前提

既存の構造を利用し、Issue #151以外の認証・Focus・Task分類の設計は変更しない。

- `src/server/db/schema.ts` の `tasks` は `title`、`note`、`estimate`、`plannedFor`、`deckOrder`、`completedAt` を持つ。分解機能のためのスキーマ変更は不要
- `users.currentTaskId` がNowを表し、元Task削除時には外部キーの `ON DELETE SET NULL` が働く
- `src/server/routers/tasks.ts` は `turnstileProcedure` で書き込みを保護している
- `src/server/services/task-service.ts` の `buildDeckOrder` が fractional-indexing による並び順キーを作る
- `src/server/repositories/task-repository.ts` がTaskのDBアクセスを担当する
- `src/components/tasks/TaskDetailsSheet.tsx` は `TaskList` と `AppPage` の2か所から利用される
- `@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/utilities` は既に導入済みで、`TaskList` が `DndContext` / `SortableContext` / `useSortable` を使用している
- DB本番実装は `drizzle-orm/neon-http`、テストDBは `drizzle-orm/pglite`
- ルート `CLAUDE.md` の品質管理は、`npm ci`、lint、typecheck、Vitest、coverage、build、Chromium E2E、Playwrightでの実画面確認の順で実施する

`memo.md` の指示どおり、過去のIssue #148計画は実装根拠にしない。現行コード、Issue #151、`CONTEXT.md`、ADR、公式ドキュメントを根拠にする。

## 3. APIとドメイン契約

### 3.1 tRPC procedure

既存の `tasksRouter` に次の2 mutationを追加する。`src/server/routers/root.ts` はすでに `tasksRouter` をマウントしているため変更しない。

#### `tasks.decomposePreview`

入力:

```ts
{
  id: string
  turnstileToken?: string
}
```

処理:

1. `turnstileProcedure` で認証とTurnstile検証を通す
2. `findTaskById(ctx.db, ctx.user.id, input.id)` で所有権を確認する。存在しなければ `NOT_FOUND`
3. `title` と、存在する場合だけ `note` を分解サービスへ渡す
4. Workers AIの応答を検証し、分解案を返す
5. Taskのinsert、update、deleteや分解結果の永続化は実行しない。既存の `turnstileProcedure` は初回検証時に `users.turnstileVerifiedAt` を更新するため、Issueの「DBに何も書き込まない」は分解対象のTaskデータを書き込まない意味として扱う。この既存のセキュリティマーカーを分解previewだけで特別扱いしない

返却値は次の形に固定する。

```ts
{
  items: Array<{
    title: string
    note: string | null
  }>
}
```

#### `tasks.decomposeConfirm`

入力:

```ts
{
  id: string
  items: Array<{
    title: string
    note?: string | null
  }>
  turnstileToken?: string
}
```

Zodで `id` をUUID、タイトルをtrim後1〜240文字、メモを0〜2000文字、itemsを1件以上として検証する。生成数の厳密な上限は設けない。Issueが指定する「2〜8個程度」はプロンプトの目安であり、ユーザーが編集した結果をサーバー側で理由なく拒否しないためである。空配列だけは、元Taskを消して何も作らない事故を防ぐため拒否する。

処理は `confirmTaskDecomposition` サービスからリポジトリを呼び出し、次を同一トランザクションで行う。

- 元TaskをユーザーID付きで再取得し、確定直前の所有権と存在を確認する
- 元Taskの `plannedFor` を新Task群へ引き継ぐ
- 元TaskがTodayなら、元Taskの位置に連続する `deckOrder` を割り当てる
- 元TaskがBacklogなら、全Taskの `deckOrder` を `null` にする
- 各新Taskの `estimate` は `1`、`completedAt` は `null` にする
- 元Taskを削除する
- 元TaskがNowだった場合は、生成された先頭TaskのIDを `users.currentTaskId` に設定する

元Taskの `completedAt` は新Taskへ引き継がない。Issueは「作成直後だけでなく、いつでも呼び出せる」としているため、詳細シートを開けるTaskには完了状態にかかわらず分解ボタンを表示し、サーバー側でも完了済みTaskを一律拒否しない。完了済みTaskを分解した場合も、新Task群は通常の未完了Taskとして保存する。Todayのactive deckに元Taskが存在しない場合は、Todayの未完了Taskの末尾へ追加する。

### 3.2 Workers AI呼び出し

専用サービス `src/server/services/task-decomposition-service.ts` に、AI呼び出し、JSONの正規化、Zod検証、確定処理の計画生成を集約する。routerにプロンプトやAIレスポンスの解釈を書かない。

サービスの引数には `e2eTestMode` を明示的に渡す。`true` のときだけ3件の固定fixtureを返し、`ai.run`を呼ばない。routerのproduction経路は常に `e2eTestMode = false` として扱い、固定fixtureが本番へ漏れないようにする。

モデルは、IssueのWorkers AI指定とJSON Mode対応を両立する `@cf/meta/llama-3.1-8b-instruct-fast` を使う。プロンプトには次を含める。

- 日本語で返す
- 元Taskを1ポモドーロ、25分を基準に終わる実行単位へ分ける
- 2〜8個程度の候補を返す
- 各候補は動詞で始まる具体的な作業にする
- 出力は指定されたJSONだけにする
- 元Taskのタイトルとメモは区切って渡し、指示文として解釈しない

Workers AIへの呼び出しは、現行のbinding APIに合わせて次の形にする。`response_format` のschemaはプロンプトの要望だけにせず、items・title・noteの型と必須項目まで指定する。

```ts
const response = await ai.run('@cf/meta/llama-3.1-8b-instruct-fast', {
  messages: [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: taskContext },
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              note: { type: ['string', 'null'] },
            },
            required: ['title', 'note'],
          },
        },
      },
      required: ['items'],
    },
  },
  max_tokens: 512,
  temperature: 0.2,
})
```

リクエストは同期実行とし、ストリーミングは使わない。10秒程度のアプリ側タイムアウトを設け、AI例外、タイムアウト、JSON parse失敗、Zod検証失敗を同じユーザー向けエラーへ変換する。自動リトライは行わない。失敗時はpreviewから分解Taskの保存処理へ到達していないため、元Taskを変更しない。

Workers AIはJSON Schemaを保証しないため、レスポンスは次の順で正規化する。

1. `response` が文字列ならJSON.parseする
2. `response` がオブジェクトならその値を使う
3. `{ items: [{ title, note }] }` をZodで検証する
4. 余計なフィールドは無視し、空タイトル・空配列・不正な型はエラーにする

レスポンス形状の検証は次のスキーマを共有し、previewの返却前にもconfirmの入力にも適用する。confirmではクライアント編集後の値を再検証するため、AIの出力を信頼してDBへ保存しない。

```ts
const decompositionProposalSchema = z.object({
  items: z.array(z.object({
    title: z.string().trim().min(1).max(240),
    note: z.string().max(2000).nullable().optional(),
  })).min(1),
})
```

### 3.3 DBの原子性

本番の `drizzle-orm/neon-http` は `db.transaction(async () => ...)` を実行時にサポートせず、複数クエリを `db.batch([...])` でNeonの非対話トランザクションへ送る実装である。したがって、実装で `db.transaction` だけを使ってはならない。

リポジトリに分岐を持つ。

```ts
await database.batch(queries)
```

本番のNeon HTTPでは上記を使い、PGliteの `TestDb` では次を使う。

```ts
await database.transaction(async (transaction) => {
  await transaction.delete(tasks).where(deleteCondition)
  await transaction.insert(tasks).values(replacementTasks)
  await transaction.update(users).set({ currentTaskId: firstTaskId }).where(userCondition)
})
```

クエリは元TaskとToday一覧を事前に読み、生成するTask IDも確定前に作る。これにより、本番の `batch` に渡すクエリを事前に構築できる。PGlite側はトランザクション内で同じ順序を再現する。いずれの経路でも途中のinsert/updateが失敗したら元Task削除を含めてロールバックされる。

Todayの位置計算は次の順で行う。

1. `findDeckTasks` の並びから元Taskを除いた前後Taskを決める
2. `buildDeckOrder(previousKey, nextKey)` 相当の `generateNKeysBetween` で新Task数ぶんのキーを生成する
3. キーの範囲が枯渇した場合は、元Taskを新Task群へ置換したToday一覧全体を `buildDeckOrder(tasks)` で再採番し、既存Taskの更新も同じ原子操作へ含める
4. 生成された配列の先頭を、Todayでは最小の `deckOrder`、Backlogでは確定リストの先頭として扱う

## 4. 実装ブロック

### ブロックA: Workers AIの設定と型を追加する

- `wrangler.toml`: `[ai] binding = "AI"` を追加する
- `worker-configuration.d.ts`: `npx wrangler types` で生成し、AI bindingの型を追跡対象にする
- `tsconfig.functions.json`: 生成型をFunctions/serverのtypecheck対象に含める
- `src/server/context.ts`: `AppEnvironment` にAI bindingを追加する。E2Eのfixture分岐以外ではAI binding必須として扱う
- `src/server/services/task-decomposition-service.ts`: `TaskDecompositionAi` の最小インターフェースを定義し、実AIとテストmockを分離する

Pages本番・Preview環境ではWorkers AI bindingをCloudflare Pages側にも登録する。AI bindingはAPIキーを追加しないため、`.dev.vars.example` へのsecret追加は不要。ローカルのE2Eは後述の `E2E_TEST_MODE=true` fixtureを使い、AI推論を呼ばない。

### ブロックB: 分解サービスとTask置換処理を実装する

- `src/server/services/task-decomposition-service.ts`:
  - `decompositionProposalSchema`
  - `generateTaskDecompositionProposal`
  - AIレスポンスの文字列/object両対応の正規化
  - timeoutとエラーのドメインエラー化
  - `buildTaskReplacementPlan`
  - `confirmTaskDecomposition`
- `src/server/repositories/task-repository.ts`:
  - Todayの前後Task取得に必要な関数を追加または既存関数を再利用する
  - `replaceTaskWithDecomposedTasks` を追加する
  - 既存の `runBatch` はbatch非対応時に逐次実行へフォールバックするため流用しない。`db.batch` とPGliteの `db.transaction` を分岐し、削除・insert・Now更新・必要な既存deck更新を原子化する
- `src/server/services/task-service.ts`:
  - `buildDeckOrder` の既存契約を壊さず、複数キー生成や置換後の並びを計算する純粋関数を追加する場合はここに置く
  - `promoteTaskToNow`、Today/Backlogの導出、fractional-indexingの既存テストを壊さない
- `src/server/routers/tasks.ts`:
  - 上記2 procedureを `turnstileProcedure` で追加する
  - `TRPCError` の公開メッセージを日本語で統一する
  - `decomposeConfirm` の確定処理前に必ず再取得し、preview時のTask削除・別タブでの更新を検出する

同じTaskに対するconfirmの二重送信は、2回目の再取得が `NOT_FOUND` になるため元Taskを再削除しない。クライアントでもconfirm中はボタンをdisabledにする。

### ブロックC: プレビューUIを実装する

- `src/components/tasks/TaskDecompositionPreview.tsx`（新規）:
  - preview開始時に `tasks.decomposePreview` を1回呼ぶ
  - loading、エラー、成功の3状態を表示する
  - 成功後のitemsはローカルstateで保持し、タイトル・メモの編集、個別削除、並び替えを可能にする
  - `DndContext` + `SortableContext` + `useSortable` + `arrayMove` でドラッグ並び替えを実装する
  - キーボード利用者向けに各行へ「上へ」「下へ」ボタンも置く。ドラッグ操作だけを唯一の並び替え手段にしない
  - itemsが0件になった場合は「確定」をdisabledにし、1件以上になるまで確定させない
  - AI候補のタイトル・メモは通常のinput/textareaへ入れ、HTMLとして解釈しない
  - 「キャンセル」で元Taskを残したまま詳細シートへ戻る
  - 「確定」で `tasks.decomposeConfirm` を呼び、成功時に親へ通知する
- `src/components/tasks/TaskDetailsSheet.tsx`:
  - 詳細シートを開けるTaskに「AIで分解する」ボタンを表示する
  - previewの表示状態と詳細編集状態を明確に分ける
  - `onDecomposed` callbackを追加し、確定後に親がシートを閉じて一覧を再取得できるようにする
  - preview中にEscape、キャンセル、親のcloseが起きても元Taskは変更しない
- `src/components/tasks/TaskList.tsx`:
  - `TaskDetailsSheet` に `onDecomposed` を渡す
  - 確定成功後は一覧をrefreshし、元Taskが消えた状態と生成Taskの順序を表示する
- `src/components/app/AppPage.tsx`:
  - Nowから開いた詳細シートにも `onDecomposed` を渡す
  - 元TaskがNowだった場合は古い次Task提案を消し、新しいNowを `tasks.list` の結果から表示する
- `src/messages.ts`:
  - ボタン、見出し、loading、エラー、空状態、削除、確定、キャンセル、並び替えの日本語文言を追加する
  - 「分解案」を未確定の候補に限定して使い、確定後のTaskを「分解案」と呼ばない
- `src/index.css`:
  - preview内の行、ドラッグハンドル、入力、エラー、loading、アクション領域を既存のsheet/cardトークンで追加する
  - light/dark、狭い画面、focus-visible、reduced-motionで既存UIと同じ可読性を保つ

既存の `TaskList` の並び替え実装とは別の一覧なので、既存Taskの `DndContext` を共有しない。プレビュー内のitemsを確定前にサーバーへ送らないことをコード構造で保つ。なおpreviewで許容するDB副作用は、既存middlewareがTurnstile検証済み時刻を記録することだけであり、Taskや分解案は保存しない。

### ブロックD: テストを追加する

- `src/server/services/task-decomposition-service.test.ts`（新規、純粋なservice/mock AI）
  - titleのみ、title + noteがプロンプトへ渡る
  - `response` がJSON文字列の成功
  - `response` がobjectの成功
  - JSON不正、スキーマ不正、空配列、AI例外、timeoutでエラーになる
  - `E2E_TEST_MODE=true` のfixtureは実AIを呼ばず、固定された3件の分解案を返す。productionと同じZod検証を通す
- `src/server/repositories/task-decomposition-repository.test.ts`（新規、`// @vitest-environment node` とPGlite）
  - Todayの元Taskを3件へ置換し、元Taskが削除される
  - Todayの `plannedFor`、連続した `deckOrder`、各 `estimate = 1` を確認する
  - Backlogの `plannedFor = null`、`deckOrder = null` を確認する
  - 元TaskがNowなら先頭Taskが `users.currentTaskId` になる
  - 元TaskがNowでなければ既存Nowを変更しない
  - 完了済みTaskを分解した場合も、元Taskを置換して新Task群が未完了Taskとして保存される
  - insertまたはNow更新が失敗した場合、元Task・既存Task・Nowがロールバックされる
  - 他ユーザーのTask IDを渡しても変更されない
- `src/components/tasks/TaskDecompositionPreview.test.tsx`（新規）
  - loading/error/successが表示される
  - title/noteを編集できる
  - 1項目削除と、上へ/下へ操作で順序が変わる
  - 0件では確定できない
  - confirm成功時に親callbackが呼ばれ、preview中のキャンセルではconfirmされない
  - 生成候補にHTML文字列を渡してもHTMLとして描画しない
- `tests/e2e/v1-task-decomposition.spec.ts`（新規、Chromium）
  - `/app` で未完了Taskの詳細を開き「AIで分解する」を押す
  - preview中も元Taskが残っている
  - 3件のfixture候補を編集、1件削除、キーボード操作で並び替える
  - 確定後に元Taskが消え、生成Taskが表示される
  - 元TaskがNowなら生成された先頭TaskがNowになり、Todayと `1本` のEstimateが表示される
  - 画面リロード後も同じ結果が残る

既存テストは変更箇所との回帰がないか確認する。特に `src/server/services/task-service.test.ts`、bootstrap、Focus、既存E2EのTask編集・並び替え・Now昇格は変更後も通す。

## 5. 現在インストールされているAPIの使い方と一次情報

依存を追加せず、次のバージョンとAPIを使う。

| パッケージ/機能 | 現在のバージョン | 使用するAPI | 一次情報 |
|---|---:|---|---|
| Wrangler | 4.69.0 | `wrangler types`、`[ai] binding = "AI"` | [Wrangler TypeScript types](https://developers.cloudflare.com/workers/languages/typescript/#generate-types)、[Workers AI bindings](https://developers.cloudflare.com/workers-ai/configuration/bindings/) |
| Cloudflare Workers AI | binding API | `env.AI.run(model, input)`、`response_format.type = "json_schema"` | [Workers AI binding](https://developers.cloudflare.com/workers-ai/configuration/bindings/)、[JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/)、[Llama 3.1 8B fast](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fast/) |
| `@trpc/server` | 11.0.0 | `router({...})`、`.input(zodSchema).mutation(...)`、既存 `turnstileProcedure` | [tRPC Define Procedures](https://trpc.io/docs/server/procedures) |
| `drizzle-orm` | 0.45.1 | PGliteの `db.transaction(async (tx) => ...)`、Neon HTTPの `db.batch(queries)` | [Drizzle Transactions](https://orm.drizzle.team/docs/transactions)、[Neon serverless transactions](https://github.com/neondatabase/serverless-js#transactions) |
| `@dnd-kit/core` | 6.3.1 | `DndContext`、`PointerSensor`、`KeyboardSensor`、`closestCenter`、`useSensors` | [dnd-kit core/sortable overview](https://dndkit.com/legacy/presets/sortable/overview/) |
| `@dnd-kit/sortable` | 10.0.0 | `SortableContext`、`useSortable`、`arrayMove`、`sortableKeyboardCoordinates`、`verticalListSortingStrategy` | [dnd-kit Sortable](https://dndkit.com/legacy/presets/sortable/overview/) |
| `@dnd-kit/utilities` | 3.2.2 | `CSS.Transform.toString` | [dnd-kit Sortable item](https://dndkit.com/legacy/presets/sortable/overview/) |
| Zod | 4.1.12 | `z.object`、`z.array`、`safeParse`/`parse` | [Zod](https://zod.dev/) |

Workers AIのJSON ModeはモデルがJSON Schemaを満たすことを保証しないため、schema指定だけで終わらせず、必ずアプリ側でJSON parseとZod検証を行う。JSON Modeはストリーミング非対応なので、previewでは同期応答を待つ。

## 6. 変更対象ファイル一覧

### 新規作成

- `design-docs-for-ai/issue151-ai-task-decomposition-implementation-plan.md`: 本計画
- `worker-configuration.d.ts`: `wrangler types` 生成のWorkers AI binding型
- `src/server/services/task-decomposition-service.ts`: AI呼び出し、レスポンス検証、置換計画、confirm orchestration
- `src/components/tasks/TaskDecompositionPreview.tsx`: 分解案の編集・削除・並び替え・確定UI
- `src/server/services/task-decomposition-service.test.ts`: AIサービスのunit test
- `src/server/repositories/task-decomposition-repository.test.ts`: PGliteでの原子置換テスト
- `src/components/tasks/TaskDecompositionPreview.test.tsx`: preview component test
- `tests/e2e/v1-task-decomposition.spec.ts`: ユーザー視点のChromium E2E

### 変更

- `wrangler.toml`: Workers AI binding追加
- `tsconfig.functions.json`: 生成されたWorkers型をtypecheck対象に追加
- `src/server/context.ts`: `AppEnvironment`へAI bindingを追加
- `src/server/routers/tasks.ts`: `decomposePreview`、`decomposeConfirm`追加
- `src/server/repositories/task-repository.ts`: Todayの位置情報取得と原子Task置換処理追加
- `src/server/services/task-service.ts`: 必要な複数deck key生成・置換後並び計算を純粋関数として追加
- `src/components/tasks/TaskDetailsSheet.tsx`: 分解ボタン、preview表示、`onDecomposed`
- `src/components/tasks/TaskList.tsx`: preview確定後のcallback接続
- `src/components/app/AppPage.tsx`: Nowからの分解後refreshと旧suggestionの破棄
- `src/messages.ts`: 分解UIの日本語文言
- `src/index.css`: 分解previewのレイアウトと状態表示

### 変更しない

- `src/server/db/schema.ts`: 親子関係カラムを追加しない
- `drizzle/0000_v1_initial.sql`、`drizzle/0001_v1_constraints.sql`: DB migration不要
- `src/server/routers/root.ts`: `tasksRouter`は既に登録済み
- `package.json`、`package-lock.json`: 既存のdnd-kitとZodで実装し、依存を増やさない
- `CONTEXT.md`、`docs/adr/0008-flat-task-decomposition.md`、`docs/adr/0009-workers-ai-for-task-decomposition.md`: 既存の用語・判断を実装へ反映する

## 7. 非スコープと安全策

- 階層型の子Task、元TaskへのUndo/復元、作成時の自動提案は実装しない
- 外部LLM API、Anthropic/OpenAI APIキー、独自の利用回数制限・フリーミアムゲートは追加しない
- AI previewでTaskを作らない。確定時に編集済みitemsをサーバーで再検証する
- クライアントから渡された `userId`、`plannedFor`、`deckOrder`、`estimate` は信頼しない。サーバーが元Taskから決める
- Task所有権を全repository queryに含める。別ユーザーのTask IDではpreview/confirmともに変更しない
- AIの候補に機密情報が含まれ得るため、プロンプト、レスポンス、Task本文をログへ出力しない
- APIエラーにはAI応答本文や内部例外を含めず、ユーザーには再試行可能な日本語メッセージだけ返す
- `turnstileProcedure` による検証をpreview/confirmの両方に使う。previewだけ検証してconfirmをprotectedProcedureに落とさない
- E2E fixtureは `E2E_TEST_MODE=true` のときだけ有効にし、本番環境で固定候補を返さない

## 8. 品質管理の実行手順

実装後、ルート `CLAUDE.md` の順序をそのまま実行する。前段が失敗した状態で後段を成功扱いにしない。

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --run`
5. `npm run test:coverage`
6. `npm run build`
7. `npm run test:e2e -- --project=chromium`
8. Playwright CLIで実画面を操作する
9. light/dark/system、mobile/desktop、keyboard、reduced-motion/transparency、ネットワーク断を確認する
10. `rtk git diff --check`、実装対象（`src/`、`functions/`、`tests/`）に旧語（`Breakdown`、`Subtask`、`Split`）が残っていないことの検索、secret混入確認を実行する

DBスキーマは変更しないが、リポジトリのPGlite結合テストとbuildを必ず実行する。Workers AI bindingを変更したら、次の順で生成型も確認する。

```sh
npx wrangler types
npm run typecheck
```

## 9. ブラウザでの動作確認

### 起動

確認対象がこのworktreeのコードであることを確認してから、次を実行する。

```sh
npm run dev:e2e
```

Workers AIの実推論は料金、レイテンシ、出力揺らぎがあるため、ローカルE2Eは `E2E_TEST_MODE=true` の固定3件fixtureを使う。Preview/confirmの画面動作を確認し、AIサービスそのものはunit testのmockで確認する。

### 主フロー

1. `http://localhost:5173/app` を開く
2. On Deckに未完了Taskを追加する
3. Taskのメニューを開き、「AIで分解する」を押す
4. loading表示後、元Taskが画面に残っていることを確認する。ここではDBへ書き込まれていない
5. 生成された3件について、1件目のタイトルとメモを編集する
6. 1件を削除し、残り2件を「上へ」またはキーボード操作で並び替える
7. 「確定」を押す
8. 元Taskが消え、編集済みの2件だけが表示されることを確認する
9. 元TaskがNowだった場合、生成後の先頭TaskがNowカードに表示されることを確認する
10. 各TaskがTodayにあり、Estimateが `0 / 1 本` と表示されることを確認する
11. ページを再読み込みし、元Taskが復活せず、生成Task・順序・Nowが維持されることを確認する

### 失敗・境界確認

- AI fixtureを失敗させるテスト設定でpreviewエラーを表示し、元Taskが残ることを確認する
- previewをキャンセルし、元Taskが残ることを確認する
- 生成候補を全削除し、「確定」が押せないことを確認する
- 完了済みTaskを分解した場合も、元Taskの置換と新Task群の保存が行われることを確認する
- Turnstile tokenがない状態でpreview/confirmを呼ぶと拒否されることを確認する
- Today TaskとBacklog Taskの両方で、`plannedFor` と `deckOrder` の扱いが期待どおりであることを確認する
- 連打、二重confirm、別タブで元Taskを削除してからconfirmするケースで、二重作成されないことを確認する

### 表示と操作性

- desktop/mobileでsheetとpreviewの横幅・スクロール・ボタンが崩れない
- light/dark/systemでAIアクセント、入力、エラーのコントラストが保たれる
- ドラッグハンドルだけでなく、Tab、Enter、Space、上へ/下へボタンで操作できる
- `prefers-reduced-motion` と `prefers-reduced-transparency` で既存のCSS制約に従う
- AI候補の `<script>` などがHTMLとして実行・解釈されない
- Network offline時にconfirm失敗を表示し、元Taskが残る

## 10. 実装着手前の完了条件

実装担当エージェントは、次を満たしてから完了とする。

- TaskDetailsSheetからTaskの分解を開始できる
- previewではTaskや分解案をDBへ保存せず、編集・削除・並び替えができる。既存Turnstile middlewareの検証済み時刻更新は許容する
- confirmはサーバーで再検証され、元Task削除・新Taskinsert・Now更新が原子操作になる
- Today/Backlogの `plannedFor`、Todayの連続 `deckOrder`、Estimate `1` がIssueどおりになる
- 元TaskがNowなら生成先頭TaskがNowになる
- AI失敗、JSON不正、Turnstile未検証、所有権不正、confirm二重送信で元Taskが壊れない
- unit、PGlite、component、Chromium E2E、手動Playwright確認がすべて成功する
- 実装計画に登場する既存ファイル・関数・DBカラムが実在し、新規ファイルが明示されている
- 変更後に `npm run lint`、`npm run typecheck`、`npm test -- --run`、`npm run build`、Chromium E2Eが成功する
