# Roadmap: Pomdo

**Created:** 2026-02-28
**Current Milestone:** v1.5 カードヘッダー統一
**Last Updated:** 2026-03-24

## Milestones

- ✅ **v1.0 BGM管理機能追加** — Phases 1-6 (shipped 2026-03-20)
- ✅ **v1.1 favicon追加** — Phase 7 (shipped 2026-03-21)
- ✅ **v1.2 UI/UX改善** — Phases 8-10 (shipped 2026-03-22)
- ✅ **v1.3 アクセシビリティ&品質改善** — Phases 11-13 (shipped 2026-03-24)
- ✅ **v1.4 Bento Grid再設計 & Todo統合** — Phases 14-15 (shipped 2026-03-24)
- 🚧 **v1.5 カードヘッダー統一** — Phase 16 (in progress)

## Progress Summary

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-6. BGM管理 | v1.0 | 16/16 | Complete | 2026-03-20 |
| 7. Favicon | v1.1 | 1/1 | Complete | 2026-03-21 |
| 8. レスポンシブ対応修正 | v1.2 | 3/3 | Complete | 2026-03-22 |
| 9. Stats機能実装 | v1.2 | 5/5 | Complete | 2026-03-22 |
| 10. グリッド統一 | v1.2 | 2/2 | Complete | 2026-03-22 |
| 11. アクセシビリティ基盤 | v1.3 | 4/4 | Complete | 2026-03-23 |
| 12. 物理的インタラクション改善 | v1.3 | 2/2 | Complete | 2026-03-24 |
| 13. 動きと一貫性 | v1.3 | 2/2 | Complete | 2026-03-24 |
| 14. BentoGrid 3カラム再設計 | v1.4 | 1/1 | Complete | 2026-03-23 |
| 15. TodoList統合UI | v1.4 | 3/3 | Complete | 2026-03-24 |
| 16. カードヘッダー統一 | v1.5 | 0/TBD | Not started | - |

**Completed:** 40/40 plans (v1.0-v1.4)

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

### 🚧 v1.5 カードヘッダー統一 (In Progress)

**Milestone Goal:** 全カードのヘッダーテキストスタイルと配置を統一し、視覚的一貫性を確保する

## Phase Details

### Phase 16: カードヘッダー統一
**Goal**: 全3カード（タイマー・BGM・TodoList）のヘッダーが統一されたスタイルと配置でレンダリングされる
**Depends on**: Phase 15
**Requirements**: HEADER-01, HEADER-02, HEADER-03
**Success Criteria** (what must be TRUE):
  1. タイマーカードの左上に「Pomodoro」テキストが `text-xs uppercase tracking-widest font-bold` スタイルで表示される
  2. BGMカードのヘッダーテキストが左上に配置され、Listボタンが右上に独立して配置される
  3. TodoListカードのヘッダーテキストが `text-xs uppercase tracking-widest font-bold` スタイルに変更され、他カードと見た目が揃う
  4. 3カードを横並びで見たとき、各カード左上のヘッダーテキストが同一の視覚ウェイトと大文字スタイルで統一されている
**Plans**: TBD

Plans:
- [ ] 16-01: TBD

---
*Roadmap updated: 2026-03-24*
*v1.5 milestone started*
