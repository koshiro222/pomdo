---
phase: 15
slug: todolist-ui
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-24
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Playwright |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run && npm run test:e2e` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run && npm run test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | TODO-01, TODO-02, TODO-03 | unit | `npm test -- --run` | ✅ | ⬜ pending |
| 15-01-02 | 01 | 1 | TODO-04 | unit | `npm test -- --run` | ✅ | ⬜ pending |
| 15-02-01 | 02 | 2 | TODO-01, TODO-02, TODO-03, TODO-04 | e2e | `npm run test:e2e -- tests/e2e/todo-highlight.spec.ts` | ❌ W0 | ⬜ pending |
| 15-03-01 | 03 | 3 | TODO-01, TODO-02, TODO-03, TODO-04 | manual | N/A (checkpoint) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/e2e/todo-highlight.spec.ts` — Plan 15-02で作成予定
  - Plan 15-01の実装完了後に実行
  - Wave 0タスクは不要（テストファイルはPlan 15-02で作成）

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| アニメーションの滑らかさ | TODO-01 | 視覚的評価が必要 | タスク選択・完了時のアニメーションを目視確認 |
| モバイルレイアウト | Claude's Discretion | レスポンシブ確認 | モバイルビューでハイライトセクションが正しく表示されるか確認 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (N/A - test file created in Plan 15-02)
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready for execution
