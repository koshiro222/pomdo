---
phase: 05-player-migration
plan: 01
subsystem: frontend
tags: [trpc, bgm, audio, react]

# Dependency graph
requires:
  - phase: 03-bgm-admin
    provides: bgm.getAll API, tracksテーブル, tRPCルーター
provides:
  - tRPC連携されたBGMフック（ローディング・エラー時のフォールバック、エラー状態返却）
  - DB連携されたトラック取得
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [tRPC useQueryパターン, フォールバックUI]

key-files:
  created: []
  modified: [src/hooks/useBgm.ts]

key-decisions:
  - "errorプロパティはunknown型（tRPCのerror型はError型と互換性がないため）"
  - "フォールバックトラックはFALLBACK_TRACKS定数として実装（既存TRACKS定数と同じ内容）"

patterns-established:
  - "tRPC useQueryパターン: デバッギング時に便利なstaleTime設定"
  - "フォールバックUI: ローディング中またはエラー時に代替コンテンツを表示"

requirements-completed: [FE-01, FE-02, FE-03, FE-04]

# Metrics
duration: 15min
completed: 2026-03-20
---

# Phase 05-01: BGMプレイヤーDB連携移行 Summary

**tRPCのbgm.getAllクエリを使用して、ハードコードされたトラック定数を削除し、DB連携を実現**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-20T00:00:00Z
- **Completed:** 2026-03-20T00:15:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- tRPCのbgm.getAllクエリを使用したトラック取得
- ローディング中またはエラー時にフォールバックトラックを表示する機能
- ハードコードされたTRACKS定数の削除
- 戻り値にloading, errorプロパティの追加

## Task Commits

Each task was committed atomically:

1. **Task 1: useBgmフックをtRPC連携に変更（フォールバック・エラー状態付き）** - `d25b72e` (feat)

**Plan metadata:** N/A

## Files Created/Modified

- `src/hooks/useBgm.ts` - tRPC連携、フォールバック機能、loading/errorプロパティ追加

## Decisions Made

- errorプロパティの型を`Error | null`から`unknown`に変更（tRPCのerror型はError型と互換性がないため）
- フォールバックトラックはFALLBACK_TRACKS定数として実装（既存TRACKS定数と同じ内容）

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered

- TypeScript型エラー: tRPCのerror型がError型と互換性がないため、errorプロパティの型を`unknown`に変更
- マッピング時の型推論エラー: apiTracksの型推論が効かないため、`any`型で回避

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BGMプレイヤーがDB連携されました
- フォールバック機能により、APIエラー時もトラックが表示されます
- 次のフェーズの準備は完了しています

---
*Phase: 05-player-migration*
*Completed: 2026-03-20*
