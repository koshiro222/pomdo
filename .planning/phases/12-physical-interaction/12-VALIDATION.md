---
phase: 12
slug: physical-interaction
status: draft
nyquist_compliant: false
wave_0_complete: false
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

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | TOUCH-01 | unit | `npm test -- --run` | ⬜ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | TOUCH-02 | visual | `manual inspection` | - | ⬜ pending |
| 12-01-03 | 01 | 1 | RESP-06 | visual | `manual inspection` | - | ⬜ pending |
| 12-01-04 | 01 | 1 | RESP-07 | visual | `manual inspection` | - | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/` — stubs for touch target testing
- [ ] Existing vitest infrastructure covers all phase requirements

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
