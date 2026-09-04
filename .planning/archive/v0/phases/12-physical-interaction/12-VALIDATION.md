---
phase: 12
slug: physical-interaction
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-24
---

# Phase 12 — Validation Strategy

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

- **After every task commit:** Run automated verification command
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

### Plan 01 (Wave 1)

| Task ID | Requirement | Automated Command | Status |
|---------|-------------|-------------------|--------|
| 12-01-01 | TOUCH-02 | `grep -q "button {" src/index.css && grep -q "cursor: pointer" src/index.css && echo "PASS"` | ⬜ pending |
| 12-01-02 | TOUCH-01 | `grep -c "p-3" src/components/bgm/BgmPlayer.tsx \| xargs -I{} sh -c 'if [ {} -ge 3 ]; then echo "PASS"; else echo "FAIL: expected 3+ p-3 occurrences, got {}"; fi'` | ⬜ pending |
| 12-01-03 | TOUCH-01 | `grep -q "p-3.*opacity-0.*group-hover:opacity-100" src/components/todos/TodoItem.tsx && echo "PASS"` | ⬜ pending |
| 12-01-04 | TOUCH-01 | `grep -c "p-3" src/components/bgm/TrackItem.tsx \| xargs -I{} sh -c 'if [ {} -ge 2 ]; then echo "PASS"; else echo "FAIL: expected 2+ p-3 occurrences, got {}"; fi'` | ⬜ pending |

### Plan 02 (Wave 2)

| Task ID | Requirement | Automated Command | Status |
|---------|-------------|-------------------|--------|
| 12-02-01 | RESP-06, RESP-07 | `grep -q "w-24 h-24 flex-shrink-0" src/components/bgm/BgmPlayer.tsx && ! grep -q "sm:w-32 sm:h-32" src/components/bgm/BgmPlayer.tsx && echo "PASS"` | ⬜ pending |
| 12-02-02 | RESP-06 | `! grep -q "bento-card.*overflow-hidden" src/components/todos/TodoList.tsx && echo "PASS"` | ⬜ pending |
| 12-02-03 | RESP-06 | `! grep -q "bento-card.*overflow-hidden" src/components/tasks/CurrentTaskCard.tsx && echo "PASS"` | ⬜ pending |
| 12-02-04 | TOUCH-01, TOUCH-02, RESP-06, RESP-07 | `npm run build` (checkpoint task) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing vitest infrastructure covers all phase requirements
- [x] No new test files required — all verification via grep commands

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 44pxタッチターゲット | TOUCH-01 | Visual inspection requires checking rendered sizes | DevToolsで対話要素のサイズを確認（幅/高さ >= 44px） |
| pointer cursor | TOUCH-02 | Cursor style is visual behavior | 対話可能要素にホバーし、cursor: pointer を確認 |
| モバイルオーバーフローなし | RESP-06 | Requires viewport testing | Chrome DevTools device modeで各画面を確認 |
| アルバムアートサイズ | RESP-07 | Visual judgment on small screens | 小さい画面でアルバムアートの圧迫感を確認 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
