---
phase: 18-drag-drop-sorting
plan: 03
subsystem: ui
tags: [@dnd-kit, drag-and-drop, sortable, framer-motion]

# Dependency graph
requires:
  - phase: 18-drag-drop-sorting
    provides: [orderカラム追加、reorderTodoミューテーション、ローカルストレージのreorder実装]
provides:
  - @dnd-kitライブラリのインストールと設定
  - TodoItemコンポーネントのドラッグ機能統合
  - TodoListコンポーネントのDnDContext/SortableContext実装
  - ドラッグハンドルによるタスク並び替えUI
affects: [18-04]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/core@6.3.1", "@dnd-kit/sortable@10.0.0", "@dnd-kit/utilities@3.2.2"]
  patterns: [dnd-kit統合パターン、PointerSensor activationConstraint、Framer Motionとの統合]

key-files:
  created: []
  modified: [package.json, src/components/todos/TodoItem.tsx, src/components/todos/TodoList.tsx]

key-decisions:
  - "SortableContextのitemsに全todosを使用（filteredTodosではない）ことでフィルタリング中も正しい位置計算を維持"
  - "motion.divを外側のdivでラップしdnd-kitのtransformを制御することでFramer Motionのlayout propと共存"
  - "PointerSensorのactivationConstraintを8pxに設定しクリック誤検出を防止"

patterns-established:
  - "DnD統合パターン: DndContext > SortableContext > useSortableフック"
  - "ドラッグ中の視覚フィードバック: opacity変更 + z-index昇格"
  - "Framer Motionのlayout propとdnd-kitのtransform分離"

requirements-completed: [DND-01]

# Metrics
duration: 12min
completed: 2026-03-25
---

# Phase 18 Plan 03: DnD UI統合 Summary

**@dnd-kit/coreライブラリを導入し、TodoItem/TodoListコンポーネントにドラッグ&ドロップ機能を統合。Framer Motionのアニメーションとdnd-kitのtransformを共存させ、ドラッグハンドルによるタスク並び替えUIを実現**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-25T00:00:00Z
- **Completed:** 2026-03-25T00:12:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- @dnd-kit/core、@dnd-kit/sortable、@dnd-kit/utilitiesのインストールと設定
- TodoItemコンポーネントへのuseSortableフック統合とドラッグハンドルのイベントバインド
- TodoListコンポーネントへのDndContext/SortableContext追加とonDragEnd実装
- TypeScriptコンパイルエラーの修正（type-only import、暗黙的any型の修正）

## Task Commits

Each task was committed atomically:

1. **Task 1: @dnd-kitライブラリをインストール** - `bd41366` (feat)
2. **Task 2: TodoItemにuseSortableフックを統合** - `51596b8` (feat)
3. **Task 3: TodoListにDndContextとSortableContextを追加** - `0639122` (feat)

## Files Created/Modified

- `package.json` - @dnd-kit/core、@dnd-kit/sortable、@dnd-kit/utilitiesを追加
- `src/components/todos/TodoItem.tsx` - useSortableフックを統合しドラッグ機能を実装、ドラッグハンドルにlisteners/attributesをバインド
- `src/components/todos/TodoList.tsx` - DndContext/SortableContextを追加しonDragEndでreorderTodoを呼び出し

## Decisions Made

- SortableContextのitemsに全todos（filteredTodosではない）を使用し、フィルタリング状態に関わらず正しい位置計算を維持
- motion.divを外側のdivでラップしdnd-kitのtransformを制御することで、Framer Motionのlayout propとexpandInVariantsを維持
- PointerSensorのactivationConstraintを8pxに設定し、クリック時の誤検出を防止

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScriptコンパイルエラーを修正**
- **Found during:** Task 3 (TodoList修正後のビルド確認)
- **Issue:** DragEndEventがtype-only importが必要、暗黙的any型が検出された
- **Fix:** DragEndEventをtype-only importに変更、todos.findIndexのコールバックに型アノテーションを追加
- **Files modified:** src/components/todos/TodoList.tsx
- **Verification:** npm run buildが成功
- **Committed in:** 0639122 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** TypeScriptの厳格モード対応のための修正。機能に影響なし。

## Issues Encountered

- TypeScriptのverbatimModuleSyntax設定により、DragEndEventのimportで型アノテーションが必要
- todos.findIndexのコールバック引数で暗黙的any型が検出され、明示的な型アノテーションを追加

## User Setup Required

なし - ローカルライブラリのみの追加

## Next Phase Readiness

- 18-04: バリデーションとE2Eテストでドラッグ&ドロップ機能の検証が可能
- ドラッグハンドルでタスクを掴んで移動し、ドロップ後に位置が更新される動作を確認可能

---
*Phase: 18-drag-drop-sorting*
*Completed: 2026-03-25*
