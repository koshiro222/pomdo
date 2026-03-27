---
phase: 22
slug: graph-ui-improvements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (既存インフラ利用) |
| **Config file** | vite.config.ts (既存設定) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run` (ユニットテスト)
- **After every plan wave:** Visual inspection in browser (グラフ表示確認)
- **Before `/gsd:verify-work`:** Browser manual verification + green tests
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 22-01-01 | 01 | 1 | STAT-02 | visual | `npm run dev` + manual check | ✅ 既存 | ⬜ pending |
| 22-01-02 | 01 | 1 | STAT-04 | visual | `npm run dev` + manual check | ✅ 既存 | ⬜ pending |
| 22-01-03 | 01 | 1 | STAT-02, STAT-04 | visual | `npm run dev` + manual check | ✅ 既存 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- **既存インフラ利用** — vite.config.tsにvitest設定済み
- **既存テスト** — `src/components/stats/StatsCard.test.tsx` (存在すれば)
- **追加インストールなし** — UI改善は既存コンポーネントの修正のみ

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| グラフサイズと余白が適切 | STAT-02 | Visual inspection requires human judgment | `npm run dev` でStatsカードを表示し、ラベルが途切れないか確認 |
| 軸ラベルがshadcn/ui準拠 | STAT-04 | Visual styling verification | グラフの軸線/目盛り線が非表示、ラベル色がtext-cf-subtextであるか確認 |
| レスポンシブ動作 | STAT-04 | Viewport size change testing | ブラウザ幅を変更し、グラフが適切にリサイズされるか確認 |

---

## Nyquist Compliance Rationale

**Status: Non-compliant**

**Rationale:**
Phase 22は視覚的UI改善フェーズであり、主要な成果物（グラフの視認性、余白、軸スタイル）は人間による視覚的検証でのみ評価可能です。

- **グラフサイズと余白:** コンポーネントの状態変更は検証可能ですが、「ラベルが途切れず表示される」「視覚的にバランスが良い」といった品質判断には人間の判断が必要
- **軸スタイル:** `tickLine={false}` などのプロップ設定はコードレビューで可能ですが、実際のレンダリング結果が「ミニマルで読みやすい」かは視覚的検証が必要
- **レスポンシブ動作:** ブラウザ幅変更時のグラフのリサイズ動作は、異なるビューポートサイズでの表示確認が必要

**自動テストの限界:**
- RechartsコンポーネントのJest DOMテストは、SVG属性の存在チェックに留まります
- 実際のブラウザレンダリングでの視認性は、Playwright等のE2Eツールでもスクリーンショット比較が必要であり、メンテナンスコストが高い
- スクリーンショットテストを導入する場合でも、初期の正解画像作成には人間の判断が必要

**軽量な自動検証:**
- 各タスク後に `npm test -- --run` を実行し、既存テストのRegression防止
- プロップ設定のコードレビュー（accessibilityLayer、tickLine、axisLineなど）
- ブラウザ開発者ツールでのARIA属性確認（accessibilityLayerの効果検証）

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] Nyquist non-compliance documented with rationale

**Approval:** pending
