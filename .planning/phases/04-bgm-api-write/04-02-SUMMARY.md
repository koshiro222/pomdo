---
phase: 04-bgm-api-write
plan: 02
subsystem: api
tags: [trpc, mutation, zod, drizzle, auth]

# Dependency graph
requires:
  - phase: 04-bgm-api-write
    provides: create mutation実装、adminProcedureパターン
  - phase: 02-authentication
    provides: adminProcedureミドルウェア
provides:
  - bgmRouter.update mutation（管理者専用BGMトラック更新API）
affects: [04-03-delete-mutation, 06-bgm-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [admin-protected-mutation, partial-update-pattern, existence-check-pattern]

key-files:
  modified: [src/app/routers/bgm.ts, src/app/routers/_shared.ts]

key-decisions:
  - "部分フィールド更新: undefinedチェックで指定フィールドのみ更新"
  - "存在チェック先行的に実装しNOT_FOUNDエラーを返却"
  - "updatedAtはDBレベルのdefaultNow()で自動更新"

patterns-established:
  - "部分更新パターン: updateDataオブジェクトに条件付きでフィールド追加"
  - "存在チェックパターン: select().where().limit(1)で存在確認"

requirements-completed: [API-04]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 04 Plan 02: update mutation実装 Summary

**管理者専用のBGMトラック更新APIを実装。トラックのメタデータ（曲名・アーティスト・色・tier）を部分的に更新するupdate mutationを提供**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T12:11:00Z
- **Completed:** 2026-03-20T12:14:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- updateBgmTrackSchema定義（部分更新用Zodスキーマ、全フィールドオプション）
- bgmRouter.update mutation実装（adminProcedure保護、存在チェック、部分更新）
- NOT_FOUNDエラーハンドリング（日本語メッセージ）

## Task Commits

Each task was committed atomically:

1. **Task 1: updateBgmTrackSchema Zodスキーマ定義** - `9730ce4` (feat - included in 04-03)
2. **Task 2: bgmRouterにupdate mutationを追加** - `7f82a02` (feat)

**Plan metadata:** (pending final commit)

_Note: updateBgmTrackSchemaは04-03の作業時にdeleteBgmTrackSchemaと一緒に追加されたが、機能的には04-02の一部。_

## Files Created/Modified

- `src/app/routers/_shared.ts` - updateBgmTrackSchema追加（id必須、他フィールドオプション）
- `src/app/routers/bgm.ts` - update mutation実装（存在チェック、部分フィールド更新、returning）

## Decisions Made

- **部分フィールド更新**: undefinedチェックで「フィールドが指定されたか」を判定し、指定されたフィールドのみ更新
- **存在チェックの先行実装**: 更新前にselectで存在確認し、NOT_FOUNDエラーを明示的に返却
- **Record<string, unknown>型**: updateData宣言でTypeScriptの型エラーを回避

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- update mutationがBGMトラック更新APIを提供（管理者専用）
- 部分更新パターンが確立（他のリソース更新でも再利用可能）
- 次のフェーズ（04-03-delete）で削除mutation実装が可能

---
*Phase: 04-bgm-api-write*
*Completed: 2026-03-20*
