---
phase: 09
slug: stats
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | STAT-01 | unit | `npm test -- stats.test.ts` | ✅ | ⬜ pending |
| 09-01-02 | 01 | 1 | STAT-02 | visual | Manual dev check | ❌ | ⬜ pending |
| 09-02-01 | 02 | 1 | STAT-03 | unit | `npm test -- stats.test.ts` | ✅ | ⬜ pending |
| 09-02-02 | 02 | 1 | STAT-04 | visual | Manual dev check | ❌ | ⬜ pending |
| 09-03-01 | 03 | 1 | STAT-05 | unit | `npm test -- stats.test.ts` | ✅ | ⬜ pending |
| 09-03-02 | 03 | 1 | STAT-06 | unit | `npm test -- stats.test.ts` | ✅ | ⬜ pending |
| 09-04-01 | 04 | 1 | STAT-07 | visual | Manual dev check | ❌ | ⬜ pending |
| 09-04-02 | 04 | 1 | STAT-08 | visual | Manual dev check | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/stats.test.ts` — stubs for STAT-01 through STAT-08
- [ ] Existing infrastructure covers phase requirements (vitest already configured)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| グラフの視覚的表示 | STAT-02, STAT-04 | Rechartsコンポーネントの描画確認 | npm run dev で `/stats` にアクセス、グラフが正しく表示されることを目視確認 |
| 空状態の表示 | STAT-07 | 状態に応じたUIコンポーネントの描画 | ログアウト状態またはデータなし状態で `/stats` にアクセス、空状態アイコンとメッセージが表示されることを確認 |
| 統計の自動更新 | STAT-08 | リアルタイムデータ更新のUX確認 | セッション完了後、統計が自動的に再描画されることを確認 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
