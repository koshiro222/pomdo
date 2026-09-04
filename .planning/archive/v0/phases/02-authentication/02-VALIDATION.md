---
phase: 2
slug: authentication
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 2 — Validation Strategy

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
| 02-01-01 | 01 | 1 | AUTH-01 | unit | `npm test -- auth.test.ts` | ✅ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | AUTH-02 | unit | `npm test -- auth.test.ts` | ✅ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | AUTH-03 | unit | `npm test -- middleware.test.ts` | ✅ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | API-08 | integration | `npm test -- trpc.test.ts` | ✅ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | - | e2e | `npm test -- e2e/auth.spec.ts` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/auth.test.ts` — Better Auth admin plugin configuration stubs
- [ ] `src/lib/__tests__/middleware.test.ts` — tRPC middleware stubs
- [ ] `src/app/__tests__/trpc.test.ts` — auth procedure stubs
- [ ] `e2e/auth.spec.ts` — E2E auth flow stubs

*Existing infrastructure: vitest config exists*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 管理者ダッシュボードUIでadmin操作可視化 | AUTH-03 | UI視覚確認 | 1. 管理者ユーザーでログイン 2. 管理メニューが表示されることを確認 3. 非管理者でログイン 4. 管理メニューが表示されないことを確認 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
