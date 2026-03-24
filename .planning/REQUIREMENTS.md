# Requirements: Pomdo

**Defined:** 2026-03-25
**Core Value:** ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

## v1.6 Requirements

### レイアウト

- [ ] **LAYOUT-01**: ヘッダー（Tasks/Current Task）とTodoリスト（タブ以降）の間に仕切り線がある
- [ ] **LAYOUT-02**: 「Add a new task」入力がTodoリストの一番下に配置されている

### アニメーション

- [ ] **ANIM-01**: タスク追加時に既存アイテムがスムーズにスライドして空間を作る（layoutアニメーション）
- [ ] **ANIM-02**: 新しいタスクアイテムが展開するように出現する（高さ + フェードイン）

### ドラッグ&ドロップ

- [ ] **DND-01**: タスクをドラッグして並び替えができる
- [ ] **DND-02**: 並び替えた順序が保存される（DB: `order`カラム追加、ゲスト: localStorage）

## v2 Requirements

### テスト

- **TEST-01**: todoルーターの単体テスト
- **TEST-02**: pomodoroルーターの単体テスト
- **TEST-03**: authルーターの単体テスト
- **TEST-04**: bgmルーターの単体テスト

### アクセシビリティ

- **ACCESS-01**: prefers-reduced-motion対応

## Out of Scope

| Feature | Reason |
|---------|--------|
| タスクのグループ化/ラベル | v1.6はUI/UX改善のみ、機能追加は別Issue |
| サブタスク | 複雑度が高い、将来のマイルストーンで検討 |
| キーボードショートカットでのD&D | マウス/タッチのD&Dで十分 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAYOUT-01 | Phase 17 | Pending |
| LAYOUT-02 | Phase 17 | Pending |
| ANIM-01 | Phase 17 | Pending |
| ANIM-02 | Phase 17 | Pending |
| DND-01 | Phase 18 | Pending |
| DND-02 | Phase 18 | Pending |

**Coverage:**
- v1.6 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after roadmap creation*
