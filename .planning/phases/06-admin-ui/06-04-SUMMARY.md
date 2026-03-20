---
phase: 06-admin-ui
plan: 04
subsystem: BGM管理UI
tags: [dialog, integration, ui]
dependency_graph:
  requires:
    - "06-02: AddTrackForm"
    - "06-03: TrackList + Edit/Delete Dialogs"
  provides:
    - "TrackItem with fully connected edit/delete dialogs"
  affects:
    - "AdminPage BGM management workflow"
tech_stack:
  added: []
  patterns:
    - "AnimatePresence for conditional dialog rendering"
    - "Portal-based modals"
key_files:
  created: []
  modified:
    - path: "src/components/bgm/TrackItem.tsx"
      changes: "Replaced placeholder with actual EditTrackDialog and DeleteConfirmDialog components"
decisions: []
metrics:
  duration_seconds: 26
  completed_date: "2026-03-20T20:15:09Z"
---

# Phase 06 Plan 04: TrackItemへのダイアログ接続 Summary

**One-liner:** TrackItemのプレースホルダーをEditTrackDialogとDeleteConfirmDialogに置き換え、編集・削除機能を完全に接続

## Objective

TrackItem.tsxの77-83行目に残っていたプレースホルダーを削除し、既に実装済みのEditTrackDialogとDeleteConfirmDialogを接続して、トラック編集・削除UIを完成させる

## Implementation

### Task 1: TrackItemにダイアログコンポーネントを接続

**Files modified:**
- `src/components/bgm/TrackItem.tsx`

**Changes:**
1. インポート追加:
   - `AnimatePresence` from framer-motion
   - `EditTrackDialog` from './EditTrackDialog'
   - `DeleteConfirmDialog` from './DeleteConfirmDialog'

2. プレースホルダー（77-83行目）を実際のダイアログコンポーネントに置き換え:
   ```tsx
   <AnimatePresence>
     {showEditDialog && (
       <EditTrackDialog
         track={track}
         onClose={() => setShowEditDialog(false)}
       />
     )}
     {showDeleteConfirm && (
       <DeleteConfirmDialog
         track={track}
         onClose={() => setShowDeleteConfirm(false)}
       />
     )}
   </AnimatePresence>
   ```

**Technical details:**
- AnimatePresenceで囲むことで、ダイアログのアニメーションが正しく機能
- EditTrackDialogはBgmTrack型を期待しているが、TrackItemのTrack型と互換性がある
- DeleteConfirmDialogも同様に互換性がある

## Deviations from Plan

### Auto-fixed Issues

なし - 計画通りに実行されました

## Verification

1. 編集ボタン（Edit2アイコン）をクリックするとEditTrackDialogが表示される
2. 削除ボタン（Trash2アイコン）をクリックするとDeleteConfirmDialogが表示される
3. ダイアログ内での操作（更新/削除）が完了すると、ダイアログが閉じる
4. 操作後、TrackListが更新される（tRPC invalidationによる）

## Success Criteria

- [x] TrackItem.tsxからプレースホルダーが完全に削除されている
- [x] EditTrackDialogとDeleteConfirmDialogが正しくインポートされ、条件レンダリングされている
- [x] 編集・削除機能がエンドツーエンドで動作する

## Files Changed

| File | Lines Changed | Description |
|------|--------------|-------------|
| `src/components/bgm/TrackItem.tsx` | +18 -8 | ダイアログコンポーネントを接続 |

## Next Steps

Phase 06の残りのプランを実行:
- 06-05: 管理者ページのBGMセクション統合

## Auth Gates

なし

## Commits

- `eb93cb0`: feat(06-04): TrackItemにダイアログコンポーネントを接続
  - EditTrackDialogとDeleteConfirmDialogをインポート
  - プレースホルダーを実際のダイアログコンポーネントに置き換え
  - AnimatePresenceでダイアログを囲み、アニメーションを有効化
  - 編集・削除ボタンクリックで各ダイアログが表示されるように実装

## Self-Check: PASSED

- [x] SUMMARY.md file created
- [x] Commit eb93cb0 exists in repository
- [x] All success criteria met
