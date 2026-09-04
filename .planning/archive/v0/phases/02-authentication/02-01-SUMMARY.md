---
phase: 02-authentication
plan: 01
subsystem: auth
tags: [better-auth, admin-plugin, drizzle, trpc, role-based-access]

# Dependency graph
requires:
provides:
  - Better Authインスタンス with admin plugin
  - usersテーブル with role/banned/banReason/banExpiresカラム
  - tRPC adminProcedureミドルウェア for 権限チェック
affects: [02-authentication, 04-bgm-api-write]

# Tech tracking
tech-stack:
  added: [better-auth/plugins]
  patterns:
    - admin pluginによるroleベースの認可
    - adminProcedureによるサーバー側権限チェック
    - SessionUser型拡張によるrole情報の伝播

key-files:
  created: []
  modified:
    - functions/lib/schema.ts
    - functions/lib/auth.ts
    - src/app/routers/context.ts

key-decisions:
  - "Better Auth Admin Plugin使用: 既存の認証システムにrole管理を統合"
  - "adminProcedure独立定義: protectedProcedureとは別に管理者専用プロシージャを定義"
  - "roleカラムのデフォルト値'user': 明示的なadmin指定運用"

patterns-established:
  - "Pattern 1: adminProcedureで認証済み+admin権限の二重チェック"
  - "Pattern 2: SessionUser型にroleを含めてtRPCコンテキストで利用"
  - "Pattern 3: Drizzle schemaでadmin plugin用カラムを定義"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, API-08]

# Metrics
duration: 5min
completed: 2026-03-20
started: 2026-03-20T17:44:51+09:00
---

# Phase 02-01: Better Auth Admin Plugin有効化 Summary

**Better Auth Admin Pluginを有効化し、usersテーブルにroleカラムを追加、tRPCミドルウェアでadmin権限チェックを実装**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-20T17:44:51+09:00
- **Completed:** 2026-03-20T17:49:56+09:00
- **Tasks:** 4
- **Files modified:** 3

## Accomplishments

- **Better Auth Admin Plugin有効化**: admin() pluginを追加し、roleベースの認可基盤を構築
- **usersテーブル拡張**: role/banned/banReason/banExpiresカラムを追加
- **tRPC adminProcedure実装**: サーバー側で管理者権限チェックを行うミドルウェアを定義
- **SessionUser型拡張**: roleフィールドを追加し、tRPCコンテキストで利用可能に

## Task Commits

Each task was committed atomically:

1. **Task 1: usersテーブルにrole関連カラムを追加** - `80c4e8e` (feat)
2. **Task 2: Better Authにadmin pluginを追加** - `59d1f59` (feat)
3. **Task 3: tRPC SessionUser型にroleを追加** - `d13baf0` (feat)
4. **Task 4: adminProcedureミドルウェアを追加** - `e46a75b` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `functions/lib/schema.ts` - usersテーブルにrole/banned/banReason/banExpiresカラムを追加
- `functions/lib/auth.ts` - admin pluginを追加して有効化
- `src/app/routers/context.ts` - SessionUser型にrole追加、adminProcedureを定義

## Decisions Made

- **Better Auth Admin Plugin採用**: 既存の認証システムに大きく変更を加えずにrole管理を統合可能
- **adminProcedureの独立定義**: protectedProcedure（認証済みチェック）とは別に、admin権限チェックを持つプロシージャを定義
- **roleのデフォルト値'user'**: セキュリティデフォルトとして明示的なadmin指定運用を採用

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

### Complete
- adminProcedureはPhase 04のBGM Write APIで使用可能
- Better Auth Admin Pluginが有効化され、クライアント側からのrole操作可能（Plan 02で実装）

### Considerations for Next Phase
- Phase 04ではadminProcedureを使用して管理者専用APIを保護
- マイグレーション適用はPlan 03で実施

---
*Phase: 02-authentication*
*Plan: 01*
*Completed: 2026-03-20*

## Self-Check: PASSED

- [x] SUMMARY.md created
- [x] All commits verified (80c4e8e, 59d1f59, d13baf0, e46a75b)
- [x] All modified files verified (functions/lib/schema.ts, functions/lib/auth.ts, src/app/routers/context.ts)
- [x] All success criteria met (role field exists, admin() plugin active, adminProcedure defined)
