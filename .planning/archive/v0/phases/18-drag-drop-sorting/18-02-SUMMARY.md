---
phase: 18-drag-drop-sorting
plan: 02
subsystem: storage
tags: [localStorage, zustand, order, reorder, guest-mode]

# Dependency graph
requires:
  - phase: 17-layout-animation-improvements
    provides: TodoListコンポーネントのDOM構造確定、アニメーション実装
provides:
  - Todo型にorderフィールドを追加（storage.ts、todos.ts）
  - storage.reorder()メソッドでlocalStorage内のタスク並び替え
  - useTodos.reorderTodo()メソッドでゲスト/ログイン双方の並び替え操作を統一
affects: [dnd-ui-implementation, trpc-reorder-mutation]

# Tech tracking
tech-stack:
  added: []
  patterns: orderフィールドによる配列順序管理、reorderメソッドでの配列再採番

key-files:
  created: []
  modified:
    - src/lib/storage.ts
    - src/hooks/useTodos.ts
    - src/core/store/todos.ts

key-decisions:
  - "NewTodo型からorderフィールドを除外（addTodo内部で自動採番）"
  - "getTodosで古いデータにorderを付与（createdAt順の後方互換）"

patterns-established:
  - "Pattern 1: orderフィールドによる配列順序管理"
  - "Pattern 2: reorderメソッドでの配列再採番（splice forEach）"

requirements-completed: [DND-02]

# Metrics
duration: 2min
completed: 2026-03-24
---

# Phase 18 Plan 02: ゲストモードorder永続化とuseTodos.reorderTodo実装 Summary

**orderフィールド付きTodo型、storage.reorder()メソッド、useTodos.reorderTodo()メソッドにより、ゲストモードでのタスク並び替え順序永続化とゲスト/ログイン統一インターフェースを実現**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T19:25:00Z
- **Completed:** 2026-03-24T19:26:18Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Todo型にorderフィールドを追加（storage.ts、todos.ts双方）
- storage.reorder()メソッドでlocalStorage内のタスク配列を並び替え・再採番
- useTodos.reorderTodo()メソッドでゲスト（storage）とログイン（tRPC）の統一インターフェース
- 古いデータへのorderフィールド付与（後方互換）

## Task Commits

Each task was committed atomically:

1. **Task 1: storage.tsにorderフィールドとreorderメソッドを追加** - `5c658cb` (feat)
2. **Task 2: useTodos.tsにreorderTodoメソッドを追加** - `014ff02` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `src/lib/storage.ts` - Todo型にorderフィールド追加、addTodoで自動採番、getTodosで後方互換、reorderメソッド実装
- `src/hooks/useTodos.ts` - reorderTodoメソッド追加（ゲスト時storage、ログイン時tRPC）
- `src/core/store/todos.ts` - Todo型にorderフィールド追加、reorderLocalTodoアクション追加

## Decisions Made

- **NewTodo型からorderフィールドを除外**: addTodo内部で自動採番（最大order + 1）するため、外部から指定する必要がない
- **getTodosで古いデータにorderを付与**: orderフィールドがない既存データに対して、createdAt順でorderを付与し後方互換を確保
- **reorderメソッドでorder値を再採番**: 配列操作後、全タスクのorder値を0から連番で再採番し、整合性を維持

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] NewTodo型からorderを除外**
- **Found during:** Task 2 (ビルド検証)
- **Issue:** NewTodo型がorderを含んでいたため、addTodo呼び出し側でorder指定が必要になり、コンパイルエラー
- **Fix:** NewTodo定義を`Omit<Todo, 'id' | 'order' | 'createdAt' | 'updatedAt'>`に変更し、orderを除外
- **Files modified:** src/lib/storage.ts
- **Committed in:** 5c658cb (Task 1 commitの一部として修正)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** 型定義の修正は必要な正確性修正。スコープクリープなし。

## Issues Encountered

- ビルドエラー: NewTodo型がorderを含んでいたため、useTodos.tsのaddTodo呼び出しで型エラー → NewTodo定義からorderを除外して解決

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- orderフィールドとreorderロジックが実装完了
- 次はPlan 03でtRPCルーター側のreorder mutation実装、Plan 04でDnD UI実装
- ストアとフックの準備完了、API側実装へ移行可能

---
*Phase: 18-drag-drop-sorting*
*Plan: 02*
*Completed: 2026-03-24*
