# Roadmap: Pomdo

**Created:** 2026-02-28
**Current Milestone:** v1.4 Bento Grid再設計 & Todo統合
**Last Updated:** 2026-03-24

## Milestones

- ✅ **v1.0 BGM管理機能追加** — Phases 1-6 (shipped 2026-03-20)
- ✅ **v1.1 favicon追加** — Phase 7 (shipped 2026-03-21)
- ✅ **v1.2 UI/UX改善** — Phases 8-10 (shipped 2026-03-22)
- ✅ **v1.3 アクセシビリティ&品質改善** — Phases 11-13 (shipped 2026-03-24)
- 🚧 **v1.4 Bento Grid再設計 & Todo統合** — Phases 14-15 (in progress)

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
| 15. TodoList統合UI | v1.4 | 0/3 | Planning | - |

**Completed:** 36/36 plans (v1.0-v1.3 + Phase 14)
**In Progress:** v1.4 Phase 15 (0 plans complete)

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

- [x] Phase 11: アクセシビリティ基盤 (4/4 plans) — completed 2026-03-23
- [x] Phase 12: 物理的インタラクション改善 (2/2 plans) — completed 2026-03-24
- [x] Phase 13: 動きと一貫性 (2/2 plans) — completed 2026-03-24

**Details:** `.planning/milestones/v1.3-ROADMAP.md`

</details>

### 🚧 v1.4 Bento Grid再設計 & Todo統合 (In Progress)

**Milestone Goal:** BentoGridを3カラム構成に再設計し、CurrentTaskCardをTodoListに統合してUXを改善する

- [x] **Phase 14: BentoGrid 3カラム再設計** - デスクトップ3カラム・モバイル縦積みのレイアウト基盤を確立する (completed 2026-03-23)
- [x] **Phase 15: TodoList統合UI** - CurrentTaskCardをTodoListカードに統合し、ハイライトセクションとアクションボタンを実装する (completed 2026-03-24)

## Phase Details

### Phase 14: BentoGrid 3カラム再設計
**Goal**: ユーザーがデスクトップとモバイル両方で意図した通りのグリッドレイアウトを確認できる
**Depends on**: Nothing (v1.4 first phase)
**Requirements**: LAYOUT-01, LAYOUT-02
**Success Criteria** (what must be TRUE):
  1. デスクトップ（lg以上）でTimer・Todo・BGM+Statsが横に3列均等で並ぶ
  2. モバイルでTimer→Todo→BGM→Statsの順序で縦に積み重なる
  3. 各カラムが均等幅（1/3ずつ）で表示される
  4. 既存のTimer・BGM・Stats各カードの内部コンテンツが壊れていない
**Plans:** 1/1 plans complete

Plans:
- [x] 14-01-PLAN.md — BentoGrid 3カラム均等レイアウト実装とビジュアル確認

### Phase 15: TodoList統合UI
**Goal**: ユーザーが選択中タスクの情報確認とPomodoro操作をTodoListカード内で完結できる
**Depends on**: Phase 14
**Requirements**: TODO-01, TODO-02, TODO-03, TODO-04
**Success Criteria** (what must be TRUE):
  1. TodoListカードの上部に選択中タスクのハイライトセクションが表示される
  2. ハイライトセクションにタスク名とPomodoro進捗（完了数）が表示される
  3. TodoListカード内にCompleteボタンとNextボタンが表示され、クリックできる
  4. 画面にCurrentTaskCardが存在せず、その機能がTodoListカード内で動作する
  5. タスク未選択時にハイライトセクションが表示されない
**Plans:** 3/3 plans complete

Plans:
- [ ] 15-01-PLAN.md — TodoListにハイライトセクションとTodoItem選択中スタイルを実装
- [ ] 15-02-PLAN.md — TodoList統合UIのE2Eテスト作成
- [ ] 15-03-PLAN.md — ビジュアル・機能確認（チェックポイント）

---
*Roadmap updated: 2026-03-24*
*v1.4 phases: 14-15*
