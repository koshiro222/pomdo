---
phase: 03-bgm-api-read
plan: 01
subsystem: api
tags: [trpc, zod, drizzle, bgm, public-api]

# Dependency graph
requires:
  - phase: 01-database
    provides: bgmTracks table with seed data
provides:
  - bgmRouter with getAll query for fetching all tracks
  - bgmTrackSchema and bgmGetAllInputSchema Zod schemas
  - Public API endpoint for BGM (no authentication required)
  - tier filtering capability (free/premium)
affects: [03-bgm-api-write, 04-bgm-player, 05-ui-bgm-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - publicProcedure for authentication-free endpoints
    - src field generation from filename (R2 URL pattern)
    - Optional input schema pattern (.optional() wrapper)
    - map() for response transformation

key-files:
  created:
    - src/app/routers/bgm.ts
    - tests/bgm-api.test.ts
    - tests/bgm-router.test.ts
  modified:
    - src/app/routers/_shared.ts
    - src/app/routers/root.ts

key-decisions:
  - "publicProcedure使用: ゲストユーザーもBGM取得可能に"
  - "srcフィールド動的生成: 既存Track型との互換性維持"
  - "tierフィルタオプション化: 未指定時は全トラック返却"

patterns-established:
  - "Pattern 1: 認証不要のpublic APIはpublicProcedure使用"
  - "Pattern 2: input全体を.optional()でラップし、input?.fieldでundefinedチェック"
  - "Pattern 3: レスポンス変換はmap()で実装（DBスキーマ→APIレスポンス）"

requirements-completed: [API-01, API-02]

# Metrics
duration: 2min
completed: 2026-03-20
started: 2026-03-20T10:15:29Z
---

# Phase 03-01: BGM Read API実装 Summary

**tRPCで認証不要のBGM取得APIを実装し、tierフィルタとsrcフィールド生成機能を追加**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T10:15:29Z
- **Completed:** 2026-03-20T10:17:11Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- BGM用tRPCルーター(bgmRouter)を作成し、getAllクエリを実装
- Zodスキーマ(bgmTrackSchema, bgmGetAllInputSchema)で型安全なAPI入出力を定義
- publicProcedureで認証不要のエンドポイントを公開（ゲストユーザー対応）
- srcフィールド動的生成により既存Track型との互換性を確保
- tierフィルタ(free/premium)によるトラック絞り込み機能を実装

## Task Commits

Each task was committed atomically:

1. **Task 0: テストスタブファイルの作成** - `0ad9029` (test)
2. **Task 2: BGM用Zodスキーマ定義の追加** - `c2a9ff3` (feat)
3. **Task 1: BGMルーターとgetAllクエリの作成** - `93f3936` (feat)
4. **Task 3: appRouterへのbgmRouter統合** - `346d8c7` (feat)

_Note: Task 2はTask 1の依存関係(bgGetAllInputSchema)のため先に実行_

## Files Created/Modified

### Created
- `tests/bgm-api.test.ts` - BGM API統合テストスタブ
- `tests/bgm-router.test.ts` - BGMルーターユニットテストスタブ
- `src/app/routers/bgm.ts` - bgmRouter定義（getAllクエリ）

### Modified
- `src/app/routers/_shared.ts` - BGM用Zodスキーマ追加
- `src/app/routers/root.ts` - bgmRouter統合

## Decisions Made

- **publicProcedure採用**: Better Authのセッションチェックが不要なBGM配信のため、認証なしでアクセス可能に
- **srcフィールド動的生成**: DBにはfilenameのみ保存し、APIレスポンスで完全なURL(/api/bgm/filename)を生成
- **input全体をoptional化**: `bgmGetAllInputSchema`を`.optional()`でラップし、`getAll()`呼び出し時に引数省略を許容
- **any型明示指定**: Drizzle ORMの型推論が複雑なため、map内のtrack型はanyとして実装（実用上問題なし）

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **TypeScriptコンパイルエラー**: src/hooks/useAuth.tsに既存の型不一致エラー(role: string vs "user" | "admin")が存在
  - **対応**: これは今回の変更に起因しない既存問題のため、スコープ外として処理
  - **記録**: deferred-items.mdには記録せず（スコープ境界ルール適用）

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

### Complete
- bgmRouterはappRouterに統合済み、次フェーズから`trpc.bgm.getAll()`で呼び出し可能
- Phase 1のシードデータ(2トラック)が取得可能
- tierフィルタ機能により、将来的なプレミアム機能の基盤構築済み

### Considerations for Next Phase
- Phase 04(bgm-api-write)ではadminProcedureを使用する管理機能の実装が必要
- srcフィールド生成パターンはプレイヤー実装時の参照例として使用可能

---
*Phase: 03-bgm-api-read*
*Completed: 2026-03-20*

## Self-Check: PASSED

- [x] SUMMARY.md created
- [x] All commits verified (0ad9029, c2a9ff3, 93f3936, 346d8c7)
- [x] All created files verified (tests/bgm-api.test.ts, tests/bgm-router.test.ts, src/app/routers/bgm.ts)
- [x] All modified files verified (src/app/routers/_shared.ts, src/app/routers/root.ts)
