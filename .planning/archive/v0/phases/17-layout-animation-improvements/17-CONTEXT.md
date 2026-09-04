# Phase 17: レイアウト&アニメーション改善 - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

TodoListコンポーネントのレイアウト整理とアニメーション改善を実装する。具体的には:
- 仕切り線の位置変更（Current Task下、フィルタータブ上）
- 「Add a new task」入力をリスト最下部へ移動
- 新タスク追加時のスムーズな展開アニメーション（既存アイテムのスライド + 新アイテムの高さ展開）

ドラッグ&ドロップ機能はPhase 18のスコープ。

</domain>

<decisions>
## Implementation Decisions

### 仕切り線の位置（LAYOUT-01）
- Current Taskハイライトセクションの下、フィルタータブ（All/Active/Done）の上に仕切り線を引く
- 「ヘッダーコンテキスト（タイトル + 現在のタスク）」と「ナビゲーション（フィルター）」を明確に分離するレイアウト

### TodoInputの配置と動作（LAYOUT-02）
- ヘッダー内から取り出し、Todoリストの一番下（スクロールエリア内の最後尾）に配置
- ボタン形状（「+ Add a new task...」）は常に見える状態を維持
- クリックで展開するUIは現在の動作を維持
- リストと一緒にスクロール（カード底部への固定はしない）

### 新タスクの追加位置
- 新しく追加されたタスクはリストの一番下（TodoInputの直上）に挿入される
- 現在の動作（リスト先頭への追加）から変更が必要な場合は要確認

### ANIM-01: 既存アイテムのスライドアニメーション
- `TodoItem` コンポーネントに `layout` prop を追加
- `AnimatePresence mode="popLayout"` は既存のため変更不要
- 新アイテム追加時に既存アイテムがスムーズに下へスライドしてスペースを確保

### ANIM-02: 新アイテムの出現アニメーション
- `height: 0 → auto` + `opacity: 0 → 1` の展開アニメーション
- 下から「押し素・expand」するような自然な印象
- 既存の `slideInVariants`（y方向スライド）から置き換える

### Claude's Discretion
- 展開アニメーションの具体的なduration/easing値
- TodoInputをスクロールエリア内に配置する際のflexレイアウト構成
- `height: 0 → auto` の実装方法（Framer Motionのanimateでheightを指定）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 要件定義
- `.planning/REQUIREMENTS.md` — LAYOUT-01, LAYOUT-02, ANIM-01, ANIM-02
- `.planning/ROADMAP.md` §Phase 17 — Success Criteria

### 変更対象コンポーネント
- `src/components/todos/TodoList.tsx` — メイン変更対象（レイアウト構造変更）
- `src/components/todos/TodoItem.tsx` — `layout` prop追加
- `src/components/todos/TodoInput.tsx` — 配置場所の変更のみ（内部実装は変更不要）

### スタイルシステム
- `src/index.css` — .bento-cardクラス、カラーシステム

### アニメーション基盤
- `src/lib/animation.ts` — tapAnimation, hoverAnimation, slideInVariants（参照・置き換え対象）

### 先行フェーズのコンテキスト
- `.planning/phases/15-todolist-ui/15-CONTEXT.md` — ハイライトセクション実装詳細
- `.planning/phases/16-card-header-unification/16-CONTEXT.md` — ヘッダースタイル統一ルール

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AnimatePresence mode="popLayout"` — TodoList.tsxに既存。`layout` prop追加だけでANIM-01が実装できる
- `slideInVariants` （src/lib/animation.ts）— 現在のTodoItemの初期アニメーション。ANIM-02で置き換え対象
- Framer Motion — height: 0→auto のアニメーションはFramer Motionの `animate={{ height: "auto" }}` + `initial={{ height: 0 }}` で実装可能

### 現在の構造
```
.bento-card (p-4 sm:p-6)
  ├── div.border-b.pb-4.mb-4 (ヘッダー全体 — 変更対象)
  │   ├── "Tasks" + badge
  │   ├── Current Task highlight (AnimatePresence)
  │   ├── フィルタータブ
  │   └── TodoInput ← ここを移動
  └── div.flex-1.overflow-y-auto (Todoリスト)
      └── AnimatePresence > TodoItem*
```

### 変更後の目標構造
```
.bento-card (p-4 sm:p-6)
  ├── div (ヘッダー — border-bなし)
  │   ├── "Tasks" + badge
  │   └── Current Task highlight (AnimatePresence)
  ├── div.border-b (仕切り線)
  ├── フィルタータブ
  └── div.flex-1.overflow-y-auto (スクロールエリア)
      ├── AnimatePresence > TodoItem* (layoutアニメあり)
      └── TodoInput ← リスト最下部
```

### Established Patterns
- `layout="position"` — v1.2で採用。サイズ変更アニメーションを無効化しレイアウトシフト競合解消（`layout` propを使う場合は `layout="position"` ではなく単体の `layout` を使う）
- `flex-1 min-h-0` — Flexbox内のoverflowを正しく動作させるパターン
- `p-3以上` のタッチターゲットサイズ（v1.3決定）
- `text-xs uppercase tracking-widest font-bold` — ヘッダーテキスト統一スタイル

### Integration Points
- `src/components/todos/TodoList.tsx` のレイアウト構造が主要変更点
- `useTodos` hook の `addTodo` が返すデータの順序が「新タスクをリスト末尾に追加」に対応しているか確認が必要

</code_context>

<specifics>
## Specific Ideas

### 変更後のレイアウトイメージ
```
Tasks                         3 Left
┌ Current Task ────────────── ┐
│ 設計資料作成    ✔Complete →Next │
└─────────────────────────────┘
─────────────────────────────── ← border-b
[ All ] [ Active ] [ Done ]
・ タスク1
・ タスク2
・ タスク3
[ + Add a new task...          ] ← スクロール内最下部
```

### 新アイテム追加アニメーション（ANIM-02）
- 既存アイテムが `layout` propにより下方向にスライド
- 新アイテムが `height: 0 → auto, opacity: 0 → 1` で展開

</specifics>

<deferred>
## Deferred Ideas

- ドラッグ&ドロップによる並び替え — Phase 18
- 新タスク追加後に自動スクロールして新アイテムを表示 — 実装判断はClaudeに委ねる

</deferred>

---

*Phase: 17-layout-animation-improvements*
*Context gathered: 2026-03-25*
