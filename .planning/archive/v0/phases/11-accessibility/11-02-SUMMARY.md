---
phase: 11-accessibility
plan: 02
subsystem: UI Components
tags: [accessibility, drag-handle, visibility]
dependency_graph:
  requires: [11-00]
  provides: [11-03]
  affects: [src/components/todos/TodoItem.tsx]
tech_stack:
  added: []
  patterns: [hover-reveal, persistent-ui-controls]
key_files:
  created: []
  modified: [src/components/todos/TodoItem.tsx]
decisions: []
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-22"
  files_changed: 1
  lines_changed: 2
---

# Phase 11 Plan 02: ドラッグハンドル常時表示 Summary

ドラッグハンドルを非表示から常時表示に変更し、ユーザーがホバー操作なしでドラッグ可能な要素を認識できるように改善。

## One-Liner
Todoアイテムのドラッグハンドルをopacity-30で常時表示し、ホバー時にopacity-50で強調するNotionパターンを採用。

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | ドラッグハンドル常時表示 (A11Y-03) | 23a4fdf | src/components/todos/TodoItem.tsx |

## Implementation Details

### 変更内容
- **ファイル**: `src/components/todos/TodoItem.tsx`
- **行**: 57
- **変更**: `opacity-0` → `opacity-30`
- **効果**:
  - ドラッグハンドルが常時薄く表示される（30% opacity）
  - ホバー時に50% opacityで強調される
  - ユーザーがホバーなしでドラッグ操作可能な要素を認識できる

### 技術的詳細
```tsx
// 修正前
className="opacity-0 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing text-cf-subtext"

// 修正後
className="opacity-30 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing text-cf-subtext"
```

### UIパターン
Notionのような「常時薄く表示、ホバー時に強調」パターンを採用:
- デフォルト: `opacity-30`（薄く表示）
- ホバー時: `opacity-50`（強調）
- トランジション: `transition-opacity`（滑らかな変化）

## Deviations from Plan

### Auto-fixed Issues

なし - プラン通りに実行されました。

### Auth Gates

なし

## Verification Results

### 自動検証
```bash
grep -q "opacity-30 group-hover:opacity-50" src/components/todos/TodoItem.tsx && echo "PASS" || echo "FAIL"
# PASS: ドラッグハンドルのopacity設定が正しいです
```

### 手動検証（推奨）
1. `npm run dev` で開発サーバーを起動
2. ブラウザで http://localhost:5173 を開く
3. Todoアイテムの左側にドラッグハンドル（縦点線アイコン）が薄く表示されることを確認
4. ホバーなしでハンドルが見えることを確認
5. Todoアイテムにホバーするとハンドルが少し強調されることを確認

## Success Criteria Status

- [x] ドラッグハンドルのopacityがopacity-30に変更されている
- [x] ホバー時のopacity-50が維持されている
- [x] ホバーなしでドラッグハンドルが視認できる
- [x] コードレベルの検証にPASS

## Self-Check: PASSED

```bash
# Created/Modified files
[ -f "src/components/todos/TodoItem.tsx" ] && echo "FOUND: src/components/todos/TodoItem.tsx" || echo "MISSING"

# Commit exists
git log --oneline --all | grep -q "23a4fdf" && echo "FOUND: 23a4fdf" || echo "MISSING"
```

## Next Steps

- 次のプラン: 11-03 ARIAラベルの最適化
- 要件: A11Y-04
- 依存関係: 11-00（カラーコントラスト改善）が完了済み

---
*Summary created: 2026-03-22*
*Plan completed in 3 minutes*
