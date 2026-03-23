# Requirements: Pomdo

**Defined:** 2026-03-24
**Core Value:** ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

## v1.4 Requirements

### レイアウト変更

- [x] **LAYOUT-01**: ユーザーはデスクトップでTimer・Todo・BGM+Statsの3カラム均等分割レイアウトを確認できる
- [x] **LAYOUT-02**: ユーザーはモバイルでTimer→Todo→BGM→Statsの縦積み順序を確認できる

### Todo統合

- [ ] **TODO-01**: ユーザーはTodoListカード上部に選択中タスクのハイライトセクションを確認できる
- [ ] **TODO-02**: ユーザーはハイライトセクションでタスク名とPomodoro進捗（完了数）を確認できる
- [ ] **TODO-03**: ユーザーはTodoListカード内でCompleteおよびNextボタンを操作できる
- [ ] **TODO-04**: CurrentTaskCardが削除され、既存機能がTodoListカードに統合されている

## Future Requirements

（現時点でなし）

## Out of Scope

| Feature | Reason |
|---------|--------|
| タイマーカードのサイズ変更 | 均等3分割で固定、タイマーUIの変更は別Issue |
| BGMカードとStatsカードの順序入替 | BGM上・Stats下で固定 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAYOUT-01 | Phase 14 | Complete |
| LAYOUT-02 | Phase 14 | Complete |
| TODO-01 | Phase 15 | Pending |
| TODO-02 | Phase 15 | Pending |
| TODO-03 | Phase 15 | Pending |
| TODO-04 | Phase 15 | Pending |

**Coverage:**
- v1.4 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after roadmap creation*
