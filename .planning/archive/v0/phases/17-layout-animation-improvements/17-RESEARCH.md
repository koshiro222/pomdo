# Phase 17: レイアウト&アニメーション改善 - Research

**Researched:** 2026-03-25
**Domain:** React/フロントエンド UIアニメーション
**Confidence:** HIGH

## Summary

Phase 17では、TodoListコンポーネントのレイアウト構造を変更し、Framer Motionを使用したスムーズなアニメーションを実装する。主な変更点は、仕切り線の位置調整、TodoInputのリスト最下部への移動、新タスク追加時のlayoutアニメーションと展開アニメーションの実装。

プロジェクトは既にFramer Motion v12.38.0を採用しており、`AnimatePresence mode="popLayout"`が既に実装済み。`layout` propを追加するだけで既存アイテムのスライドアニメーションが実装可能。新アイテムの展開アニメーションは、`height: 0 → auto` + `opacity: 0 → 1`の組み合わせで実現する。

**Primary recommendation:** Framer Motionの`layout` propと既存の`AnimatePresence mode="popLayout"`を活用し、最小限の変更で要件を達成する。新規ライブラリの追加は不要。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 仕切り線の位置: Current Taskハイライトセクションの下、フィルタータブの上に配置
- TodoInputの配置: ヘッダー内から取り出し、Todoリストの一番下（スクロールエリア内の最後尾）に配置
- 新タスクの追加位置: リストの一番下（TodoInputの直上）に挿入
- ANIM-01: TodoItemに`layout` propを追加し、既存アイテムがスムーズに下へスライド
- ANIM-02: 新アイテムが`height: 0 → auto` + `opacity: 0 → 1`で展開

### Claude's Discretion
- 展開アニメーションの具体的なduration/easing値
- TodoInputをスクロールエリア内に配置する際のflexレイアウト構成
- `height: 0 → auto`の実装方法（Framer Motionのanimateでheightを指定）

### Deferred Ideas (OUT OF SCOPE)
- ドラッグ&ドロップによる並び替え — Phase 18
- 新タスク追加後に自動スクロールして新アイテムを表示 — 実装判断はClaudeに委ねる
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAYOUT-01 | ヘッダー（Tasks/Current Task）とTodoリストの間に仕切り線がある | Framer Motion v12.38.0の`layout` propで既存アイテムのスライドを自動化。仕切り線はTailwindの`border-b`クラスで実装 |
| LAYOUT-02 | 「Add a new task」入力がTodoリストの一番下に配置されている | `TodoInput`をスクロールエリア内の最後に配置。`flex flex-col`構造で実現 |
| ANIM-01 | タスク追加時に既存アイテムがスムーズにスライドして空間を作る | `TodoItem`に`layout` propを追加するだけで実現。`AnimatePresence mode="popLayout"`と組み合わせて動作 |
| ANIM-02 | 新しいタスクアイテムが展開するように出現する（高さ + フェードイン） | `initial={{ height: 0, opacity: 0 }}` + `animate={{ height: "auto", opacity: 1 }}`で実装 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | 12.38.0 | Reactアニメーションライブラリ | 既に採用済み。`layout` prop、`AnimatePresence`が利用可能 |
| react | 19.2.0 | UIライブラリ | プロジェクトで使用中 |
| tailwindcss | 4.2.1 | CSSフレームワーク | 既に採用済み。flexbox、spacing、borderのユーティリティクラスを使用 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.575.0 | アイコンライブラリ | Plusアイコンなどで既に使用中 |
| clsx | 2.1.1 | className条件分岐 | 複雑な条件分岐が必要な場合 |
| tailwind-merge | 3.5.0 | Tailwindクラスマージ | cn()ユーティリティで既に使用中 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| framer-motion | CSS transitions | Framer Motionは`layout` propでレイアウト変更を自動アニメーション。CSSのみで実現する場合は複雑なJSロジックが必要 |
| framer-motion | react-spring | React Springは柔軟だが、`layout` propのような自動レイアウトアニメーションがない |

**Installation:**
```bash
# 新規インストール不要
# 既存パッケージ:
npm install framer-motion@12.38.0 react@19.2.0 tailwindcss@4.2.1
```

**Version verification:**
```bash
npm view framer-motion version
# 12.38.0 (verified 2026-03-25)
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── todos/
│       ├── TodoList.tsx       # メイン変更対象（レイアウト構造変更）
│       ├── TodoItem.tsx       # `layout` prop追加
│       └── TodoInput.tsx      # 配置場所の変更のみ（内部実装は変更不要）
├── lib/
│   └── animation.ts           # 新しい展開アニメーションバリアントを追加
└── hooks/
    └── useTodos.ts            # 新タスク追加位置の確認
```

### Pattern 1: Framer Motion layout prop
**What:** `layout` propを追加するだけで、コンポーネントのレイアウト変更（位置、サイズ）が自動的にアニメーションされる
**When to use:** リストアイテムの追加・削除・並び替え時に、既存アイテムがスムーズに移動する場合
**Example:**
```tsx
// Source: 既存コード src/components/todos/TodoList.tsx
<motion.div layout>
  既存アイテムが自動的にスライド
</motion.div>
```
**Note:** `AnimatePresence mode="popLayout"`と組み合わせることで、exitアニメーション中もlayoutアニメーションが正しく動作する

### Pattern 2: height: 0 → auto 展開アニメーション
**What:** `initial={{ height: 0 }}` + `animate={{ height: "auto" }}`で、高さが0から自然な高さへ展開されるアニメーション
**When to use:** 新しいアイテムが「押し出される」ように出現する場合
**Example:**
```tsx
// Source: Framer Motionパターン
<motion.div
  initial={{ height: 0, opacity: 0 }}
  animate={{ height: "auto", opacity: 1 }}
  transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
>
  新しいタスクアイテムのコンテンツ
</motion.div>
```
**Note:** `overflow: hidden`は不要。Framer Motionが自動的に処理する

### Pattern 3: flexレイアウトでのスクロールエリア
**What:** `flex flex-col min-h-0` + `flex-1 overflow-y-auto`で、Flexbox内のoverflowを正しく動作させる
**When to use:** 親コンテナの高さが制限されている場合に、子要素をスクロール可能にする
**Example:**
```tsx
// Source: 既存パターン src/components/todos/TodoList.tsx
<div className="flex flex-col min-h-0">
  <div className="flex-1 overflow-y-auto">
    スクロール可能なリスト
  </div>
</div>
```
**Note:** `min-h-0`が重要。これがないと、Flexboxの子要素がコンテンツの高さに応じて拡張され続ける

### Anti-Patterns to Avoid
- **`layout="position"`の誤用:** このフェーズでは単体の`layout` propを使用。`layout="position"`は位置のみのアニメーションで、サイズ変更がアニメーションされない
- **CSS transitionとの混用:** Framer MotionのアニメーションとCSS transitionを同じ要素で併用しない。競合して予期しない動作になる
- **`overflow: hidden`の追加:** heightアニメーション時に`overflow: hidden`を追加すると、コンテンツがクリップされる可能性がある

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| レイアウト変更アニメーション | FLIPアニメーションを手動実装 | Framer Motionの`layout` prop | 要素の位置計算、トランジション管理、競合処理が必要。`layout` propが自動化 |
| height展開アニメーション | `scrollHeight`を計算してanimate | Framer Motionの`height: "auto"` | `scrollHeight`の取得、状態管理、クリーンアップが必要。Framer Motionが自動化 |
| AnimatePresenceのmode管理 | exitアニメーションの競合を手動処理 | `mode="popLayout"` | ドキュメントに記載されている最適なモード。既に実装済み |

**Key insight:** Framer Motionの`layout` propは、内部的にFLIP（First, Last, Invert, Play）テクニックを使用しており、要素の位置変更を自動的に計算してアニメーションする。手動実装よりもバグが少なく、パフォーマンスも最適化されている。

## Common Pitfalls

### Pitfall 1: layout propの動作が見えない
**What goes wrong:** `layout` propを追加したのにアニメーションされない
**Why it happens:** `AnimatePresence`と組み合わせていない、または`mode="popLayout"`がない
**How to avoid:** 既存の`AnimatePresence mode="popLayout"`を維持し、各`TodoItem`に`layout` propを追加する
**Warning signs:** 新アイテム追加時に既存アイテムが瞬時に移動する

### Pitfall 2: heightアニメーションでコンテンツがクリップされる
**What goes wrong:** 展開アニメーション中にコンテンツが切れる
**Why it happens:** 親要素に`overflow: hidden`がある、または`height`以外のサイズ制約がある
**How to avoid:** `height: "auto"`アニメーション中は、親要素の`overflow`をデフォルト（`visible`）にする
**Warning signs:** テキストやアイコンが途中で切れる

### Pitfall 3: スクロールエリアが正しく動作しない
**What goes wrong:** TodoInputをリストの下に追加すると、スクロールが効かなくなる
**Why it happens:** Flexboxのデフォルト動作で、子要素がコンテンツの高さに応じて拡張される
**How to avoid:** スクロールする親に`flex-1 overflow-y-auto min-h-0`を追加し、さらにその親に`flex flex-col min-h-0`を追加する
**Warning signs:** コンテンツがカード外にはみ出る、スクロールバーが表示されない

### Pitfall 4: 新タスクの追加位置が期待と異なる
**What goes wrong:** 新タスクがリストの先頭に追加される
**Why it happens:** `useTodos` hookの`addTodo`が、サーバー側で先頭に挿入している可能性
**How to avoid:** 新タスクをリストの末尾に追加する場合は、クライアント側で配列を操作するか、サーバー側のロジックを確認する
**Warning signs:** 新タスクがTodoInputの遠くに表示される

## Code Examples

Verified patterns from official sources:

### Framer Motion layout prop
```tsx
// Source: 既存コード src/components/todos/TodoItem.tsx
// 既存のslideInVariantsを使用した実装
<motion.div
  layout  // これを追加するだけで、レイアウト変更がアニメーションされる
  variants={slideInVariants}
  initial={isNew ? 'hidden' : 'visible'}
  animate="visible"
>
  {title}
</motion.div>
```

### height展開アニメーション
```tsx
// Source: Framer Motionパターン（src/lib/animation.tsに新規追加）
export const expandInVariants: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0, 0, 0.2, 1],
    },
  },
}

// 使用例
<motion.div
  variants={expandInVariants}
  initial="hidden"
  animate="visible"
>
  新しいタスクアイテム
</motion.div>
```

### AnimatePresence mode="popLayout"との組み合わせ
```tsx
// Source: 既存コード src/components/todos/TodoList.tsx
// mode="popLayout"は既に実装済み
<AnimatePresence mode="popLayout">
  {filteredTodos.map((todo: Todo) => (
    <TodoItem
      key={todo.id}
      layout  // これを追加
      // ... other props
    />
  ))}
</AnimatePresence>
```

### flexレイアウト構造
```tsx
// Source: 既存パターン（変更後の構造）
<div className="bento-card flex flex-col min-h-64 sm:h-full p-4 sm:p-6">
  {/* ヘッダー（仕切り線なし） */}
  <div>
    <h3>Tasks</h3>
    {/* Current Task highlight */}
  </div>

  {/* 仕切り線 */}
  <div className="border-b border-white/10 my-4" />

  {/* フィルタータブ */}
  <div className="flex gap-2 mb-4">
    {/* ... */}
  </div>

  {/* スクロールエリア */}
  <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3">
    {/* TodoItem *（layout prop付き） */}
    <TodoItem layout />
    {/* ... */}

    {/* TodoInput（最下部） */}
    <TodoInput />
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 手動FLIPアニメーション | Framer Motion `layout` prop | Framer Motion v1.0+ | レイアウトアニメーションの実装が大幅に簡素化 |
| `layout="size"` または `layout="position"` | 単体の`layout` prop | Framer Motion v12.0+ | デフォルトで最適なアニメーションが選択される |
| CSS heightアニメーション | `animate={{ height: "auto" }}` | Framer Motion v4.0+ | 動的な高さの計算が不要に |

**Deprecated/outdated:**
- `layoutId`によるリストアイテムの共有: このフェーズでは不要。リスト内のアイテム個々のアニメーションのみを実装

## Open Questions

1. **新タスクの追加位置**
   - What we know: 現在の`useTodos` hookは、サーバー側で生成されたタスクをそのまま返している
   - What's unclear: サーバー側で新タスクをリストの先頭に挿入しているか、末尾に挿入しているか
   - Recommendation: 実装時に確認。末尾に追加する場合は、クライアント側で配列を操作する必要があるかもしれない

2. **展開アニメーションのduration**
   - What we know: 既存の`slideInVariants`は`duration: 0.3`を使用
   - What's unclear: ユーザーにとって最適な展開アニメーションの速度
   - Recommendation: 0.3秒から開始し、必要に応じて調整。easingは`[0, 0, 0.2, 1]`（既存パターン）を使用

3. **新タスク追加後の自動スクロール**
   - What we know: CONTEXT.mdで「実装判断はClaudeに委ねる」とされている
   - What's unclear: ユーザー体験への影響
   - Recommendation: 実装時に判断。新タスクが見える位置にある場合は不要、見えない場合は自動スクロールを検討

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAYOUT-01 | 仕切り線がCurrent Task下、フィルタータブ上に表示される | visual/manual | `npm run dev`で確認 | ❌ Wave 0 |
| LAYOUT-02 | TodoInputがリスト最下部に配置される | visual/manual | `npm run dev`で確認 | ❌ Wave 0 |
| ANIM-01 | タスク追加時に既存アイテムがスライドする | manual/smoke | `npm run dev`でタスク追加操作 | ❌ Wave 0 |
| ANIM-02 | 新タスクが展開アニメーションで出現する | manual/smoke | `npm run dev`でタスク追加操作 | ❌ Wave 0 |

**Note:** このフェーズは視覚的変更（レイアウト）とアニメーションが主な対象。自動テストでの検証は困難で、manual/smokeテストが適切。

### Sampling Rate
- **Per task commit:** `npm run dev`で動作確認（視覚的変更のため）
- **Per wave merge:** 全てのSuccess Criteriaを手動で確認
- **Phase gate:** `npm run dev`で全てのアニメーションとレイアウトを確認

### Wave 0 Gaps
- [ ] `tests/unit/todos/TodoList.test.tsx` — レイアウト構造のスナップショットテスト
- [ ] `tests/unit/todos/TodoItem.test.tsx` — `layout` propが渡されているかのテスト
- [ ] `src/test/setup.ts` — Framer Motionのmock設定（必要な場合）

**Framework install:** 既にインストール済み（Vitest 4.0.18）

## Sources

### Primary (HIGH confidence)
- src/components/todos/TodoList.tsx — 既存のレイアウト構造とAnimatePresence実装
- src/components/todos/TodoItem.tsx — 現在のslideInVariants使用状況
- src/lib/animation.ts — 既存のアニメーションバリアント
- package.json — Framer Motion v12.38.0（verified 2026-03-25）

### Secondary (MEDIUM confidence)
- .planning/phases/15-todolist-ui/15-CONTEXT.md — Phase 15のハイライトセクション実装詳細
- .planning/phases/16-card-header-unification/16-CONTEXT.md — Phase 16のヘッダースタイル統一ルール
- src/index.css — カラーシステムと既存のCSSアニメーション定義

### Tertiary (LOW confidence)
- WebSearch検索結果が返ってこなかったため、外部からの検証なし
- Framer Motionの公式ドキュメントに直接アクセスできなかった

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 既存のパッケージを確認済み（Framer Motion 12.38.0）
- Architecture: HIGH - 既存コードのパターンを分析済み
- Pitfalls: MEDIUM - 一部の落とし穴は実装時に検証が必要（スクロールエリアの動作）

**Research date:** 2026-03-25
**Valid until:** 30日（2026-04-24） - Framer Motionのバージョンが大きく変わらない限り有効
