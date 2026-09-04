# Phase 15: TodoList統合UI - Research

**Researched:** 2026-03-24
**Domain:** Reactコンポーネント統合、Framer Motionアニメーション
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **ハイライトセクションの配置**: TodoListカードの既存ヘッダー領域内に統合（「Tasks」タイトルとフィルタータブの間）。独立したセクションとして作成せず、ヘッダーに組み込む。選択中タスクがある場合のみ表示
- **進捗表示**: 完了数のみ表示（目標数/estimateは削除）。例: 「3 done」の形式。DBスキーマのestimateフィールドは将来のために残すが、UIでは使用しない
- **テキストスタイル**: text-base font-bold。「Current Task」ラベル: text-xs uppercase tracking-widest text-cf-subtext。タスク名: text-base font-bold text-cf-text
- **アクションボタン**: ハイライトセクション内にCompact配置。短いテキストボタン: 「✓ Complete」「→ Next」。Completeボタン: プライマリーカラー背景。Nextボタン: 白/10背景。タップ可能なサイズ（p-3以上）
- **空状態**: タスク未選択時: 「No task selected」テキストのみ表示。text-smまたはtext-base、text-cf-subtext色。選択促しのボタンやアイコンは追加しない
- **TodoItemとの関係**: 選択中タスクはリスト内に残す。強調表示: 左ボーダー（border-l-2 border-cf-primary）。背景色は変更せずボーダーのみで区別
- **アニメーション**: ハイライトセクションの切り替え時にFramer Motionアニメーション。タスク選択時: スライドイン・フェード。タスク完了時: フェードアウト

### Claude's Discretion
- ハイライトセクションの具体的なレイアウト（flex gap等）
- Framer Motionのバリアント詳細
- モバイルでの表示調整

### Deferred Ideas (OUT OF SCOPE)
- タスク編集機能 — 別フェーズ
- ドラッグ移動 — 別フェーズ
- 目標数（estimate）UI — 今回は削除、将来の検討事項
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TODO-01 | ユーザーはTodoListカード上部に選択中タスクのハイライトセクションを確認できる | `TodoList.tsx`のヘッダー領域に`AnimatePresence`で条件レンダリング。Framer Motionの`slideInVariants`パターン使用 |
| TODO-02 | ユーザーはハイライトセクションでタスク名とPomodoro進捗（完了数）を確認できる | `completedPomodoros`フィールドを表示。「X done」形式のテキスト |
| TODO-03 | ユーザーはTodoListカード内でCompleteおよびNextボタンを操作できる | `useTodos`フックの`updateTodo`と`setSelectedTodoId`使用。`tapAnimation`でタップフィードバック |
| TODO-04 | CurrentTaskCardが削除され、既存機能がTodoListカードに統合されている | Phase 14でDOMから削除済み。本フェーズで機能をTodoListに移管 |
</phase_requirements>

## Summary

Phase 15は、CurrentTaskCardの機能をTodoListカードに統合し、選択中タスクのハイライト表示とPomodoro操作をTodoList内で完結させるUIフェーズです。Phase 14でCurrentTaskCardはDOMから削除済みのため、本フェーズではTodoListカード内にハイライトセクションとアクションボタンを追加します。

**主要な技術的課題:**
1. **ハイライトセクションのレイアウト**: 既存ヘッダー領域（「Tasks」タイトルとフィルタータブの間）への統合
2. **Framer Motionアニメーション**: タスク選択/完了時のスムーズな遷移
3. **TodoItemの選択中スタイル**: `border-l-2 border-cf-primary`での強調表示
4. **進捗表示の変更**: 「完了数/目標数」から「完了数のみ」への修正

**Primary recommendation:** 既存の`TodoList.tsx`コンポーネントのヘッダー領域を拡張し、`AnimatePresence`でハイライトセクションを条件レンダリングする方式を採用。`CurrentTaskCard.tsx`から必要なロジックを抽出し、`useTodos`フック経由で統合。

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Framer Motion | 12.38.0 | アニメーション | プロジェクトで既に使用中。`AnimatePresence`, `slideInVariants`, `tapAnimation`パターン確立済み |
| React | 18.x | UIコンポーネント | プロジェクトのReactバージョン |
| lucide-react | latest | アイコン | プロジェクトで既に使用中。`CheckSquare`, `Check`等 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useTodosフック | カスタム | Todo状態管理 | `selectedTodoId`, `updateTodo`, `setSelectedTodoId`, `incrementCompletedPomodoros`を再利用 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AnimatePresence | CSSトランジション | Framer Motionは既存パターンと一貫性があり、`layout="position"`でレイアウトシフト防止済み |

**Installation:**
必要なライブラリはすべてインストール済み。

**Version verification:**
```bash
npm view framer-motion version
# 12.38.0 (2026-03-24現在)
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/todos/
├── TodoList.tsx        # 変更対象: ハイライトセクション追加
├── TodoItem.tsx        # 変更対象: 選択中スタイル追加
└── TodoInput.tsx       # 変更なし

src/hooks/
└── useTodos.ts         # 再利用: selectedTodoId, updateTodo等

src/lib/
└── animation.ts        # 再利用: slideInVariants, tapAnimation

src/components/tasks/
└── CurrentTaskCard.tsx # 参考用: ロジック移管元（削除済みだがコード参照）
```

### Pattern 1: AnimatePresenceによる条件レンダリング
**What:** 選択中タスクの有無に応じてハイライトセクションをアニメーション付きで表示/非表示
**When to use:** タスク選択/完了時にスムーズな遷移が必要な場合
**Example:**
```tsx
// Source: src/components/todos/TodoList.tsx (既存パターン)
import { AnimatePresence, motion } from 'framer-motion'
import { slideInVariants, tapAnimation } from '@/lib/animation'

// ヘッダー領域内にハイライトセクションを追加
<AnimatePresence mode="popLayout">
  {selectedTodo && (
    <motion.div
      variants={slideInVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-white/5 rounded-xl p-3 mb-4 flex items-center justify-between"
    >
      {/* ハイライトセクションのコンテンツ */}
    </motion.div>
  )}
</AnimatePresence>
```

### Pattern 2: useTodosフックの再利用
**What:** 既存の状態管理ロジックをそのまま使用
**When to use:** Todoの選択、更新、削除操作
**Example:**
```tsx
// Source: src/hooks/useTodos.ts (既存コード)
const { todos, selectedTodoId, setSelectedTodoId, updateTodo, deleteTodo } = useTodos()

const selectedTodo = todos.find((t: Todo) => t.id === selectedTodoId && !t.completed)

const handleComplete = async () => {
  if (selectedTodo) {
    await updateTodo(selectedTodo.id, { completed: true })
    setSelectedTodoId(null)
  }
}

const handleSelectNext = () => {
  const nextTodo = todos.find((t: Todo) => !t.completed && t.id !== selectedTodoId)
  if (nextTodo) {
    setSelectedTodoId(nextTodo.id)
  }
}
```

### Pattern 3: TodoItemの選択中スタイル
**What:** `isSelected` propに基づいて左ボーダーで強調表示
**When to use:** リスト内で選択中タスクを視覚的に区別する場合
**Example:**
```tsx
// Source: src/components/todos/TodoItem.tsx (変更箇所)
// 既存: isSelected && !completed ? 'bg-cf-primary/20 border-cf-primary/50' : ''
// 変更後: ボーダーのみで区別
className={`... ${isSelected && !completed ? 'border-l-2 border-cf-primary' : ''}`}
```

### Anti-Patterns to Avoid
- **独立したセクションの作成**: ヘッダー領域外にハイライトセクションを配置するとレイアウトが複雑になる
- **背景色での強調**: `bg-cf-primary/20`は既存実装だが、今回はボーダーのみで区別する
- **目標数の表示**: DBにはestimateフィールドが残るが、UIでは「完了数のみ」を表示

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| タップフィードバック | 自前のscale/state管理 | `tapAnimation` | 既存パターンと一貫性、Framer Motionの最適化 |
| スライドインアニメーション | 自前のCSSトランジション | `slideInVariants` | 既存パターン、`AnimatePresence`との統合 |
| Todo状態管理 | 自前のuseState | `useTodos`フック | ゲストモード/ログインモードのロジックが既に実装済み |

**Key insight:** CurrentTaskCardから必要なロジックを抽出するが、UIはTodoListの既存パターンに合わせる。新しいカスタムフックや状態管理は不要。

## Common Pitfalls

### Pitfall 1: AnimatePresenceのmode設定
**What goes wrong:** `mode="popLayout"`を設定しないと、ハイライトセクションの表示/非表示時にレイアウトシフトが発生
**Why it happens:** デフォルトの`mode="sync"`では、 exiting要素がレイアウトに残り続ける
**How to avoid:** `<AnimatePresence mode="popLayout">`を使用
**Warning signs:** タスク完了時に下のフィルタータブがガタつく

### Pitfall 2: 選択中タスクのundefinedチェック
**What goes wrong:** `selectedTodo`が`undefined`の場合にプロパティアクセスでエラー
**Why it happens:** `selectedTodoId`が設定されているが、該当するTodoが見つからない（削除済み等）
**How to avoid:** `selectedTodo?.title`のようにオプショナルチェーンを使用
**Warning signs:** 「Cannot read property 'title' of undefined」エラー

### Pitfall 3: border-l-2の競合
**What goes wrong:** 既存の`border`クラスと`border-l-2`が競合して意図しないスタイルになる
**Why it happens:** Tailwindの`border`はすべての辺にボーダーを設定、`border-l-2`は左側のみ
**How to avoid:** `border border-white/5`と`border-l-2 border-cf-primary`を組み合わせる場合、`border-l-2`は左側の幅を上書きするため問題ない
**Warning signs:** 左ボーダーの色が正しく表示されない

### Pitfall 4: 完了数の表示形式
**What goes wrong:** 「3/4 done」のように目標数を表示してしまう
**Why it happens:** 既存の`CurrentTaskCard`コードをコピーすると、estimateフィールドを参照している可能性
**How to avoid:** `completedPomodoros`のみを表示し、estimateは参照しない
**Warning signs:** UIに「/」や「of」が含まれる

## Code Examples

Verified patterns from existing codebase:

### ハイライトセクションの実装
```tsx
// Source: src/components/todos/TodoList.tsx (CONTEXT.mdの具体例を参考)
const { todos, selectedTodoId, setSelectedTodoId, updateTodo } = useTodos()
const selectedTodo = todos.find((t: Todo) => t.id === selectedTodoId && !t.completed)

// ヘッダー領域の拡張
<div className="p-6 border-b border-white/10">
  {/* 既存: タイトルと残りタスク数 */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-bold flex items-center gap-2 text-cf-text">
      <CheckSquare className="text-cf-primary" />
      Tasks
    </h3>
    <span className="text-xs bg-cf-primary/20 text-cf-primary px-2 py-0.5 rounded-full font-bold">
      {remainingTodos} Left
    </span>
  </div>

  {/* 新規: ハイライトセクション */}
  <AnimatePresence mode="popLayout">
    {selectedTodo && (
      <motion.div
        variants={slideInVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-white/5 rounded-xl p-3 mb-4 flex items-center justify-between"
      >
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-cf-subtext font-bold mb-1">
            Current Task
          </p>
          <p className="text-base font-bold text-cf-text">
            {selectedTodo.title}
          </p>
          <p className="text-sm text-cf-subtext">
            {selectedTodo.completedPomodoros || 0} done
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            {...tapAnimation}
            onClick={handleComplete}
            className="bg-cf-primary hover:bg-cf-primary/80 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors"
          >
            ✓ Complete
          </motion.button>
          <motion.button
            {...tapAnimation}
            onClick={handleSelectNext}
            className="bg-white/10 hover:bg-white/20 text-cf-text text-sm font-bold py-2 px-3 rounded-lg transition-colors"
          >
            → Next
          </motion.button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* 既存: フィルタータブ */}
  <div className="flex gap-2 mb-4">
    {/* フィルターボタン */}
  </div>

  <TodoInput onAdd={handleAddTodo} />
</div>
```

### TodoItemの選択中スタイル追加
```tsx
// Source: src/components/todos/TodoItem.tsx (変更箇所)
// 既存のclassNameに追加
className={`group flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:border-cf-primary/30 transition-colors ${
  completed ? 'opacity-60' : ''
} ${isSelected && !completed ? 'border-l-2 border-cf-primary' : ''} ...`}
```

### アクションハンドラー
```tsx
// Source: src/components/tasks/CurrentTaskCard.tsx (ロジック移管)
const handleComplete = async () => {
  if (selectedTodo) {
    await updateTodo(selectedTodo.id, { completed: true })
    setSelectedTodoId(null)
  }
}

const handleSelectNext = () => {
  const nextTodo = todos.find((t: Todo) => !t.completed && t.id !== selectedTodoId)
  if (nextTodo) {
    setSelectedTodoId(nextTodo.id)
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CurrentTaskCard独立コンポーネント | TodoList内にハイライトセクション統合 | Phase 15 | UX改善、画面の簡素化 |
| 「完了数/目標数」表示 | 「完了数のみ」表示 | Phase 15 | ユーザーの認知負荷軽減 |

**Deprecated/outdated:**
- `CurrentTaskCard.tsx`: Phase 14でDOMから削除済み。本フェーズで機能をTodoListに移管

## Open Questions

なし。すべての技術的決定事項はCONTEXT.mdで確定済み。

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Testing Library |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |
| E2E Framework | Playwright |
| E2E Config | `playwright.config.ts` |
| E2E run command | `npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TODO-01 | TodoList上部にハイライトセクションが表示される | e2e | `npm run test:e2e -- tests/e2e/todo.spec.ts -g "ハイライトセクション"` | ❌ Wave 0 |
| TODO-02 | タスク名と完了数が表示される | e2e | `npm run test:e2e -- tests/e2e/todo.spec.ts -g "完了数"` | ❌ Wave 0 |
| TODO-03 | Complete/Nextボタンが操作できる | e2e | `npm run test:e2e -- tests/e2e/todo.spec.ts -g "Complete.*Next"` | ❌ Wave 0 |
| TODO-04 | CurrentTaskCardが存在しない | e2e | `npm run test:e2e -- tests/e2e/todo.spec.ts -g "CurrentTaskCard削除"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`（既存のユニットテスト regression チェック）
- **Per wave merge:** `npm run test:e2e`（E2Eテスト全実行）
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
以下のE2Eテストを新規作成する必要があります：

- [ ] `tests/e2e/todo-highlight.spec.ts` — ハイライトセクションのE2Eテスト
  - TODO-01: タスク選択時にハイライトセクションが表示される
  - TODO-02: タスク名と完了数が表示される
  - TODO-03: Completeボタンクリックでタスクが完了する
  - TODO-03: Nextボタンクリックで次のタスクが選択される
  - TODO-04: CurrentTaskCardがDOMに存在しない
  - TodoItemの選択中スタイル（border-l-2）が適用される
  - タスク未選択時に「No task selected」が表示される

- [ ] `src/components/todos/TodoList.test.tsx` — TodoListコンポーネントのユニットテスト（必要に応じて）
  - ハイライトセクションの条件レンダリング
  - アクションハンドラーの呼び出し

### Framework Installation
VitestとPlaywrightは既にインストール済み。追加のセットアップは不要。

## Sources

### Primary (HIGH confidence)
- `/Users/koshiro/develop/pomdo/.planning/phases/15-todolist-ui/15-CONTEXT.md` — ユーザーの決定事項
- `/Users/koshiro/develop/pomdo/src/components/todos/TodoList.tsx` — 変更対象コンポーネント
- `/Users/koshiro/develop/pomdo/src/components/todos/TodoItem.tsx` — 変更対象コンポーネント
- `/Users/koshiro/develop/pomdo/src/components/tasks/CurrentTaskCard.tsx` — ロジック移管元
- `/Users/koshiro/develop/pomdo/src/hooks/useTodos.ts` — 状態管理フック
- `/Users/koshiro/develop/pomdo/src/lib/animation.ts` — アニメーションパターン
- `/Users/koshiro/develop/pomdo/src/index.css` — スタイルシステム

### Secondary (MEDIUM confidence)
- `/Users/koshiro/develop/pomdo/tests/e2e/todo.spec.ts` — 既存のE2Eテストパターン
- `/Users/koshiro/develop/pomdo/src/components/todos/TodoItem.test.tsx` — 既存のユニットテストパターン

### Tertiary (LOW confidence)
- Framer Motion公式ドキュメント（WebSearchサービスの問題により未確認）
  - https://www.framer.com/motion/ — メインドキュメント（2026-03-24アクセス）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - すべてのライブラリはプロジェクトで既に使用中
- Architecture: HIGH - 既存コンポーネント構造とパターンを確認済み
- Pitfalls: MEDIUM - AnimatePresenceのmode設定は公式ドキュメント未確認だが、プロジェクト内の既存使用パターンから推定

**Research date:** 2026-03-24
**Valid until:** 2026-04-23（30日間有効。Framer Motionのバージョンアップがない限り）
