# Roadmap: Pomdo

**Created:** 2026-02-28
**Current Milestone:** v1.3 アクセシビリティ&品質改善
**Last Updated:** 2026-03-24

## Milestones

- ✅ **v1.0 BGM管理機能追加** — Phases 1-6 (shipped 2026-03-20)
- ✅ **v1.1 favicon追加** — Phase 7 (shipped 2026-03-21)
- ✅ **v1.2 UI/UX改善** — Phases 8-10 (shipped 2026-03-22)
- 📋 **v1.3 アクセシビリティ&品質改善** — Phases 11-13 (planned)

## Progress Summary

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1-6. BGM管理 | 16/16 | Complete | 2026-03-20 |
| 7. Favicon | 1/1 | Complete | 2026-03-21 |
| 8. レスポンシブ対応修正 | 3/3 | Complete | 2026-03-22 |
| 9. Stats機能実装 | 5/5 | Complete | 2026-03-22 |
| 10. グリッド統一 | 2/2 | Complete | 2026-03-22 |
| 11. アクセシビリティ基盤 | 4/4 | Complete | 2026-03-23 |
| 12. 物理的インタラクション改善 | 2/2 | Complete | 2026-03-24 |
| 13. 動きと一貫性 | 0/2 | Not started | - |

**Overall:** 33/37 plans complete (89%)

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

**Details:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 favicon追加 (Phase 7) — SHIPPED 2026-03-21</summary>

- [x] Phase 7: Faviconの実装 (1/1 plans) — completed 2026-03-21

**v1.1 Stats:**
- Total phases: 1
- Total plans: 1
- Timeline: 1 day (2026-03-21)

**Details:** `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 UI/UX改善 (Phases 8-10) — SHIPPED 2026-03-22</summary>

- [x] Phase 8: レスポンシブ対応修正 (3/3 plans) — completed 2026-03-22
- [x] Phase 9: Stats機能実装 (5/5 plans) — completed 2026-03-22
- [x] Phase 10: グリッド統一 (2/2 plans) — completed 2026-03-22

**v1.2 Stats:**
- Total phases: 3
- Total plans: 10
- Timeline: 1 day (2026-03-22)

**Details:** `.planning/milestones/v1.2-ROADMAP.md`

</details>

<details>
<summary>📋 v1.3 アクセシビリティ&品質改善 (Phases 11-13) — PLANNED</summary>

- [x] Phase 11: アクセシビリティ基盤 (4/4 plans) — completed 2026-03-23
- [x] Phase 12: 物理的インタラクション改善 (2/2 plans) — completed 2026-03-24
- [ ] Phase 13: 動きと一貫性 (0/2 plans) — TBD

**v1.3 Stats:**
- Total phases: 3
- Total plans: 10
- Timeline: TBD

</details>

## Phase Details

### Phase 11: アクセシビリティ基盤

**Goal**: ユーザーはWCAG AA基準を満たすUIで、色、キーボード操作、ARIAを通じてアプリを利用できる

**Depends on**: なし

**Requirements**: A11Y-01, A11Y-02, A11Y-03, A11Y-04

**Success Criteria** (what must be TRUE):
1. ユーザーは全てのテキストをWCAG AA 4.5:1のコントラスト比で読める
2. ユーザーはTabキー操作時に明確なfocusスタイル（青色枠等）を確認できる
3. ユーザーはドラッグ操作可能な要素をホバーなしで認識できる（ハンドル常時表示）
4. ユーザーは全てのアイコンボタンに適切なARIAラベルが付与されていることを確認できる

**Plans:** 4/4 plans complete

- [x] 11-00-PLAN.md — Wave 0: テストインフラ構築 (A11Y-02, A11Y-03, A11Y-04 テスト作成)
- [x] 11-01-PLAN.md — カラーコントラスト修正 + Focusスタイル追加 (A11Y-01, A11Y-02)
- [x] 11-02-PLAN.md — ドラッグハンドル常時表示 (A11Y-03)
- [x] 11-03-PLAN.md — ARIAラベル付与 (A11Y-04)

### Phase 12: 物理的インタラクション改善

**Goal**: ユーザーはタッチ・マウス操作で快適にアプリを使える（44pxターゲット、適切なカーソル、オーバーフローなし）

**Depends on**: Phase 11

**Requirements**: TOUCH-01, TOUCH-02, RESP-06, RESP-07

**Success Criteria** (what must be TRUE):
1. ユーザーは全ての対話要素を44px以上のタッチターゲットで操作できる
2. ユーザーは対話可能な要素にカーソルを合わせた際pointer cursorを確認できる
3. ユーザーはモバイル画面でコンテンツが画面外にあふれることなく閲覧できる
4. ユーザーは小さい画面でアルバムアートが適切なサイズで表示され、圧迫感を感じない

**Plans:** 2/2 plans complete

- [x] 12-01-PLAN.md — タッチターゲット拡大 + グローバルcursor定義 (TOUCH-01, TOUCH-02)
- [x] 12-02-PLAN.md — overflow-hidden削除 + アルバムアート固定 + 視覚確認 (RESP-06, RESP-07)

### Phase 13: 動きと一貫性

**Goal**: ユーザーは滑らかなアニメーションと統一された対話フィードバックを体験できる

**Depends on**: Phase 12

**Requirements**: ANIM-01, ANIM-02, CONS-01, CONS-02

**Success Criteria** (what must be TRUE):
1. ユーザーは全てのボタンで統一されたスタイル（角丸）を確認できる
2. ユーザーは全ての対話要素に統一されたホバー効果（Framer Motionのscaleアニメーション）を確認できる

**Plans:** 2 plans

- [ ] 13-01-PLAN.md — ボーダー半径統一（小ボタンの角丸をrounded-xlに統一） (CONS-01)
- [ ] 13-02-PLAN.md — ホバー効果統一（Framer Motion優先、CSSのhover:bg-white/10削除） (CONS-02)

## Coverage Summary

**v1.3 Requirements:**
- Total: 12 requirements
- Mapped: 12/12 (100%) ✓

**Requirement mapping:**
- Phase 11: A11Y-01, A11Y-02, A11Y-03, A11Y-04 (4) — Complete
- Phase 12: TOUCH-01, TOUCH-02, RESP-06, RESP-07 (4) — Complete
- Phase 13: CONS-01, CONS-02 (2)
- Skipped: ANIM-01（deferred）, ANIM-02（既に達成）

---
*Roadmap updated: 2026-03-24*
*Next: `/gsd:execute-phase 13`*
