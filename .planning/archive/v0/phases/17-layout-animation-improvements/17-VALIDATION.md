---
phase: 17
slug: layout-animation-improvements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (既存) |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | LAYOUT-01 | visual/manual | `npm run dev` で目視確認 | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | LAYOUT-02 | visual/manual | `npm run dev` で目視確認 | ❌ W0 | ⬜ pending |
| 17-02-01 | 02 | 1 | ANIM-01 | visual/manual | `npm run dev` で目視確認 | ❌ W0 | ⬜ pending |
| 17-02-02 | 02 | 1 | ANIM-02 | visual/manual | `npm run dev` で目視確認 | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/todos/__tests__/TodoList.test.tsx` — LAYOUT-01, LAYOUT-02 の構造確認
- [ ] `src/components/todos/__tests__/TodoItem.test.tsx` — ANIM-01, ANIM-02 のアニメーション確認

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 仕切り線の位置 | LAYOUT-01 | 視覚的確認 | `npm run dev` で TodoList を表示し、Current Task 下に仕切り線があることを確認 |
| TodoInputの位置 | LAYOUT-02 | 視覚的確認 | TodoInput がスクロールエリア内の最下部に配置されていることを確認 |
| 既存アイテムのスライド | ANIM-01 | アニメーション確認 | 新タスク追加時、既存アイテムがスムーズに下へスライドすることを確認 |
| 新アイテムの展開 | ANIM-02 | アニメーション確認 | 新タスクが `height: 0 → auto` + `opacity: 0 → 1` で展開することを確認 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
