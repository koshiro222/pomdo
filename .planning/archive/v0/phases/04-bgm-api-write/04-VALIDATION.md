---
phase: 04
slug: bgm-api-write
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` (既存) |
| **Quick run command** | `npm test -- bgm` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30秒 |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- bgm` (BGM関連テストのみ)
- **After every plan wave:** Run `npm test` (全テストスイート)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 60秒

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | API-03 | integration | `npm test -- bgm-create` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | API-03 | integration | `npm test -- bgm-create-admin` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | API-04, API-05 | integration | `npm test -- bgm-update` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | API-04, API-05 | integration | `npm test -- bgm-update-admin` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 1 | API-06, API-07 | integration | `npm test -- bgm-delete` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 1 | API-06, API-07 | integration | `npm test -- bgm-delete-cascade` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/routers/bgm.test.ts` — tRPC mutation テストスタブ
- [ ] `tests/mocks/r2.ts` — R2 モック（`R2Bucket` インターフェース）
- [ ] `tests/mocks/db.ts` — データベースモック（既存の fixtures を拡張）
- [ ] `tests/fixtures/bgm.ts` — BGM テストフィクスチャ（サンプル MP3 Base64、トラックデータ）

**既存インフラストラクチャ:** Vitest設定あり、既存の `src/hooks/useTimer.test.ts` が設定を参照

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MP3ファイルがR2に正しく保存される | API-03 | R2バケット操作は外部サービス依存 | 1. tRPC create mutation実行後、Wrangler CLIで `wrangler r2 object pomdo-bgm <filename>` で確認 |
| 非管理者が403エラーになる | API-07 | 認証フローの完全なテストはE2Eで実施 | Playwright E2Eテストで非管理者アカウントで実行 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---

*Phase: 04-bgm-api-write*
*Validation strategy created: 2026-03-20*
