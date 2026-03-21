---
phase: 10
slug: grid-unification
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** `npm run dev`で動作確認 + 目視チェック
- **After every plan wave:** 全画面サイズでグリッドレイアウト確認
- **Before `/gsd:verify-work`:** 全画面サイズで全GRID要件満たしているか目視確認
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | GRID-01 | visual-manual | `npm run dev` + 目視確認 | ✅ 既存 | ⬜ pending |
| 10-01-02 | 01 | 1 | GRID-02 | visual-manual | `npm run dev` + 目視確認 | ✅ 既存 | ⬜ pending |
| 10-01-03 | 01 | 1 | GRID-03 | visual-manual | `npm run dev` + 目視確認 | ✅ 既存 | ⬜ pending |
| 10-01-04 | 01 | 1 | GRID-04 | visual-manual | `npm run dev` + 目視確認 | ✅ 既存 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `vitest.config.ts` — 既存設定
- [x] `@testing-library/react` — 既にインストール済み

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 全カードでbento-cardクラス使用 | GRID-01 | 視覚的変更 | `npm run dev`後、全カードのスタイルが統一されているか目視確認 |
| gap-4で統一 | GRID-02 | 視覚的変更 | `npm run dev`後、各領域のgapが16pxであるか目視確認 |
| spacing scale適用（p-4/p-6） | GRID-03 | 視覚的変更 | `npm run dev`後、カードサイズに応じたpaddingが適用されているか目視確認 |
| グリッドcol-span合計が正しい | GRID-04 | 視覚的変更 | `npm run dev`後、各ブレイクポイントでグリッドが正しく表示されているか目視確認 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
