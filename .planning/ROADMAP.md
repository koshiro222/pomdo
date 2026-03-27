# Roadmap: Pomdo

**Created:** 2026-02-28
**Last Updated:** 2026-03-27

## Milestones

- ✅ **v1.0 BGM管理機能追加** — Phases 1-6 (shipped 2026-03-20)
- ✅ **v1.1 favicon追加** — Phase 7 (shipped 2026-03-21)
- ✅ **v1.2 UI/UX改善** — Phases 8-10 (shipped 2026-03-22)
- ✅ **v1.3 アクセシビリティ&品質改善** — Phases 11-13 (shipped 2026-03-24)
- ✅ **v1.4 Bento Grid再設計 & Todo統合** — Phases 14-15 (shipped 2026-03-24)
- ✅ **v1.5 カードヘッダー統一** — Phase 16 (shipped 2026-03-24)
- ✅ **v1.6 TodoカードUI/UX改善** — Phases 17-18 (shipped 2026-03-25)
- ✅ **v1.6.1 BGMプレイヤーアニメーション刷新** — Phases 19-20 (shipped 2026-03-27)
- 🔄 **v1.6.2 Statsカードデザイン改善** — Phases 21-22 (in progress)

## Progress Summary

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1-6 | v1.0 | 16/16 | Complete | 2026-03-20 |
| 7 | v1.1 | 1/1 | Complete | 2026-03-21 |
| 8-10 | v1.2 | 10/10 | Complete | 2026-03-22 |
| 11-13 | v1.3 | 8/8 | Complete | 2026-03-24 |
| 14-15 | v1.4 | 4/4 | Complete | 2026-03-24 |
| 16 | v1.5 | 2/2 | Complete | 2026-03-24 |
| 17-18 | v1.6 | 7/7 | Complete | 2026-03-25 |
| 19-20 | v1.6.1 | 2/2 | Complete | 2026-03-27 |
| 21-22 | v1.6.2 | 0/4 | Not started | - |

**Completed:** 51/51 plans (v1.0-v1.6.1)

## Phases

<details>
<summary>✅ v1.0 BGM管理機能追加 (Phases 1-6) — SHIPPED 2026-03-20</summary>

**Details:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 favicon追加 (Phase 7) — SHIPPED 2026-03-21</summary>

**Details:** `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 UI/UX改善 (Phases 8-10) — SHIPPED 2026-03-22</summary>

**Details:** `.planning/milestones/v1.2-ROADMAP.md`

</details>

<details>
<summary>✅ v1.3 アクセシビリティ&品質改善 (Phases 11-13) — SHIPPED 2026-03-24</summary>

**Details:** `.planning/milestones/v1.3-ROADMAP.md`

</details>

<details>
<summary>✅ v1.4 Bento Grid再設計 & Todo統合 (Phases 14-15) — SHIPPED 2026-03-24</summary>

**Details:** `.planning/milestones/v1.4-ROADMAP.md`

</details>

<details>
<summary>✅ v1.5 カードヘッダー統一 (Phase 16) — SHIPPED 2026-03-24</summary>

**Details:** `.planning/milestones/v1.5-ROADMAP.md`

</details>

<details>
<summary>✅ v1.6 TodoカードUI/UX改善 (Phases 17-18) — SHIPPED 2026-03-25</summary>

**Details:** `.planning/milestones/v1.6-ROADMAP.md`

</details>

<details>
<summary>✅ v1.6.1 BGMプレイヤーアニメーション刷新 (Phases 19-20) — SHIPPED 2026-03-27</summary>

**Details:** `.planning/milestones/v1.6.1-ROADMAP.md`

</details>

<details>
<summary>🔄 v1.6.2 Statsカードデザイン改善 (Phases 21-22) — IN PROGRESS</summary>

### Phase 21: 曜日表示修正

**Goal:** 曜日表示を日曜始まりに変更し、日本のカレンダー文化に合わせる

**Depends on:** Nothing

**Requirements:** STAT-01

**Success Criteria** (what must be TRUE):
1. グラフのX軸に日曜始まりで「日 月 火 水 木 金 土」と表示される
2. 集計データが正しい曜日に対応している（日曜日のデータが日曜位置に表示）
3. Today/Week/Monthタブ切り替え時も曜日順序が維持される

**Plans:** TBD

---

### Phase 22: グラフUI改善

**Goal:** グラフの視認性を向上させ、shadcn/uiデザインシステムに準拠したスタイルを適用

**Depends on:** Phase 21

**Requirements:** STAT-02, STAT-03, STAT-04

**Success Criteria** (what must be TRUE):
1. グラフサイズと余白が適切に調整され、ラベルが途切れず表示される
2. 水平グリッドラインが表示され、データ値の読み取りが容易になっている
3. 軸ラベルの色、サイズ、太さがshadcn/uiのmutedスタイルに準拠している
4. モバイルとデスクトップ両方でグラフが適切に表示される

**Plans:** TBD

</details>

---

## Future Milestones (Planned)

- 📋 **v1.7 テスト基盤整備** — TBD
- 📋 **v1.8 アクセシビリティ対応（prefers-reduced-motion）** — TBD
