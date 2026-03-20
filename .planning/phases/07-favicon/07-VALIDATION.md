---
phase: 7
slug: favicon
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + Playwright 1.58.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm run test:e2e` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** ブラウザタブでfaviconを手動確認
- **After every plan wave:** `npm run build && npm run preview` で本番ビルド後のfavicon表示を確認
- **Before `/gsd:verify-work`:** ブラウザタブでfaviconが正しく表示されていることを目視確認
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | FAV-01 | manual-only | - | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | FAV-02 | manual-only | - | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | FAV-03 | manual-only | - | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | FAV-04 | manual-only | - | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/e2e/favicon.spec.ts` — ブラウザタブでのfavicon表示確認（手動テスト手順書）
- [ ] Playwright設定にfavicon検証用ヘルパー関数の追加（オプション）

*(Faviconは主に視覚的な要素であり、自動テストでの検証は困難。手動テスト手順書を作成し、Wave 0で対応)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TimerアイコンベースのSVG faviconが存在する | FAV-01 | 視覚的検証が必要 | `public/favicon.svg` をブラウザで開いて確認 |
| プライマリーカラー（#22c55e）でスタイリングされている | FAV-02 | 色の視覚的確認が必要 | SVGファイル内のfill属性を確認し、ブラウザタブで表示確認 |
| index.htmlでfaviconが参照されている | FAV-03 | ブラウザでの動作確認が必要 | `npm run dev` 後、ブラウザタブのアイコンを確認 |
| SVG形式でスケーラブル | FAV-04 | スケーラビリティの視覚的確認が必要 | ブラウザのズーム機能でfaviconが鮮明に表示されることを確認 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
