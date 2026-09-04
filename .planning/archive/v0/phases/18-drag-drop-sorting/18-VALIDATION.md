---
phase: 18
slug: drag-drop-sorting
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | DND-01 | unit | `npm test -- --run src/components/dnd` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 1 | DND-02 | unit | `npm test -- --run src/components/dnd` | ❌ W0 | ⬜ pending |
| 18-02-01 | 02 | 1 | DND-01 | unit | `npm test -- --run src/db/schema` | ❌ W0 | ⬜ pending |
| 18-03-01 | 03 | 1 | DND-01 | unit | `npm test -- --run src/components/TodoList` | ❌ W0 | ⬜ pending |
| 18-04-01 | 04 | 2 | DND-02 | integration | `npm test -- --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/dnd/__tests__/SortableItem.test.tsx` — DnD コンポーネントのスタブ
- [ ] `src/db/schema/__tests__/todo.test.ts` — order カラム検証のスタブ
- [ ] `src/components/TodoList/__tests__/TodoList.test.tsx` — DnD統合のスタブ

*Existing infrastructure covers basic testing setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ドラッグ中のビジュアルフィードバック | DND-01 | アニメーションと視覚的フィードバックは手動確認が必要 | 1. Todoリストを開く 2. タスクのドラッグハンドルを掴む 3. 移動先を示すプレースホルダーが表示されることを確認 |
| タスク並び替えの永続化（ゲスト） | DND-02 | localStorageへの保存はE2Eテストで検証 | 1. ゲストモードでタスクを並び替え 2. ページをリロード 3. 順序が維持されていることを確認 |
| タスク並び替えの永続化（ログイン） | DND-02 | DBへの保存はE2Eテストで検証 | 1. ログイン状態でタスクを並び替え 2. ページをリロード 3. 順序が維持されていることを確認 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
