---
phase: 17-layout-animation-improvements
plan: 01
subsystem: ui
tags: [framer-motion, animation, layout, todo]

# Dependency graph
requires: []
provides:
  - expandInVariants: height展開+opacityフェードインの新規Todoアニメーション
  - TodoItem layout prop: 既存アイテムのスムーズなレイアウトアニメーション
affects: [18-drag-drop-sorting]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Framer Motion layout prop for smooth layout transitions"
    - "Height 0→auto expansion with staggered opacity animation"

key-files:
  created: []
  modified:
    - src/lib/animation.ts
    - src/components/todos/TodoItem.tsx

key-decisions:
  - "layout単体使用（layout=\"position\"ではない）: 既存アイテムがスムーズにスライドする"
  - "initialをisNew条件付きでfalseに設定: ページリロード時に既存タスクがアニメーションしない"

patterns-established:
  - "展開アニメーションパターン: height 0→auto + opacity 0→1 + marginBottom制御"
  - "条件付き初期アニメーション: isNew propで新規/既存アイテムを区別"

requirements-completed: [ANIM-01, ANIM-02]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 17 Plan 1: TodoItemアニメーション改善 Summary

**Framer Motionのlayout propとheight展開アニメーションで、新規Todo追加時のスムーズなレイアウト変化を実現**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T17:59:30Z
- **Completed:** 2026-03-24T18:02:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- TodoItemにlayout propを追加し、新タスク追加時に既存アイテムがスムーズに下へスライドするように
- expandInVariantsバリアントを実装し、height 0→auto + opacity 0→1の展開アニメーションを実現
- ページリロード時に既存タスクがアニメーションしないようinitial条件を最適化

## Task Commits

Each task was committed atomically:

1. **Task 1: expandInVariantsをanimation.tsに追加** - `2197fd9` (feat)
2. **Task 2: TodoItemにlayout propとexpandInVariantsを適用** - `be7bee7` (feat)

## Files Created/Modified

- `src/lib/animation.ts` - expandInVariantsバリアントを追加（hidden/visible/exit状態、height/opacity/marginBottomアニメーション）
- `src/components/todos/TodoItem.tsx` - layout prop追加、variantsをexpandInVariantsに変更、initial条件をisNewに連動

## Decisions Made

- layout propを単体で使用（layout="position"ではない）: 既存アイテムが自然にスペースを空ける動作を実現
- initial={isNew ? 'hidden' : false}に設定: ページリロード時に既存タスクがアニメーションしないように（'visible'ではなくfalse）
- marginBottom: 12をvisible状態に含める: gap-3相当のスペースをアニメーションと連動

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ANIM-01/ANIM-02の要件を完了
- Phase 17-02（レイアウト構造変更）の実装準備完了
- layout propが追加されたため、D&D並び替え（Phase 18）でのレイアウト変化もスムーズに動作する見込み

---
*Phase: 17-layout-animation-improvements*
*Plan: 01*
*Completed: 2026-03-25*
