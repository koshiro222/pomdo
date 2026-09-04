---
phase: 18-drag-drop-sorting
verified: 2026-03-25T00:30:00Z
status: passed
score: 5/5 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 0/5
  gaps_closed:
    - "TypeScriptコンパイルエラー: NewTodo型からorderフィールドが除外された"
    - "storage.addTodo呼び出しでcompletedが不要になった"
  gaps_remaining: []
  regressions: []
---

# Phase 18: ドラッグ&ドロップ並び替え 検証レポート

**Phase Goal:** ユーザーがタスクを自由に並び替えでき、その順序がセッションをまたいで保持される
**Verified:** 2026-03-25T00:30:00Z
**Status:** passed
**Re-verification:** Yes — 前回のgap修正後

## Goal Achievement

### Observable Truths

| #   | Truth   | Status     | Evidence       |
| --- | ------- | ---------- | -------------- |
| 1   | タスクをドラッグハンドルで掴んで上下に移動し、任意の位置にドロップできる | ✓ VERIFIED | TodoItem.tsx L33-47: useSortableフック使用、ドラッグハンドルにlisteners/attributesバインド、TodoList.tsx L173-202: DndContextとSortableContextでラップ |
| 2   | 並び替えたタスクの順序がページリロード後も維持される（ログインユーザー: DB、ゲスト: localStorage) | ✓ VERIFIED | ログイン時: todos.ts L107-159: reorder mutation実装、L15: getAllでorderBy order、ゲスト時: storage.ts L107-119: reorderメソッド実装、L52-64: getTodosでorder永続化 |
| 3   | ドラッグ中、移動先を示すビジュアルフィードバック（プレースホルダー等)が表示される | ✓ VERIFIED | TodoItem.tsx L42-47: isDragging時にopacity 0.5、zIndex 1000、TodoList.tsx L178: SortableContextのitemsで全todos管理 |
| 4   | 新規タスク作成時にorder値が自動採番される（最大order + 1） | ✓ VERIFIED | todos.ts L25-34: create mutationで最大order + 1を計算、storage.ts L66-81: addTodoでmaxOrder + 1を設定 |
| 5   | TypeScriptビルドが成功する | ✓ VERIFIED | `npm run build`成功、storage.ts L13: NewTodo型からorder除外、L111: storage.addTodo({ title })呼び出し |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `functions/lib/schema.ts` | todosテーブルにorderカラム | ✓ VERIFIED | L64: `order: integer("order").notNull().default(0)` |
| `src/app/routers/todos.ts` | reorder mutation実装 | ✓ VERIFIED | L107-159: reorder mutation実装済み、移動範囲内更新戦略使用、L15: getAllでorderBy order |
| `src/lib/storage.ts` | Todo型にorderフィールド、reorderメソッド | ✓ VERIFIED | L8: orderフィールド存在、L107-119: reorderメソッド実装済み、L13: NewTodo型からorder除外済み |
| `src/hooks/useTodos.ts` | reorderTodoメソッド | ✓ VERIFIED | L170-190: reorderTodo実装済み、ゲスト時はstorage.reorder、ログイン時はtRPC mutation、L111: storage.addTodo呼び出し修正済み |
| `src/core/store/todos.ts` | reorderLocalTodoアクション | ✓ VERIFIED | L59-70: reorderLocalTodo実装済み |
| `package.json` | @dnd-kit依存関係 | ✓ VERIFIED | @dnd-kit/core@6.3.1, @dnd-kit/sortable@10.0.0, @dnd-kit/utilities@3.2.2 |
| `src/components/todos/TodoItem.tsx` | useSortable統合 | ✓ VERIFIED | L33-47: useSortableフック使用、ドラッグハンドルにlisteners/attributesバインド |
| `src/components/todos/TodoList.tsx` | DndContext/SortableContext | ✓ VERIFIED | L173-202: DndContextとSortableContextでラップ、onDragEnd実装 |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| TodoList.tsx onDragEnd | useTodos.ts reorderTodo | handleDragEnd callback | ✓ VERIFIED | L39-48: handleDragEndでreorderTodo呼び出し、L173-176: DndContextにonDragEndバインド |
| TodoList.tsx DndContext | TodoItem.tsx useSortable | SortableContext items | ✓ VERIFIED | L178: SortableContextのitemsにtodos.map(t => t.id)を指定 |
| useTodos.ts reorderTodo (ログイン時) | todos.ts reorder | tRPC | ✓ VERIFIED | L174-176: reorderMutation.mutate呼び出し、L53-87: オプティミスティックアップデート付き |
| useTodos.ts reorderTodo (ゲスト時) | storage.ts reorder | direct call | ✓ VERIFIED | L179-180: storage.reorder呼び出し + reorderLocalTodo |
| useTodos.ts addTodo (ゲスト時) | storage.ts addTodo | direct call | ✓ VERIFIED | L111: `storage.addTodo({ title })` - 型エラー解消済み |
| todos.ts reorder mutation | schema.ts todos.order | Drizzle update | ✓ VERIFIED | L141-150: 移動範囲内のorderをSQL式でシフト、L153-156: ターゲットを新しい位置に更新 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| DND-01 | 18-03-PLAN.md | タスクをドラッグして並び替えができる | ✓ SATISFIED | TodoItem.tsx L33-47: useSortable統合、TodoList.tsx L173-202: DndContext/SortableContext実装、ドラッグハンドルにlisteners/attributesバインド |
| DND-02 | 18-01-PLAN.md, 18-02-PLAN.md | 並び替えた順序が保存される（DB: orderカラム追加、ゲスト: localStorage） | ✓ SATISFIED | todos.ts L64: orderカラム、L107-159: reorder mutation、storage.ts L107-119: reorderメソッド、useTodos.ts L170-190: reorderTodoでゲスト/ログイン双方に対応 |

**ORPHANED REQUIREMENTS:** なし - 両方の要件がプランからカバーされ、実装されている

### Anti-Patterns Found

なし - 前回のgapが修正され、全てのアンチパターンが解消されました。

### Human Verification Required

### 1. ゲストモードでのドラッグ&ドロップ動作確認

**Test:**
1. `npm run dev`でローカルサーバーを起動
2. 未ログイン状態でTodoリストを開く
3. タスクを2つ以上追加
4. ドラッグハンドル（左側の⋮⋮）を掴んでタスクを上下にドラッグ
5. ドロップ後、順序が変わることを確認
6. ページをリロードし、順序が維持されていることを確認

**Expected:** ドラッグ中に他のアイテムがスムーズにスライドし、ドロップ後に新しい順序で表示される。リロード後も順序が維持される。

**Why human:** ドラッグ&ドロップのアニメーション動作、操作性、視覚的なフィードバックは実際に操作して確認する必要がある。

### 2. ログインモードでのドラッグ&ドロップ動作確認

**Test:**
1. ログイン状態でTodoリストを開く
2. タスクを2つ以上追加
3. ドラッグハンドルでタスクを並び替え
4. ページをリロードし、順序が維持されていることを確認
5. DevToolsのNetworkタブでreorder APIが呼ばれていることを確認

**Expected:** ドラッグ&ドロップで順序が変更され、DBに保存される。リロード後も順序が維持される。オプティミスティックアップデートにより即座にUIが更新される。

**Why human:** APIとの連携、データ永続化、オプティミスティックアップデートの確認が必要。

### 3. フィルタリング中のドラッグ&ドロップ動作確認

**Test:**
1. タスクを追加（完了済みと未完了を混在）
2. 「Active」タブに切り替え
3. 未完了タスクの並び替えができることを確認
4. 「Done」タブに切り替え
5. 完了済みタスクの並び替えができることを確認

**Expected:** フィルタリング状態に関わらず、各タブ内でドラッグ&ドロップが正しく動作する。

**Why human:** フィルタリングロジックとDnDの連携動作を確認する必要がある。

### 4. ドラッグ中のビジュアルフィードバック確認

**Test:**
1. タスクをドラッグする
2. ドラッグ中のアイテムが半透明になることを確認
3. 他のアイテムがスムーズにスライドすることを確認
4. 8px移動でドラッグが開始されることを確認（クリック誤検出防止）

**Expected:** ドラッグ中のアイテムがopacity 0.5で半透明表示、他のアイテムがアニメーション付きでスライド。

**Why human:** 視覚的なフィードバックとアニメーションの滑らかさを確認する必要がある。

### Gaps Summary

なし - 全てのmust-havesが検証され、前回のgapsが解消されました。

**前回のgap修正状況:**
1. ✓ NewTodo型からorderフィールドが除外された（storage.ts L13）
2. ✓ storage.addTodo呼び出しでcompletedが不要になった（useTodos.ts L111）
3. ✓ TypeScriptビルドが成功するようになった

---

_Verified: 2026-03-25T00:30:00Z_
_Verifier: Claude (gsd-verifier)_
