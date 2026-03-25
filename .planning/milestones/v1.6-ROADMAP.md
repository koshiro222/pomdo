# Roadmap: Pomdo

**Created:** 2026-02-28
**Current Milestone:** v1.6 TodoカードUI/UX改善
**Last Updated:** 2026-03-25

## Milestones

- ✅ **v1.0 BGM管理機能追加** — Phases 1-6 (shipped 2026-03-20)
- ✅ **v1.1 favicon追加** — Phase 7 (shipped 2026-03-21)
- ✅ **v1.2 UI/UX改善** — Phases 8-10 (shipped 2026-03-22)
- ✅ **v1.3 アクセシビリティ&品質改善** — Phases 11-13 (shipped 2026-03-24)
- ✅ **v1.4 Bento Grid再設計 & Todo統合** — Phases 14-15 (shipped 2026-03-24)
- ✅ **v1.5 カードヘッダー統一** — Phase 16 (shipped 2026-03-24)
- ✅ **v1.6 TodoカードUI/UX改善** — Phases 17-18 (shipped 2026-03-25)

- 📋 **v1.7 テスト基盤整備** — Phases 19-20 (planned)
- 📋 **v1.8 アクセシビリティ対応** — Phase 21 (planned)

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
| 16. カードヘッダー統一 | v1.5 | 2/2 | Complete | 2026-03-24 |
| 17. レイアウト&アニメーション改善 | v1.6 | 2/2 | Complete | 2026-03-25 |
| 18. ドラッグ&ドロップ並び替え | v1.6 | 4/4 | Complete | 2026-03-25 |

**Completed:** 48/48 plans (v1.0-v1.6)

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

### ✅ v1.6 TodoカードUI/UX改善 (Completed 2026-03-25)

**Milestone Goal:** Todoカードのレイアウト整理・アニメーション改善・ドラッグ&ドロップ並び替えを実装し、タスク操作体験を向上させる

## Phase Details

### Phase 17: レイアウト&アニメーション改善
**Goal**: TodoカードのUIが視覚的に整理され、タスク追加時の動きがスムーズになる
**Depends on**: Phase 16
**Requirements**: LAYOUT-01, LAYOUT-02, ANIM-01, ANIM-02
**Success Criteria** (what must be TRUE):
  1. ヘッダー（Tasks/Current Task）とTodoリストの間に仕切り線が表示される
  2. 「Add a new task」入力欄がTodoリストの一番下に配置されている
  3. タスクを追加すると、既存のタスクアイテムがスムーズにスライドして下に移動する
  4. 新しいタスクが追加された際、高さが展開しながらフェードインで出現する
**Plans**: 2 plans (completed)

Plans:
- [x] 17-01-PLAN.md — アニメーションバリアント追加とTodoItem layout prop実装
- [x] 17-02-PLAN.md — TodoListレイアウト構造変更と視覚確認

### Phase 18: ドラッグ&ドロップ並び替え
**Goal**: ユーザーがタスクを自由に並び替えでき、その順序がセッションをまたいで保持される
**Depends on**: Phase 17
**Requirements**: DND-01, DND-02
**Success Criteria** (what must be TRUE):
  1. タスクをドラッグハンドルで掴んで上下に移動し、任意の位置にドロップできる
  2. 並び替えたタスクの順序がページリロード後も維持される（ログインユーザー: DB、ゲスト: localStorage)
  3. ドラッグ中、移動先を示すビジュアルフィードバック（プレースホルダー等)が表示される
**Plans**: 4 plans (completed)

Plans:
- [x] 18-01-PLAN.md — orderカラム追加とreorderTodoミューテーション実装
- [x] 18-02-PLAN.md — ゲストモードのorder永続化とuseTodos.reorderTodo実装
- [x] 18-03-PLAN.md — DnD UI統合（@dnd-kit）
- [x] 18-04-PLAN.md — マイグレーション適用と検証
