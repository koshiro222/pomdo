# Phase 10: グリッド統一 - Research

**Research Date:** 2026-03-22
**Domain:** CSS Design System, Tailwind CSS v4, Component Architecture
**Confidence:** HIGH

## Summary

Phase 10はデザインシステムの統一に焦点を当てるフェーズです。CONTEXT.mdで既に決定されたアプローチに基づき、`.bento-card`クラスへの統合とデザインドキュメントの作成を行います。このフェーズは新しいライブラリの導入ではなく、既存コードの整理と文書化が中心です。

**Primary recommendation:** CONTEXT.mdの決定に従い、新しいコンポーネントは作成せず`.bento-card`クラスを使用し、全カードコンポーネントのclassNameを置換する。

## User Constraints (from CONTEXT.md)

### Locked Decisions
- カードデザイン統一（GRID-01）: 既存の`.bento-card`クラスを使用（新しいコンポーネントは作らない）
- App.tsxの各カード: `glass rounded-3xl overflow-hidden` → `bento-card` に置き換え
- StatsCard.tsx: `glass rounded-3xl` → `bento-card` に置き換え
- Framer Motionの`motion.div`構造は維持
- スペーシング統一（GRID-03）: gapは`gap-4`（16px）で維持、paddingはカードサイズに応じて使い分け（大きなカード: `p-6`、小さなカード: `p-4`）
- デザインシステム文書化: `.planning/DESIGN.md`を作成
- グリッド構造（GRID-04）: Phase 08でcol-span修正済み。実装時に各ブレイクポイントで合計が正しいか検証
- ガターサイズ（GRID-02）: `gap-4`（16px）で既に統一済み。変更なし。

### Claude's Discretion
- 具体的なアニメーションのdurationとeasing関数の値
- DESIGN.mdの具体的な構成と記述内容

### Deferred Ideas (OUT OF SCOPE)
なし

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRID-01 | 統一感のあるカードデザイン（BentoCard共通コンポーネント） | `.bento-card`クラスが既に定義済み（glassmorphism + border-radius + overflow + transition + hover） |
| GRID-02 | 一貫したガターサイズ（gap-4: 16px） | 既に`gap-4`で統一済み。変更不要 |
| GRID-03 | 一貫したスペーシング（spacing scale定義と適用） | Tailwind CSS v4の4px基数spacing scaleを使用。大きなカードで`p-6`、小さなカードで`p-4` |
| GRID-04 | グリッドシステムの論理的不整合修正（col-span合計をグリッド列数に合わせる） | Phase 08で修正済み。実装時に検証のみ |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.2 | ユーティリファーストCSSフレームワーク | v4使用中。spacing scaleは4px基数 |
| Framer Motion | 12.35.1 | アニメーションライブラリ | `motion.div`構造を維持 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| なし | - | - | このフェーズでは新しいライブラリ不要 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| .bento-cardクラス | BentoCardコンポーネント | コンポーネント化は柔軟性が高いが、CONTEXT.mdでクラス使用が決定済み |

**Installation:**
なし（既存のライブラリのみ使用）

**Version verification:**
```bash
npm view tailwindcss version  # 4.2.2 (verified 2026-03-22)
npm view framer-motion version  # 12.35.1 (package.json)
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── App.tsx                  # グリッド定義、各カードのclassName修正
├── components/
│   ├── stats/
│   │   └── StatsCard.tsx    # className修正
│   ├── tasks/
│   │   └── CurrentTaskCard.tsx  # className確認（既にglass rounded-3xl p-6）
│   └── bgm/
│       └── BgmPlayer.tsx    # className確認（既にglass rounded-3xl p-4）
├── index.css                # .bento-cardクラス定義（既存）
.planning/
└── DESIGN.md                # 新規作成：デザインシステム文書
```

### Pattern 1: .bento-cardクラス使用
**What:** 既存の`.bento-card`クラスを全カードに適用
**When to use:** 全てのカードコンポーネント
**Example:**
```css
/* Source: src/index.css (lines 268-281) */
.bento-card {
  background: color-mix(in srgb, var(--df-bg-elevated), transparent 40%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--df-border-subtle);
  border-radius: 1.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.bento-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Pattern 2: Spacing Scale（Tailwind CSS v4）
**What:** 4px基数のspacing scale
**When to use:** 全てのspacing（padding, margin, gap）
**Example:**
```tsx
// 大きなカード（TimerWidget, StatsCard）
<div className="bento-card p-6">  {/* 24px */}

// 小さなカード（CurrentTaskCard, BgmPlayer, TodoList）
<div className="bento-card p-4">  {/* 16px */}

// グリッドgap
<div className="grid gap-4">  {/* 16px - 既に統一済み */}
```

### Pattern 3: アニメーション定義
**What:** CSSアニメーションとFramer Motionの併用
**When to use:** マイクロインタラクション
**Example:**
```css
/* Source: src/index.css (lines 210-255) */
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes checkmark {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

.todo-item-enter {
  animation: slideIn 0.2s ease-out;
}

.check-icon-animate {
  animation: checkmark 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Anti-Patterns to Avoid
- **新しいBentoCardコンポーネントの作成:** CONTEXT.mdで`.bento-card`クラス使用が決定済み
- **.glassと.bento-cardの混在:** `.bento-card`に統一
- **アニメーション時間の不統一:** 0.2s-0.3sの範囲で統一

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| スペーシングシステム | 独自のspacing scale | Tailwind spacing | 4px基数で既に標準化済み |
| カードスタイル | 独自のglassmorphism | .bento-cardクラス | 既に完璧な定義が存在 |
| Z-index管理 | magic number | .z-widget-*クラス | 既に10/20/30/9999のスケールが定義済み |

**Key insight:** このフェーズの目的は「統一」であり「新規開発」ではない。既存の良い実装を全体に適用する。

## Common Pitfalls

### Pitfall 1: StatsCardの空状態のclassName忘れ
**What goes wrong:** 空状態（line 60）の`glass rounded-3xl p-6`を`bento-card`に置き換え忘れる
**Why it happens:** 通常状態（line 128）と空状態で別々のdivがあるため
**How to avoid:** 両方のclassNameを置き換え
**Warning signs:** 空状態のみスタイルが異なる

### Pitfall 2: padding値の不統一
**What goes wrong:** 全てのカードで同じpaddingにしてしまう
**Why it happens:** 「統一＝全部同じ」と誤解
**How to avoid:** コンテンツ密度に応じてp-4/p-6を使い分ける
**Warning signs:** コンテンツが詰まりすぎる/余白がありすぎる

### Pitfall 3: motion.divのclassName置換漏れ
**What goes wrong:** motion.divのclassNameを置換せず、内側のdivを置換してしまう
**Why it happens:** アニメーション設定を壊さないように慎重になりすぎる
**How to avoid:** motion.divのclassName直接置換でOK（Framer MotionはclassNameをそのまま渡す）
**Warning signs:** アニメーションが効かなくなる

## Code Examples

Verified patterns from existing code:

### App.tsxのclassName置換
```tsx
// Before
<motion.div className="glass rounded-3xl overflow-hidden sm:col-span-4 sm:row-span-2">

// After
<motion.div className="bento-card sm:col-span-4 sm:row-span-2">
```

### StatsCard.tsxのclassName置換
```tsx
// Before (line 60, 128)
<div className="glass rounded-3xl p-6 h-full flex flex-col">
<div className="glass rounded-3xl p-6 h-full flex flex-col overflow-y-auto min-h-0 relative">

// After
<div className="bento-card p-6 h-full flex flex-col">
<div className="bento-card p-6 h-full flex flex-col overflow-y-auto min-h-0 relative">
```

### CurrentTaskCard（参考：既に正しいpadding）
```tsx
// Line 42 - 既にp-6（大きなカード）
<div className="glass rounded-3xl p-6 h-full flex flex-col relative overflow-hidden">
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| .glassクラス使用 | .bento-cardクラス統一 | Phase 10 | 一貫性のあるカードデザイン |
| 個別のclassName指定 | 統一されたbento-cardクラス | Phase 10 | 保守性向上 |

**既に実装済み:**
- .bento-cardクラス定義（src/index.css）
- Z-index scale（.z-widget-*）
- グリッドシステム（grid-cols-1 sm:grid-cols-6 lg:grid-cols-12）

**Phase 10で実施:**
- 全カードへの.bento-card適用
- DESIGN.md作成

## Open Questions

なし - CONTEXT.mdで全て決定済み

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRID-01 | 全カードでbento-cardクラス使用 | visual-manual | 目視確認 | ❌ Wave 0 |
| GRID-02 | gap-4で統一 | visual-manual | 目視確認 | ❌ Wave 0 |
| GRID-03 | spacing scale適用（p-4/p-6） | visual-manual | 目視確認 | ❌ Wave 0 |
| GRID-04 | グリッドcol-span合計が正しい | visual-manual | 目視確認 | ❌ Wave 0 |

**Note:** このフェーズは視覚的変更が中心であり、自動テストでの検証は困難。目視確認での検証を推奨。

### Sampling Rate
- **Per task commit:** `npm run dev`で動作確認 + 目視チェック
- **Per wave merge:** 全画面サイズでグリッドレイアウト確認
- **Phase gate:** 全GRID要件満たしているか目視確認

### Wave 0 Gaps
- [ ] `tests/unit/grid.test.ts` — 視覚的回帰テスト（スクリーンショット比較）- *オプション*
- [ ] フレームワークインストール: 既に設定済み（vitest, @testing-library/react）

*(Note: Vitest設定は既に完了している。このフェーズでは新しいテストファイル作成は必須ではないが、必要に応じて視覚的回帰テストを追加可能)*

## Sources

### Primary (HIGH confidence)
- src/index.css (lines 268-281) — .bento-cardクラス定義
- src/index.css (lines 153-158) — .glassクラス定義
- src/App.tsx (lines 167-237) — 既存のカードclassName
- src/components/stats/StatsCard.tsx (line 60, 128) — StatsCardのclassName
- vitest.config.ts — テスト設定
- package.json — 依存関係確認

### Secondary (MEDIUM confidence)
- Tailwind CSS v4ドキュメント — spacing scale（4px基数）
- Framer Motionドキュメント — motion.divのclassName prop

### Tertiary (LOW confidence)
- なし - 全て既存コードを直接確認済み

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 既存コードとpackage.jsonを確認済み
- Architecture: HIGH - CONTEXT.mdで決定済み、既存コード構造を確認
- Pitfalls: HIGH - 既存コードを直接確認し、置換漏れのリスクを特定

**Research date:** 2026-03-22
**Valid until:** 30日（スタック変更がないため）
