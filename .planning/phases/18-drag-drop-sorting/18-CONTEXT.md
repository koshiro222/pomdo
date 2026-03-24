# Phase 18: ドラッグ&ドロップ並び替え - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

タスクのドラッグ&ドロップによる並び替え機能と、その順序の永続化を実装する。

**機能範囲:**
- ドラッグハンドルによるタスクの並び替え（既存のGripVerticalアイコンを使用）
- 並び替え順序の保存（ログインユーザー: DB、ゲスト: localStorage）
- フィルタリング状態（All/Active/Done）に関わらずD&D有効

**新機能追加ではなく、既存TodoListへのD&D機能追加が範囲。**

</domain>

<decisions>
## Implementation Decisions

### DND-01: ドラッグ&ドロップライブラリ
- `@dnd-kit/core` + `@dnd-kit/sortable` を使用
- 理由: React 18対応、Framer Motionの`layout` propと併用可能、パフォーマンス良好
- `SortableContext`、`useSortable`、`arrayMove`を使用

### 順序データモデル
- **orderカラム型**: 整数（integer）
- **初期値**: 新規タスクは `最大order + 1`（リスト末尾追加、Phase 17の動作を維持）
- **既存データ移行**: createdAt順でorderを割り当て（0, 1, 2...）
- **更新戦略**: 移動範囲内のみorderを更新（効率的）

### ドラッグ中のビジュアルフィードバック
- **アニメーション**: Framer Motionの`layout` propを活用し、ドラッグ中に他のアイテムがスムーズにスライド
- **ドラッグ中のアイテム**: dnd-kitのデフォルトスタイル（半透明+影）
- **フィルタリング時**: 常にD&D有効（All/Active/Done全タブで操作可能）

### DND-02: 永続化と同期
- **更新タイミング**: `onDragEnd`即時更新
- **楽観的更新**: なし（ドロップ完了後にAPI呼び出し）
- **ゲスト→ログイン移行**: ローカルストレージのorder値をDBに保持（MigrateDialog経由）

### Claude's Discretion
- ドラッグ中のアイテムの具体的なスタイル（opacity、scale等）
- プレースホルダーの詳細デザイン
- エラー発生時のロールバック処理
- 完了済みタスクのD&D可否（基本的には有効だが、UX判断で制限しても良い）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 要件定義
- `.planning/REQUIREMENTS.md` — DND-01, DND-02
- `.planning/ROADMAP.md` §Phase 18 — Success Criteria

### 変更対象ファイル
- `functions/lib/schema.ts` — todosテーブルにorderカラム追加
- `src/app/routers/todos.ts` — reorder mutation追加、getAllにorderBy追加
- `src/lib/storage.ts` — Todo型にorder追加、reorderメソッド追加
- `src/hooks/useTodos.ts` — reorderTodoメソッド追加
- `src/components/todos/TodoList.tsx` — DndContext、SortableContext追加
- `src/components/todos/TodoItem.tsx` — useSortableフック追加

### 先行フェーズのコンテキスト
- `.planning/phases/12-physical-interaction/12-CONTEXT.md` — ドラッグハンドル実装詳細
- `.planning/phases/17-layout-animation-improvements/17-CONTEXT.md` — layout prop、AnimatePresence

### 外部ドキュメント
- `@dnd-kit/core` ドキュメント — https://docs.dndkit.com/
- `@dnd-kit/sortable` ドキュメント — https://docs.dndkit.com/presets/sortable

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **GripVerticalアイコン** — lucide-reactからインポート済み（TodoItem.tsx L5）
- **layout prop** — TodoItemに既に実装（Phase 17）。ドラッグ中のスムーズスライドに活用
- **AnimatePresence mode="popLayout"** — TodoListに既に実装（Phase 17）

### 既存のドラッグハンドル（TodoItem.tsx L55-62）
```tsx
<motion.button
  {...tapAnimation}
  onClick={(e) => e.stopPropagation()}
  className="opacity-30 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing text-cf-subtext"
>
  <GripVertical className="text-sm" />
</motion.button>
```
- このボタンに`useSortable`の`attributes`、`listeners`を追加

### Established Patterns
- **Framer Motion + dnd-kit併用**: layout propはmotion.divに付与、DnDは通常のdivでラップ
- **タッチターゲット**: p-3以上のパディングで44px以上（Phase 12決定）
- **ゲスト/ログイン分岐**: useAuthのuser有無で分岐（CONVENTIONS.md参照）

### Integration Points
- **DBスキーマ変更**: todosテーブルに`order integer NOT NULL DEFAULT 0`追加
- **tRPCルーター**: `reorder` mutation追加（{ id, newOrder }）を受け取り、該当範囲のorderを更新
- **localStorage**: Todo型に`order: number`追加、`reorder`メソッド追加
- **useTodos**: `reorderTodo(id, newOrder)`メソッド追加、ゲスト/ログイン分岐

### Current Issues
- todosテーブルにorderカラムが存在しない
- Todo型（storage.ts）にorderフィールドがない
- tRPCルーターにreorderエンドポイントがない
- TodoListにDnDロジックが実装されていない

</code_context>

<specifics>
## Specific Ideas

### 並び替えアルゴリズム（移動範囲内更新）
```
現在: [A(0), B(1), C(2), D(3), E(4)]
操作: C(2) → 位置0へ
結果: [C(0), A(1), B(2), D(3), E(4)]

更新範囲: 位置0〜2のorderのみ書き換え
```

### dnd-kit + Framer Motion 併用パターン
```tsx
<SensorContext.Provider>
  <DndContext>
    <SortableContext items={todos}>
      {todos.map(todo => (
        <SortableItem key={todo.id} todo={todo} />
      ))}
    </SortableContext>
  </DndContext>
</SensorContext.Provider>
```

### 既存データ移行（マイグレーション）
```sql
-- createdAt順でorderを割り当て
WITH ordered_todos AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as row_num
  FROM todos
)
UPDATE todos SET order = ordered_todos.row_num
FROM ordered_todos WHERE todos.id = ordered_todos.id;
```

</specifics>

<deferred>
## Deferred Ideas

- サブタスクの並び替え — 別Issue
- リスト間のタスク移動（Current Task ↔ Todoリスト） — 別Issue
- キーボードショートカットでの並び替え — v2検討
- ドラッグ中にタスクを一時的に「固定」する機能 — 要望があれば検討

</deferred>

---

*Phase: 18-drag-drop-sorting*
*Context gathered: 2026-03-25*
