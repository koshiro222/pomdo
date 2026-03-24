---
phase: 16
slug: card-header-unification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing in project) |
| **Config file** | vite.config.ts (existing) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | HEADER-01 | unit | `npm test -- --run timer` | ❌ W0 | ⬜ pending |
| 16-01-02 | 01 | 1 | HEADER-02 | unit | `npm test -- --run bgm` | ❌ W0 | ⬜ pending |
| 16-01-03 | 01 | 1 | HEADER-03 | unit | `npm test -- --run todo` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/timer/__tests__/card-header.test.ts` — stubs for HEADER-01
- [ ] `src/components/bgm/__tests__/card-header.test.ts` — stubs for HEADER-02
- [ ] `src/components/todos/__tests__/card-header.test.ts` — stubs for HEADER-03

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual consistency across 3 cards | HEADER-01, HEADER-02, HEADER-03 | Visual styling requires human verification | 1. Run `npm run dev` 2. Verify all 3 card headers have `text-xs uppercase tracking-widest font-bold` style 3. Verify headers are aligned in top-left position 4. Verify BGM List button is in top-right corner |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
