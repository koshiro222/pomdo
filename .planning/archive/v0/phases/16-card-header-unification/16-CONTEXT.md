# Phase 16: カードヘッダー統一 - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

全3カード（タイマー・BGM・TodoList）のヘッダーテキストスタイルと配置を統一し、視覚的一貫性を確保する。ヘッダーテキストは左上配置、右上には各カード固有の要素（BGMはListボタン、TodoListはバッジ）を配置する。

</domain>

<decisions>
## Implementation Decisions

### タイマーヘッダー配置（HEADER-01）
- 「Pomodoro」テキストをカード最上部（独立行）に追加
- flex-rowでp-4のpadding内に配置
- 「Pomodoro」テキスト下にmb-4の余白
- 境界線なし（border-bなし）
- スタイル: `text-xs uppercase tracking-widest font-bold text-cf-text`

### BGMヘッダーレイアウト（HEADER-02）
- 「BGM」テキストを左上配置、Listボタンを右上配置
- flex構成: `flex items-center justify-between`
- 中央のスペーサー要素（`<div className="w-5" />`）を削除
- mb-3 → mb-4に統一
- 「BGM」テキスト色: `text-cf-text`（統一）
- 「BGM」テキストスタイル: `text-xs uppercase tracking-widest font-bold`

### TodoListヘッダー調整（HEADER-03）
- CheckSquareアイコン削除（テキストのみ）
- 「TASKS」テキストスタイル: `text-lg font-bold` → `text-xs uppercase tracking-widest font-bold`
- 「X Left」バッジ維持（現在の`bg-cf-primary/20 text-cf-primary`スタイル）
- mb-4 gap-2維持

### ヘッダーの一貫性ルール
- テキストスタイル統一: `text-xs uppercase tracking-widest font-bold text-cf-text`
- flex構成統一: `flex items-center justify-between`
- padding統一: `p-4`（16px）
- margin-bottom統一: `mb-4`（16px）
- 境界線なし（全カード共通）

### Claude's Discretion
- ヘッダーセクションの具体的なレイアウト構成（flex gap等）
- モバイルでの表示調整

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 要件定義
- `.planning/REQUIREMENTS.md` — HEADER-01, HEADER-02, HEADER-03（カードヘッダー統一要件）
- `.planning/ROADMAP.md` §Phase 16 — Success Criteria（4条件）

### 既存コンポーネント
- `src/App.tsx` — TimerWidget定義（ヘッダー追加対象）
- `src/components/bgm/BgmPlayer.tsx` — BGMヘッダー（レイアウト変更対象）
- `src/components/todos/TodoList.tsx` — TodoListヘッダー（スタイル変更対象）

### スタイルシステム
- `src/index.css` — .bento-cardクラス、カラーシステム

### 関連コンテキスト
- `.planning/phases/15-todolist-ui/15-CONTEXT.md` — Phase 15で「Current Task」ラベルに採用された`text-xs uppercase tracking-widest font-bold`スタイル

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.bento-card`クラス（`src/index.css:288`）: glassmorphismスタイル
- Framer Motion: tapAnimation, hoverAnimation
- Lucide-react icons: CheckSquare, List, Musicなど

### Established Patterns
- `layout="position"`: レイアウトシフト防止（v1.2決定）
- `flex items-center justify-between`: ヘッダーコンテナの標準パターン（BGM、TodoListで使用中）
- `text-xs uppercase tracking-widest font-bold`: Phase 15の「Current Task」ラベルで既採用

### Integration Points
- `src/App.tsx` line 64-88: TimerWidget（ヘッダー追加）
- `src/components/bgm/BgmPlayer.tsx` line 79-96: BGMヘッダー（レイアウト変更）
- `src/components/todos/TodoList.tsx` line 75-84: TodoListヘッダー（スタイル変更）

### 既存の問題
- TimerWidget: ヘッダーテキストなし
- BgmPlayer: Listボタン左、「BGM」テキスト中央、スペーサー右の非対称レイアウト
- TodoList: `text-lg font-bold`スタイルが他カードと統一されていない

</code_context>

<specifics>
## Specific Ideas

### タイマーヘッダーのレイアウトイメージ
```tsx
<div className="flex flex-col h-full items-center p-4">
  {/* ヘッダー */}
  <div className="w-full flex items-center justify-between mb-4">
    <p className="text-xs uppercase tracking-widest font-bold text-cf-text">
      Pomodoro
    </p>
  </div>

  {/* 既存のタイマー表示 */}
  <TimerDisplay ... />
</div>
```

### BGMヘッダーの変更後イメージ
```tsx
<div className="flex items-center justify-between mb-4">
  <p className="text-xs uppercase tracking-widest font-bold text-cf-text">
    BGM
  </p>
  <motion.button ...>
    <List className="w-5 h-5" />
  </motion.button>
</div>
```

### TodoListヘッダーの変更後イメージ
```tsx
<div className="flex items-center justify-between mb-4">
  <h3 className="text-xs uppercase tracking-widest font-bold text-cf-text">
    Tasks
  </h3>
  <span className="text-xs bg-cf-primary/20 text-cf-primary px-2 py-0.5 rounded-full font-bold">
    {remainingTodos} Left
  </span>
</div>
```

</specifics>

<deferred>
## Deferred Ideas

- Statsカードのヘッダー変更 — 既に左上・統一スタイルのため変更不要（REQUIREMENTS.mdでスコープ外明記）
- カードコンテンツのレイアウト変更 — 今回はヘッダーのみ対象

</deferred>

---

*Phase: 16-card-header-unification*
*Context gathered: 2026-03-24*
