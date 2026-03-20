---
phase: 7
slug: favicon
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-21
updated: 2026-03-21
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

- **After every task commit:** 自動検証コマンド（grep）を実行
- **After every plan wave:** `npm run build && npm run preview` で本番ビルド後のfavicon表示を確認
- **Before `/gsd:verify-work`:** ブラウザタブでfaviconが正しく表示されていることを目視確認
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirements | Test Type | Automated Command | Status |
|---------|------|------|--------------|-----------|-------------------|--------|
| 07-01-T1 | 01 | 1 | FAV-01, FAV-02, FAV-04 | automated | `grep -q 'viewBox="0 0 24 24"' public/favicon.svg && grep -q 'fill="#22c55e"' public/favicon.svg && grep -q 'stroke="#ffffff"' public/favicon.svg` | ⬜ pending |
| 07-01-T2 | 01 | 1 | FAV-03 | automated | `grep -q 'href="/favicon.svg"' index.html && test ! -f public/vite.svg` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Favicon実装では視覚的検証が主となるが、以下の自動検証コマンドをPLAN.mdの各タスクに組み込んでいるため、Wave 0でのテストスキャフォールド作成は不要とする：

- **Task 1自動検証:** SVGファイル構造チェック（viewBox、fill、stroke属性の存在確認）
- **Task 2自動検証:** HTML参照チェック（favicon.svgへの参照、旧ファイルの削除確認）

視覚的検証は実行後のマニュアル確認手順としてPLAN.mdの`<verification>`セクションに記載。

---

## Manual-Only Verifications（視覚的確認）

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Timerアイコンとして認識可能 | FAV-01 | 視覚的検証が必要 | ブラウザタブでアイコンを確認 |
| プライマリーカラー（#22c55e）で表示 | FAV-02 | 色の視覚的確認が必要 | ブラウザタブで緑色のアイコンを確認 |
| スケーラブル（鮮明さ） | FAV-04 | ズーム時の視覚的確認が必要 | ブラウザズームでfaviconが鮮明に表示されることを確認 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references（N/A - automated commands in place）
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
