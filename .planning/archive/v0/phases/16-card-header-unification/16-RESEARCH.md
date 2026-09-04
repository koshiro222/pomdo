# Phase 16: カードヘッダー統一 - Research

**Researched:** 2026-03-24
**Domain:** React Component Styling / Tailwind CSS v4 / Framer Motion
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **タイマーヘッダー配置（HEADER-01）**: 「Pomodoro」テキストをカード最上部（独立行）に追加。flex-rowでp-4のpadding内に配置。「Pomodoro」テキスト下にmb-4の余白。境界線なし（border-bなし）。スタイル: `text-xs uppercase tracking-widest font-bold text-cf-text`
- **BGMヘッダーレイアウト（HEADER-02）**: 「BGM」テキストを左上配置、Listボタンを右上配置。flex構成: `flex items-center justify-between`。中央のスペーサー要素（`<div className="w-5" />`）を削除。mb-3 → mb-4に統一。「BGM」テキスト色: `text-cf-text`（統一）。「BGM」テキストスタイル: `text-xs uppercase tracking-widest font-bold`
- **TodoListヘッダー調整（HEADER-03）**: CheckSquareアイコン削除（テキストのみ）。「TASKS」テキストスタイル: `text-lg font-bold` → `text-xs uppercase tracking-widest font-bold`。「X Left」バッジ維持（現在の`bg-cf-primary/20 text-cf-primary`スタイル）。mb-4 gap-2維持

### Claude's Discretion
- ヘッダーセクションの具体的なレイアウト構成（flex gap等）
- モバイルでの表示調整

### Deferred Ideas (OUT of SCOPE)
- Statsカードのヘッダー変更 — 既に左上・統一スタイルのため変更不要（REQUIREMENTS.mdでスコープ外明記）
- カードコンテンツのレイアウト変更 — 今回はヘッダーのみ対象
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HEADER-01 | タイマーカードに「Pomodoro」ヘッダーテキストが左上・統一スタイル（`text-xs uppercase tracking-widest font-bold`）で表示される | Tailwind CSS v4の `text-xs` (12px), `uppercase`, `tracking-widest` (0.1em), `font-bold` ユーティリティクラスが標準で利用可能。TimerWidget (src/App.tsx line 64-88) にヘッダーセクションを追加 |
| HEADER-02 | BGMカードのヘッダーテキストが左上配置、Listボタンが右上配置になる | `flex items-center justify-between` パターンで左右配置を実現。BgmPlayer (src/components/bgm/BgmPlayer.tsx line 79-96) の現在の3要素レイアウトを2要素に変更 |
| HEADER-03 | TodoListカードのヘッダーテキストのスタイルが他カードと統一される（`text-lg font-bold` → `text-xs uppercase tracking-widest font-bold`） | TodoList (src/components/todos/TodoList.tsx line 75-84) の既存ヘッダースタイルを置換。CheckSquareアイコン削除でテキストのみに |
</phase_requirements>

## Summary

Phase 16は全3カード（タイマー・BGM・TodoList）のヘッダーテキストスタイルと配置を統一し、視覚的一貫性を確保するUI改善フェーズである。主な変更はTailwind CSS v4のユーティリティクラスを使用したスタイルの統一と、Flexboxレイアウトの調整である。

**現在の問題点:**
- タイマーカード: ヘッダーテキストが存在しない
- BGMカード: Listボタン左、「BGM」テキスト中央、スペーサー右の非対称レイアウト
- TodoListカード: `text-lg font-bold` スタイルが他カードと統一されていない

**統一方針:**
全カードのヘッダーテキストに `text-xs uppercase tracking-widest font-bold text-cf-text` を適用し、左上配置に統一する。右上には各カード固有の要素（BGMはListボタン、TodoListはバッジ）を配置する。境界線は使用せず、mb-4で統一する。

**主要な影響範囲:**
- `src/App.tsx`: TimerWidgetにヘッダーセクション追加
- `src/components/bgm/BgmPlayer.tsx`: ヘッダーレイアウトを3要素から2要素に変更
- `src/components/todos/TodoList.tsx`: ヘッダーテキストスタイル変更とアイコン削除

**Primary recommendation:** CONTEXT.mdで決定された実装方針に従い、3カードのヘッダーを統一スタイルと配置で実装する。新規ライブラリの追加は不要。

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.1 | ユーティリティベースのスタイリング | プロジェクトで既に採用済み。`text-xs`, `uppercase`, `tracking-widest`, `font-bold` などの標準クラスが利用可能 |
| React | 19.2.0 | UIコンポーネント構築 | プロジェクトのメインフレームワーク |
| Framer Motion | 12.35.1 | アニメーション | 既存のアニメーション（tapAnimation, hoverAnimation）で使用中 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lucide React | 0.575.0 | アイコン | List、CheckSquareなどのアイコンコンポーネント |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| なし | - | 標準スタックで十分対応可能 |

**Installation:**
なし（既存の依存関係で対応可能）

**Version verification:** 2026-03-24時点でpackage.jsonを確認済み

## Architecture Patterns

### Recommended Project Structure
既存の構造を維持:
```
src/
├── App.tsx                    # TimerWidget定義（ヘッダー追加対象）
├── components/
│   ├── bgm/
│   │   └── BgmPlayer.tsx      # BGMヘッダー（レイアウト変更対象）
│   └── todos/
│       └── TodoList.tsx       # TodoListヘッダー（スタイル変更対象)
```

### Pattern 1: ヘッダーの統一スタイル
**What:** 全カードのヘッダーテキストに `text-xs uppercase tracking-widest font-bold text-cf-text` を適用
**When to use:** カードヘッダーテキストのスタイリング
**Example:**
```tsx
// 統一ヘッダースタイル
<p className="text-xs uppercase tracking-widest font-bold text-cf-text">
  Pomodoro
</p>
```

### Pattern 2: Flexboxでの左右配置
**What:** `flex items-center justify-between` で左上のテキストと右上のアクション要素を配置
**When to use:** ヘッダーセクションで左右に要素を分ける場合
**Example:**
```tsx
<div className="flex items-center justify-between mb-4">
  <p className="text-xs uppercase tracking-widest font-bold text-cf-text">
    BGM
  </p>
  <motion.button {...tapAnimation}>
    <List className="w-5 h-5" />
  </motion.button>
</div>
```

### Pattern 3: Framer Motion layout prop
**What:** `layout="position"` でレイアウトシフトを防止
**When to use:** アニメーションする要素でレイアウトシフトを防ぎたい場合
**Example:**
```tsx
// Source: https://www.framer.com/motion/layout-animations/
<motion.div layout="position">
  {/* content */}
</motion.div>
```

### Anti-Patterns to Avoid
- **境界線の追加**: カード間の視覚的分離には不必要。既存のglassmorphismスタイルと余白で十分
- **異なるmargin-bottom**: 全カードでmb-4に統一し、視覚的一貫性を維持
- **text-lg以上のヘッダー**: `text-xs` (12px) で統一し、視覚的階層を明確に

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ヘッダースタイルの定義 | カスタムCSSクラス | Tailwindユーティリティクラス | 既存のデザインシステムと統一、保守性向上 |
| レイアウト調整 | 複雑なposition指定 | `flex items-center justify-between` | シンプルでレスポンシブに対応 |
| アニメーション | カスタムCSSアニメーション | Framer Motionの既存パターン | tapAnimation, hoverAnimationを再利用 |

**Key insight:** カードヘッダーの統一は既存のデザインシステム（Tailwind CSS v4 + Framer Motion）の範囲内で完結する。新規のカスタムCSSやコンポーネントは不要。

## Common Pitfalls

### Pitfall 1: tracking-widestの過剰な使用
**What goes wrong:** 全てのテキストに `tracking-widest` を適用すると可読性が低下する
**Why it happens:** 見出し用のスタイルを本文にも適用してしまう
**How to avoid:** ヘッダーテキスト（label的な用途）に限定し、本文には使用しない
**Warning signs:** 長いテキストや説明文に適用してしまう

### Pitfall 2: Framer Motionのlayout propの誤用
**What goes wrong:** `layout="position"` を理解せずに使用すると、意図しないアニメーションが発生する
**Why it happens:** layout propの挙動を正しく理解していない
**How to avoid:** 公式ドキュメントを参照し、位置のみのアニメーションに使用する
**Warning signs:** 要素が意図せず拡大縮小する

### Pitfall 3: モバイル表示での崩れ
**What goes wrong:** ヘッダーテキストが長い場合、モバイルでレイアウトが崩れる
**Why it happens:** 固定幅や折り返しを考慮していない
**How to avoid:** `truncate` や `min-w-0` を適切に使用し、flexコンテナ内のサイズ制御を行う
**Warning signs:** モバイルでテキストがはみ出す

## Code Examples

Verified patterns from official sources:

### 統一ヘッダースタイルの適用
```tsx
// Source: Tailwind CSS v4 documentation (https://tailwindcss.com/docs/letter-spacing)
<p className="text-xs uppercase tracking-widest font-bold text-cf-text">
  Pomodoro
</p>
```

### Flexboxでの左右配置
```tsx
// Source: Established pattern in BgmPlayer.tsx, TodoList.tsx
<div className="flex items-center justify-between mb-4">
  <p className="text-xs uppercase tracking-widest font-bold text-cf-text">
    BGM
  </p>
  <motion.button
    {...tapAnimation}
    onClick={() => setIsExpanded(!isExpanded)}
    className="p-3 rounded-xl text-cf-subtext hover:text-cf-primary transition-colors"
    aria-label="プレイリスト"
  >
    <List className="w-5 h-5" />
  </motion.button>
</div>
```

### Framer Motionのlayout prop使用
```tsx
// Source: Framer Motion documentation (https://www.framer.com/motion/layout-animations/)
<motion.div
  className="bento-card"
  variants={fadeInUpVariants}
  initial="hidden"
  animate="visible"
  custom={0}
  layout="position"
>
  {/* content */}
</motion.div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 各カードで異なるヘッダースタイル | `text-xs uppercase tracking-widest font-bold` で統一 | Phase 16 | 視覚的一貫性の向上 |
| BGMカードの3要素ヘッダー（Listボタン・テキスト・スペーサー） | 2要素ヘッダー（テキスト・Listボタン） | Phase 16 | シンプルでわかりやすいレイアウト |
| TodoListの `text-lg font-bold` | `text-xs uppercase tracking-widest font-bold` | Phase 16 | 他カードとの統一感 |

**Deprecated/outdated:**
- CheckSquareアイコン付きヘッダー: テキストのみのクリーンなデザインに変更

## Open Questions

なし。CONTEXT.mdで全ての実装決定が完了している。

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + Testing Library |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HEADER-01 | タイマーカードに「Pomodoro」ヘッダーが統一スタイルで表示される | visual/manual | E2E: `npm run test:e2e tests/e2e/timer.spec.ts` | ❌ Wave 0 |
| HEADER-02 | BGMカードのヘッダーが左右配置でレンダリングされる | visual/manual | E2E: `npm run test:e2e tests/e2e/bgm.spec.ts` | ❌ Wave 0 |
| HEADER-03 | TodoListカードのヘッダースタイルが統一されている | visual/manual | E2E: `npm run test:e2e tests/e2e/todo.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`（既存テストの regression 確認）
- **Per wave merge:** `npm run test:e2e`（E2Eで視覚的確認）
- **Phase gate:** Full E2E green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/e2e/timer-header.spec.ts` — タイマーヘッダーの視覚的テスト
- [ ] `tests/e2e/bgm-header.spec.ts` — BGMヘッダーレイアウトのテスト
- [ ] `tests/e2e/todolist-header.spec.ts` — TodoListヘッダースタイルのテスト
- [ ] 既存E2Eテストの更新（`tests/e2e/timer.spec.ts`, `tests/e2e/bgm.spec.ts`, `tests/e2e/todo.spec.ts`）

Phase 16は視覚的変更が主なため、E2Eテストでの視覚的確認が重要。既存のE2Eテストを更新し、ヘッダーの統一スタイルを確認するテストケースを追加する。

## Sources

### Primary (HIGH confidence)
- Tailwind CSS v4 Documentation - letter-spacing (tracking-widest): https://tailwindcss.com/docs/letter-spacing
- Tailwind CSS v4 Documentation - font-size (text-xs): https://tailwindcss.com/docs/font-size
- Framer Motion Documentation - layout animations: https://www.framer.com/motion/layout-animations/
- Project source code - src/App.tsx, src/components/bgm/BgmPlayer.tsx, src/components/todos/TodoList.tsx

### Secondary (MEDIUM confidence)
- なし（全て一次ソースで確認）

### Tertiary (LOW confidence)
- なし（全て一次ソースで確認）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 既存の依存関係で対応可能。公式ドキュメントで動作確認済み
- Architecture: HIGH - CONTEXT.mdで具体的な実装方針が決定済み。既存パターンの適用
- Pitfalls: MEDIUM - Tailwind CSS v4とFramer Motionの一般的な落とし穴を特定

**Research date:** 2026-03-24
**Valid until:** 2026-04-23 (30日間 - 安定した技術スタックのため)
