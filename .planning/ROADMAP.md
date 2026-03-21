# Roadmap: Pomdo v1.2 UI/UX改善

**Created:** 2026-03-22
**Granularity:** Standard
**Milestone:** v1.2 UI/UX改善
**Starting Phase:** 8（v1.1はPhase 7まで完了）

## Milestones

- ✅ **v1.0 BGM管理機能追加** — Phases 1-6 (shipped 2026-03-20)
- ✅ **v1.1 favicon追加** — Phase 7 (shipped 2026-03-21)
- 🔄 **v1.2 UI/UX改善** — Phases 8-10 (active)

## Progress Summary

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 8. レスポンシブ対応修正 | 0/3 | Planning | - |
| 9. Stats機能実装 | 0/2 | Not started | - |
| 10. グリッド統一 | 0/2 | Not started | - |

**Overall:** 0/7 plans complete (0%)

## Phases

<details>
<summary>✅ v1.0 BGM管理機能追加 (Phases 1-6) — SHIPPED 2026-03-20</summary>

- [x] Phase 1: Database (2/2 plans) — completed 2026-03-19
- [x] Phase 2: Authentication (3/3 plans) — completed 2026-03-20
- [x] Phase 3: BGM API - Read (1/1 plan) — completed 2026-03-20
- [x] Phase 4: BGM API - Write (4/4 plans) — completed 2026-03-20
- [x] Phase 5: Player Migration (1/1 plan) — completed 2026-03-20
- [x] Phase 6: Admin UI (5/5 plans) — completed 2026-03-20

**v1.0 Stats:**
- Total phases: 6
- Total plans: 16
- Timeline: 22 days (2026-02-28 → 2026-03-21)

</details>

<details>
<summary>✅ v1.1 favicon追加 (Phase 7) — SHIPPED 2026-03-21</summary>

- [x] Phase 7: Faviconの実装 (1/1 plans) — completed 2026-03-21

**v1.1 Stats:**
- Total phases: 1
- Total plans: 1
- Timeline: 1 day (2026-03-21)

</details>

<details>
<summary>🔄 v1.2 UI/UX改善 (Phases 8-10) — ACTIVE</summary>

- [ ] **Phase 8: レスポンシブ対応修正** — 全画面サイズでUIが正しく表示される
- [ ] **Phase 9: Stats機能実装** — ユーザーは自分の作業統計を視覚的に把握できる
- [ ] **Phase 10: グリッド統一** — 全体的なデザインの一貫性を向上させる

</details>

## Phase Details

### Phase 8: レスポンシブ対応修正

**Goal:** 全画面サイズでUIが正しく表示される

**Depends on:** Nothing（v1.1完了時点から開始）

**Requirements:** RESP-01, RESP-02, RESP-03, RESP-04, RESP-05

**Success Criteria**（what must be TRUE）:
1. ユーザーはどの画面サイズでも要素が重ならず、すべてのボタンをクリックできる
2. ユーザーは一貫したスクロール挙動を体験する（ブレイクポイントで変わらない）
3. ユーザーはタイマー部分の過剰な余白が解消されたレイアウトを見る
4. ユーザーはレイアウト変更時のアニメーションがスムーズで競合しない

**Plans:** 3 plans

- [ ] 08-01-PLAN.md — グリッド定義修正・layout prop最適化・main要素overflow削除
- [ ] 08-02-PLAN.md — タイマー部分の余白調整（モードタブ位置）
- [ ] 08-03-PLAN.md — TodoList・StatsCardにoverflow設定追加

---

### Phase 9: Stats機能実装

**Goal:** ユーザーは自分の作業統計を視覚的に把握できる

**Depends on:** Phase 8（レスポンシブ対応が完了していないと、正しい表示確認ができない）

**Requirements:** STAT-01, STAT-02, STAT-03, STAT-04, STAT-05, STAT-06, STAT-07, STAT-08

**Success Criteria**（what must be TRUE）:
1. ユーザーは今日・週次・月次の統計（集中時間・セッション数）を確認できる
2. ユーザーは棒グラフで日別セッション数を視覚的に把握できる
3. ユーザーは折れ線グラフで累積集中時間の推移を確認できる
4. ユーザーはデータ更新時に統計が自動的に再描画されるのを確認できる
5. ユーザーはデータがない場合に空状態の表示を確認できる

**Plans:**
- TBD（`/gsd:plan-phase 9`で作成）

---

### Phase 10: グリッド統一

**Goal:** 全体的なデザインの一貫性を向上させる

**Depends on:** Phase 9（機能実装完了後に視覚的な改善を実施）

**Requirements:** GRID-01, GRID-02, GRID-03, GRID-04

**Success Criteria**（what must be TRUE）:
1. ユーザーは全カードで統一感のあるデザイン（BentoCard）を確認できる
2. ユーザーは全領域で一貫したガターサイズ（16px）を確認できる
3. ユーザーは全領域で一貫したスペーシングを確認できる

**Plans:**
- TBD（`/gsd:plan-phase 10`で作成）

---

## Dependencies

```
Phase 8（レスポンシブ対応修正）
    ↓
Phase 9（Stats機能実装）
    ↓
Phase 10（グリッド統一）
```

**依存関係の根拠:**
- Phase 8 → Phase 9: レスポンシブ対応が不完全だと、Statsの正しい表示確認ができない
- Phase 9 → Phase 10: 視覚的な改善なので、機能修正後に実施

## Risk Notes

**Phase 8 リスク:**
- Framer Motionのlayout propによるレイアウトシフトが複数箇所で発生している可能性
- overflow設定のブレイクポイント不一致が既存コードに散在している可能性

**Phase 9 リスク:**
- Rechartsの導入によりバンドルサイズが増加（〜40KB）
- Statsデータの集計ロジックが複雑になる可能性

**Phase 10 リスク:**
- BentoCard共通コンポーネントの導入により、既存コンポーネントのリファクタリングが必要
- グリッドシステムの修正により、既存のレイアウトが崩れる可能性

## Coverage Validation

**v1.2 Requirements:** 17 total

| Category | Count | Phase |
|----------|-------|-------|
| レスポンシブ対応（RESP-01～05） | 5 | Phase 8 |
| Stats機能（STAT-01～08） | 8 | Phase 9 |
| グリッド統一（GRID-01～04） | 4 | Phase 10 |

**Coverage:** 17/17 requirements mapped ✓
**Orphaned requirements:** 0 ✓
**Duplicate mappings:** 0 ✓

---
*Roadmap created: 2026-03-22*
*Phase 8 plans created: 2026-03-22*
*Next step: `/gsd:execute-phase 8`*
