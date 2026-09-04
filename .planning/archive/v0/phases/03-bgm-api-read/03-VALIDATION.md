---
phase: 3
slug: bgm-api-read
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-20
updated: 2026-03-20
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts |
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
| 03-01-00 | 01 | 0 | - | stub | `ls tests/bgm-*.test.ts` | ✅ Created | ⬜ pending |
| 03-01-01 | 01 | 1 | API-01 | integration | `npm test -- bgm-router --run` | ✅ Created | ⬜ pending |
| 03-01-02 | 01 | 1 | API-02 | unit | `npm test -- bgm-router --run` | ✅ Created | ⬜ pending |
| 03-01-03 | 01 | 1 | API-01 | integration | `npm run build && grep -q "bgm:"` | ✅ Created | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/bgm-api.test.ts` — BGMルーター統合テストスタブ
- [x] `tests/bgm-router.test.ts` — tRPCルーターユニットテストスタブ

**Note:** Wave 0 task (03-01-00) creates these test stub files before implementation begins.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| BGM再生ブラウザで確認 | API-01 | オーディオ再生はブラウザ依存 | 1. tRPCパネルで `bgm.getAll` 実行 2. 返却トラックの `src` で `<audio>` 要素作成 3. 再生確認 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] Wave 0 test stubs created before implementation (Task 03-01-00)
- [x] Verify commands use actual test calls instead of grep-only checks
- [x] must_haves.truths framed as user-observable outcomes

**Approval:** pending
