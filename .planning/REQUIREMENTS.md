# Requirements: Pomdo v1.6.2 Statsカードデザイン改善

**Defined:** 2026-03-27
**Core Value:** ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

## v1.6.2 Requirements

Statsカードのデザイン改善のための要件。曜日表示の修正とグラフ見やすさの改善。

### 曜日表示

- [x] **STAT-01**: 曜日表示を日曜始まりに変更（Phase 21で完了）

### グラフ見やすさ

- [ ] **STAT-02**: グラフサイズと余白の調整（Phase 22）
- [ ] **STAT-03**: 水平グリッドラインの追加（スコープ外 — CONTEXT.mdで「追加しない」決定）
- [ ] **STAT-04**: 軸スタイルの改善（shadcn/ui準拠）（Phase 22）

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### ユーザー体験

- **STAT-05**: ツールチップの日本語化（v1.6.2では見送り）

### アクセシビリティ

- **STAT-06**: prefers-reduced-motion対応（v1.6.2では見送り）

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| YAxisの目盛りラベルカスタマイズ（単位表示） | v1.6.2では基本機能改善に焦点を当てる |
| グラフアニメーション | prefers-reduced-motion対応と合わせて次回検討 |
| 0値の日を明示的に表示 | データがない日はスキップする既存挙動維持 |
| 複数週の比較機能 | スコープ外、別機能として検討 |
| shadcn/ui Chartコンポーネントの導入 | Recharts直接使用維持、デザインパターンのみ参考 |
| 水平グリッドライン | CONTEXT.mdで「追加しない」決定（STAT-03はスコープ外） |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STAT-01 | Phase 21 | Complete |
| STAT-02 | Phase 22 | Pending |
| STAT-03 | Phase 22 | Out of scope（CONTEXT.mdで「追加しない」決定） |
| STAT-04 | Phase 22 | Pending |

**Coverage:**
- v1.6.2 requirements: 4 total
- Mapped to phases: 3 (STAT-01: Phase 21, STAT-02: Phase 22, STAT-04: Phase 22)
- Out of scope: 1 (STAT-03)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after Phase 22 planning*
