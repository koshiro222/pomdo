# Phase 15: TodoList統合UI - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

CurrentTaskCardの機能をTodoListカードに統合し、選択中タスクのハイライト表示とPomodoro操作をTodoList内で完結させる。

CurrentTaskCardはPhase 14でDOMから削除済み。本フェーズではTodoListカード内にハイライトセクションとアクションボタンを追加する。

新機能の追加はスコープ外（タスク編集、ドラッグ移動等）。

</domain>

<decisions>
## Implementation Decisions

### ハイライトセクションの配置
- TodoListカードの既存ヘッダー領域内に統合（「Tasks」タイトルとフィルタータブの間）
- 独立したセクションとして作成せず、ヘッダーに組み込む
- 選択中タスクがある場合のみ表示

### 進捗表示
- 完了数のみ表示（目標数/estimateは削除）
- 例: 「3 done」の形式
- DBスキーマのestimateフィールドは将来のために残すが、UIでは使用しない
- REQUIREMENTS.mdのTODO-02「完了数/目標」→「完了数」に修正が必要

### テキストスタイル
- text-base font-bold
- 「Current Task」ラベル: text-xs uppercase tracking-widest text-cf-subtext
- タスク名: text-base font-bold text-cf-text

### アクションボタン
- ハイライトセクション内にCompact配置
- 短いテキストボタン: 「✓ Complete」「→ Next」
- Completeボタン: プライマリーカラー背景
- Nextボタン: 白/10背景
- タップ可能なサイズ（p-3以上）

### 空状態
- タスク未選択時: 「No task selected」テキストのみ表示
- text-smまたはtext-base、text-cf-subtext色
- 選択促しのボタンやアイコンは追加しない

### TodoItemとの関係
- 選択中タスクはリスト内に残す
- 強調表示: 左ボーダー（border-l-2 border-cf-primary）
- 背景色は変更せずボーダーのみで区別

### アニメーション
- ハイライトセクションの切り替え時にFramer Motionアニメーション
- タスク選択時: スライドイン・フェード
- タスク完了時: フェードアウト

### Claude's Discretion
- ハイライトセクションの具体的なレイアウト（flex gap等）
- Framer Motionのバリアント詳細
- モバイルでの表示調整

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 要件定義
- `.planning/REQUIREMENTS.md` — TODO-01, TODO-02, TODO-03, TODO-04
  - TODO-02の「完了数/目標」を「完了数」に修正する必要あり

### 既存コンポーネント
- `src/components/todos/TodoList.tsx` — 変更対象
- `src/components/todos/TodoItem.tsx` — 選択中スタイル追加
- `src/components/tasks/CurrentTaskCard.tsx` — 参考用（機能移管元）

### スタイルシステム
- `src/index.css` — .bento-cardクラス、カラーシステム
- `src/lib/animation.ts` — tapAnimation, hoverAnimation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useTodos` hook — selectedTodoId, setSelectedTodoId, updateTodo, deleteTodo
- `TodoItem` コンポーネント — isSelected propで既に選択状態を受け取れる
- `.bento-card` クラス — glassmorphismスタイル
- Framer Motion — tapAnimation, hoverAnimation

### Established Patterns
- `layout="position"` — レイアウトシフト防止（v1.2決定）
- `flex-1 min-h-0` — Flexbox内のoverflow制御
- p-3以上のタッチターゲットサイズ（v1.3決定）

### Integration Points
- `src/components/todos/TodoList.tsx` のヘッダー領域が変更対象
- `src/hooks/useTodos.ts` で選択ロジックを再利用

</code_context>

<specifics>
## Specific Ideas

### ハイライトセクションのレイアウトイメージ
```tsx
<div className="bento-card flex flex-col min-h-64 sm:h-full">
  {/* ヘッダー */}
  <div className="p-6 border-b border-white/10">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold flex items-center gap-2 text-cf-text">
        <CheckSquare className="text-cf-primary" />
        Tasks
      </h3>
      <span className="text-xs bg-cf-primary/20 text-cf-primary px-2 py-0.5 rounded-full font-bold">
        {remainingTodos} Left
      </span>
    </div>

    {/* === 新規: ハイライトセクション === */}
    {selectedTodo && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
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
            {completedPomodoros} done
          </p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleComplete}
            className="bg-cf-primary hover:bg-cf-primary/80 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors"
          >
            ✓ Complete
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSelectNext}
            className="bg-white/10 hover:bg-white/20 text-cf-text text-sm font-bold py-2 px-3 rounded-lg transition-colors"
          >
            → Next
          </motion.button>
        </div>
      </motion.div>
    )}

    {/* フィルタータブ */}
    <div className="flex gap-2 mb-4">
      {/* 既存のフィルタータブ */}
    </div>

    <TodoInput onAdd={handleAddTodo} />
  </div>

  {/* Todoリスト */}
  <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col gap-3">
    {/* TodoItemにisSelected={selectedTodoId === todo.id}を渡す */}
  </div>
</div>
```

### TodoItemの選択中スタイル
- `isSelected={true}`時に `border-l-2 border-cf-primary` を追加

</specifics>

<deferred>
## Deferred Ideas

- タスク編集機能 — 別フェーズ
- ドラッグ移動 — 別フェーズ
- 目標数（estimate）UI — 今回は削除、将来の検討事項

</deferred>

---

*Phase: 15-todolist-ui*
*Context gathered: 2026-03-24*
