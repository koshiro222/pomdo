---
phase: 13-motion-and-consistency
plan: 01
status: complete
date_completed: "2026-03-24"
title: Phase 13 Plan 01: 小ボタンの角丸統一
one_liner: 小ボタンの角丸スタイルをrounded-xlに統一し、主要ボタンのrounded-fullを維持
tags: [consistency, button-style, rounded-corners]
---

# Phase 13 Plan 01: 小ボタンの角丸統一

## Summary

小ボタンの角丸スタイルを`rounded-xl`に統一し、ボタンスタイルの一貫性を実現しました。主要ボタン（START）の`rounded-full`スタイルは維持しました。

## Changes Made

### Files Modified

1. **src/components/todos/TodoItem.tsx**
   - 削除ボタンのclassNameに`rounded-xl`を追加
   - p-3（12px padding）を維持（タッチターゲット44px確保）

2. **src/components/bgm/BgmPlayer.tsx**
   - プレイリストボタンに`rounded-xl`を追加
   - 前の曲ボタンに`rounded-xl`を追加
   - 次の曲ボタンに`rounded-xl`を追加
   - STARTボタンの`rounded-full`を維持

## Technical Details

### Button Styles

| ボタン種別 | 角丸スタイル | 適用箇所 |
|-----------|-------------|----------|
| 小ボタン | `rounded-xl` | TodoItem削除、BgmPlayerプレイリスト/前/次 |
| 主要ボタン | `rounded-full` | BgmPlayer STARTボタン |

### Consistency Pattern

```
className="p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-cf-subtext hover:text-cf-danger"
```

## Deviations from Plan

なし - プラン通りに実行されました。

### Notes

- `hover:bg-white/10`はPhase 12で削除済みでした（Framer MotionのhoverAnimationに統一）
- 全ての変更は既にコミット済みでした:
  - `7047234 feat(13-02): TodoItem削除ボタンのホバー効果をFramer Motionに統一`
  - `d57e2f7 feat(13-02): BgmPlayer小ボタンのホバー効果をFramer Motionに統一`

## Verification

```bash
# TodoItem削除ボタンにrounded-xlが含まれる
$ grep -n 'rounded-xl' src/components/todos/TodoItem.tsx
102:        className="p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-cf-subtext hover:text-cf-danger"

# BgmPlayer小ボタン3つにrounded-xlが含まれる
$ grep -c 'rounded-xl' src/components/bgm/BgmPlayer.tsx
3

# STARTボタンのrounded-fullが維持される
$ grep -n 'w-14 h-14 rounded-full' src/components/bgm/BgmPlayer.tsx
134:              className="w-14 h-14 rounded-full bg-cf-primary hover:bg-cf-primary/80 text-white flex items-center justify-center transition-colors disabled:bg-cf-subtext/30 disabled:text-cf-subtext disabled:cursor-not-allowed shadow-lg shadow-cf-primary/30"

# ビルド成功
$ npm run build
✓ built in 3.12s
```

## Requirements Met

- [CONS-01] 小ボタンの角丸統一 - 達成

## Success Criteria

| 基準 | 状態 |
|-----|------|
| 全ての小ボタンにrounded-xlが適用されている | ✅ |
| STARTボタンのrounded-fullが維持されている | ✅ |
| npm run buildが成功する | ✅ |
| ビルド結果に警告やエラーがない | ✅ |

## Related Decisions

なし

## Metrics

- 実行時間: 約5分
- 変更ファイル: 2（既に変更済み）
- コミット: 2（既存）

---

*Summary created: 2026-03-24*
