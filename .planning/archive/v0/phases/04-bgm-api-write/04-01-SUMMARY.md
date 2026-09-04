---
phase: 04-bgm-api-write
plan: 01
subsystem: api
tags: [trpc, mutation, r2, base64, zod, auth]

# Dependency graph
requires:
  - phase: 04-bgm-api-write
    provides: R2バケットモック、tRPCテスト用コンテキストヘルパー
  - phase: 02-authentication
    provides: adminProcedureミドルウェア、Context型
provides:
  - createBgmTrackSchema Zodスキーマ（Base64ファイルアップロード用バリデーション）
  - bgmRouter.create mutation（管理者専用BGMトラック作成API）
  - Context.env拡張（R2Bucketバインディング）
affects: [04-02-update-mutation, 05-bgm-player, 06-bgm-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [admin-protected-mutation, base64-file-upload, r2-storage-pattern]

key-files:
  created: [src/global.d.ts]
  modified: [src/app/routers/_shared.ts, src/app/routers/bgm.ts, src/app/routers/context.ts, functions/api/trpc/[[route]].ts, tests/unit/bgm.test.ts]

key-decisions:
  - "Base64デコード後のファイルサイズチェック（10MB制限）"
  - "UUID自動生成でファイル名衝突を回避"
  - "tierデフォルト値'free'をmutation側で明示指定"

patterns-established:
  - "adminProcedureパターン: Context.user.role === 'admin'チェック"
  - "R2アップロードパターン: crypto.randomUUID() → Buffer.from() → BGM_BUCKET.put()"

requirements-completed: [API-03, API-06]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 04 Plan 01: create mutation実装 Summary

**管理者専用のBGMトラック作成APIを実装。Base64エンコードされたMP3ファイルをR2バケットに保存し、メタデータをDBに登録するcreate mutationを提供**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T12:02:45Z
- **Completed:** 2026-03-20T12:04:45Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- createBgmTrackSchema定義（Base64ファイルバリデーション付き）
- bgmRouter.create mutation実装（adminProcedure保護、R2アップロード、DB登録）
- Context型にenvフィールド追加（R2Bucketバインディング）
- テストケース実装（管理/非管理者、ファイルサイズ、UUID生成）

## Task Commits

Each task was committed atomically:

1. **Task 1: createBgmTrackSchema Zodスキーマ定義** - `5f373f0` (feat)
2. **Task 2: bgmRouterにcreate mutationを追加** - `50ac145` (feat)
3. **Task 3: Context型にenvを追加** - `50ac145` (feat - included in Task 2)

**Plan metadata:** (pending final commit)

_Note: Task 2 used TDD approach with test commit `34dff17` before implementation._

## Files Created/Modified

- `src/app/routers/_shared.ts` - createBgmTrackSchema追加（fileBase64, title, artist, color, tierバリデーション）
- `src/app/routers/bgm.ts` - create mutation実装（adminProcedure保護、Base64デコード、R2アップロード、DB登録）
- `src/app/routers/context.ts` - Contextインターフェースにenvフィールド追加（BGM_BUCKET: R2Bucket）
- `functions/api/trpc/[[route]].ts` - createContextにenv引数追加（BGM_BUCKETバインディング注入）
- `src/global.d.ts` - R2Bucket型定義追加（Cloudflare Workers型）
- `tests/unit/bgm.test.ts` - create mutationテストケース追加（10件）

## Decisions Made

- **Base64デコード後のファイルサイズチェック**: Base64エンコードで約33%増加するため、デコード後のバイト数で10MB制限チェック
- **UUID自動生成**: crypto.randomUUID()でファイル名生成し、重複回避（.mp3拡張子付与）
- **tierデフォルト値明示指定**: Zodスキーマではoptional、mutation側で?? 'free'によりデフォルト値設定

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- create mutationがBGMトラック作成APIを提供（管理者専用）
- R2アップロードパターンが確立（04-02, 04-03で再利用可能）
- Base64ファイル処理フローが実装完了
- 次のフェーズ（04-02-update, 04-03-delete）で更新・削除mutation実装が可能

---
*Phase: 04-bgm-api-write*
*Completed: 2026-03-20*
