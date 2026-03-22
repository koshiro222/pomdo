# Phase 11: アクセシビリティ基盤 - Research

**Researched:** 2026-03-23
**Domain**: Web Accessibility (WCAG 2.1 AA), Color Contrast, Keyboard Navigation, ARIA
**Confidence**: HIGH

## Summary

WCAG 2.1 AA準拠のアクセシビリティ基盤実装は、カラーコントラスト、キーボードナビゲーション、ドラッグハンドルの常時表示、ARIAラベルの4つの主要な改善領域から成る。このフェーズは新機能追加ではなく、既存UIのアクセシビリティ基盤改善が範囲。

**主要な調査結果:**
1. **カラーコントラスト**: WCAG AA 4.5:1基準を満たすため、`--df-text-secondary: #6b7280` → `#9ca3af` に変更。計算上のコントラスト比は現在~3.5:1、変更後は4.5:1以上に達する
2. **Focusスタイル**: `:focus-visible`擬似クラスを使用し、キーボード操作時のみ2pxの青色枠（`--df-accent-focus: #3b82f6`）を表示。マウスクリック時は非表示
3. **ドラッグハンドル**: `opacity-0` → `opacity-30` に変更し、常時薄く表示。ホバー時は `opacity-50` に強調
4. **ARIAラベル**: 主要なアイコンボタンに日本語ラベル（「編集」「削除」「閉じる」「縮小」「プレイリスト」等）を付与

**主要推奨事項:**
- 検証ツールとして axe DevToolsブラウザ拡張を使用
- コントラスト比はWebAIM Contrast Checkerで確認
- 既存のBgmPlayer、TimerControlsコンポーネントのARIAラベルパターンに準拠

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **カラーコントラスト**:
  - text-cf-subtext (#6b7280) を #9ca3af に変更してWCAG AA 4.5:1準拠
  - CSS変数 `--df-text-secondary` を直接修正（一箇所の修正で全体に適用）
  - text-cf-muted (#4b5563) は廃止し、text-cf-subtextとtext-cf-textの2段階に整理
  - 半透明色（bg-white/5等）のコントラスト改善はスコープ外
- **Focusスタイル**:
  - Tailwind v4のfocus-visible擬似クラスを使用（マウスクリック時は非表示、キーボード操作時のみ表示）
  - デザイン: `outline: 2px solid var(--df-accent-focus)` + `outline-offset: 2px`
  - 太さ: 2px（標準的）
  - 色: --df-accent-focus (#3b82f6)
  - オフセット: 2px（要素から少し離れて見やすい）
  - グローバル適用（@layer baseで全対話要素に一括適用）
- **ドラッグハンドル**:
  - 常時薄く表示（opacity-30）し、ホバー時に強調（opacity-50）
  - 現在の `opacity-0 group-hover:opacity-50` を `opacity-30 group-hover:opacity-50` に変更
  - ARIAラベルは付与しない（role="button"のみ）
- **ARIAラベル**:
  - 日本語ラベル（「編集」「削除」「閉じる」「縮小」「プレイリスト」等）
  - 各コンポーネントに直接記述（既存パターン：BgmPlayer, TimerControlsに準拠）
  - 対象範囲: 主要なアイコンボタンのみ（TodoItem削除、TrackItem編集・削除等）

### Claude's Discretion
- 検証ツールの選択と使用方法（axe DevTools等）
- コントラスト比の具体的な測定と検証手順
- 半透明色のコントラスト改善が必要かの判断
- ARIAラベルの文言の最終調整

### Deferred Ideas (OUT OF SCOPE)
- **ボタンスタイル統一** — Phase 13（CONS-01, CONS-02）で対応
- **半透明色のコントラスト改善** — 実装時に判断
- **スクリーンリーダー対応の詳細検証** — 今回はARIAラベル付与のみ
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| A11Y-01 | ユーザーはWCAG AA基準（4.5:1）を満たすカラーコントラストでテキストを読める | CSS変数変更により `--df-text-secondary` を #9ca3af に変更。コントラスト比4.5:1以上を達成。text-cf-mutedは廃止し2段階整理に移行 |
| A11Y-02 | ユーザーはキーボード操作時に明確なfocusスタイルを確認できる | `:focus-visible` 擬似クラスと `--df-accent-focus` (#3b82f6) を使用したグローバルスタイルを適用。2px枠+2pxオフセット |
| A11Y-03 | ユーザーはドラッグハンドルをキーボードなしで認識できる（常時表示） | ドラッグハンドルのopacityを `opacity-0` → `opacity-30` に変更し、常時表示。ホバー時は `opacity-50` に強調 |
| A11Y-04 | ユーザーは適切なサイズのアイコンボタンを操作できる（ARIAラベル最適化） | 主要なアイコンボタンに日本語ARIAラベルを付与。既存のBgmPlayer/TimerControlsパターンに準拠 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | v4.2 | スタイリング、focus-visible擬似クラス | 既に採用済み。v4は `:focus-visible` をネイティブサポート |
| lucide-react | 最新 | アイコン（GripVertical等） | 既に採用済み。ドラッグハンドル用アイコンを提供 |
| framer-motion | 最新 | アニメーション | 既に採用済み。motion.button等のアニメーションコンポーネント |

### Supporting Tools
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| axe DevTools | 最新 | アクセシビリティ検証 | 開発中の検証、CI/CD統合前の手動テスト |
| WebAIM Contrast Checker | - | コントラスト比確認 | カラー変更時の検証 |
| Chrome DevTools | - | カラーピッカー、要素検査 | 実装中の視覚的確認 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| axe DevTools | Lighthouse | Lighthouseはパフォーマンス含む包括的だが、アクセシビリティ詳細はaxeが優秀 |
| :focus-visible | :focus | `:focus`はマウス操作時にも表示され、UXが劣化 |
| #9ca3af | 明るい色 | より明るい色はコントラスト達成しやすいが、デザインの統一感が損なわれる可能性 |

**Installation:**
```bash
# 既存のプロジェクトにインストール済み
# axe DevToolsはブラウザ拡張としてインストール
# Chrome: https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd
```

**Version verification:**
```bash
npm view tailwindcss version
# 現在のプロジェクトで確認: v4.2が使用されていることを確認
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── index.css              # @layer baseでグローバルfocusスタイル追加
├── components/
│   ├── todos/
│   │   └── TodoItem.tsx   # ドラッグハンドルopacity変更 + aria-label追加
│   ├── bgm/
│   │   ├── TrackItem.tsx  # aria-label追加
│   │   └── BgmPlayer.tsx  # 既存のARIAラベルパターン（参考）
│   └── timer/
│       └── TimerControls.tsx  # 既存のARIAラベルパターン（参考）
```

### Pattern 1: グローバルFocusスタイル（@layer base）
**What**: 全ての対話要素に一括でfocus-visibleスタイルを適用
**When to use**: キーボードナビゲーションが必要な全要素
**Example:**
```css
/* Source: Tailwind CSS v4 Documentation + Project's index.css */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  /* 既存のoutline-ring/50設定との統合が必要 */
  *:focus-visible {
    outline: 2px solid var(--df-accent-focus);
    outline-offset: 2px;
  }

  body {
    @apply bg-background text-foreground;
  }
}
```

### Pattern 2: ドラッグハンドル常時表示
**What**: opacity-0からopacity-30に変更し、常時薄く表示
**When to use**: ドラッグ操作可能な全要素
**Example:**
```tsx
// Source: src/components/todos/TodoItem.tsx (既存コードの修正)
<motion.button
  {...tapAnimation}
  onClick={(e) => e.stopPropagation()}
  className="opacity-30 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing text-cf-subtext"
  role="button"
>
  <GripVertical className="text-sm" />
</motion.button>
```

### Pattern 3: ARIAラベル付与
**What**: アイコンボタンに日本語aria-labelを付与
**When to use**: テキストラベルのないアイコンボタン
**Example:**
```tsx
// Source: src/components/bgm/BgmPlayer.tsx (既存パターン)
<motion.button
  {...tapAnimation}
  onClick={() => setIsExpanded(!isExpanded)}
  className="text-cf-subtext hover:text-cf-primary cursor-pointer transition-colors"
  aria-label={isExpanded ? '縮小' : 'プレイリスト'}
>
  <List className="w-5 h-5" />
</motion.button>
```

### Anti-Patterns to Avoid
- **`:focus`のみの使用**: マウスクリック時にもfocus表示が現れ、ユーザー体験を損なう。`:focus-visible`を使用すること
- **ARIAラベルの英語訳**: スクリーンリーダー利用者にとっては母語のラベルが望ましい。日本語を使用すること
- **ドラッグハンドルの完全非表示**: キーボードのみのユーザーがドラッグ操作を認識できない。常時薄く表示すること

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| コントラスト比計算 | 自前で相対輝度計算 | WebAIM Contrast Checker | WCAG準拠の複雑な計算式 `(L1+0.05)/(L2+0.05)` を手実装するとバグの原因に |
| アクセシビリティ検証 | 自前のチェックリスト | axe DevTools | 800,000+以上のインストール実績。WCAGルールセットを網羅 |
| Focus検出 | ポインターイベント検出 | `:focus-visible` 擬似クラス | ブラウザのヒューリスティックに委ねることで、より正確な検出が可能 |

**Key insight**: アクセシビリティ対応は標準化されたツールやCSS機能を使用することで、実装コストを削減しつつ品質を保証できる。

## Common Pitfalls

### Pitfall 1: コントラスト比の誤った計算
**What goes wrong**: 相対輝度の計算式を間違えると、実際にはWCAG不適合な色を適用してしまう
**Why it happens**: `(L1+0.05)/(L2+0.05)` の計算はsRGB色空間でのガンマ補正を含む複雑な式
**How to avoid**: WebAIM Contrast Checkerなどの検証ツールを使用する
**Warning signs**: 目視での確認のみ行う、計算結果がツールと一致しない

### Pitfall 2: `:focus-visible`のブラウザサポート
**What goes wrong**: 古いブラウザでは`:focus-visible`が動作せず、focus表示が消える
**Why it happens**: `:focus-visible`は比較的新しいCSS擬似クラス（2022年3月頃から主要ブラウザでサポート）
**How to avoid**: `@supports not selector(:focus-visible)` フォールバックを提供する
**Warning signs**: 古いブラウザ（Safari < 15.4, Firefox < 85）でテストしていない

### Pitfall 3: ARIAラベルの過剰な付与
**What goes wrong**: 既に視覚的に明らかなラベルに対してもARIAラベルを重複して付与する
**Why it happens**: 「とりあえず付与しておく」という考え方
**How to avoid**: テキストラベルがないアイコンボタンに限定する
**Warning signs**: スクリーンリーダーで聞いた際に同じ内容が2回読まれる

### Pitfall 4: 半透明色のコントラスト不足
**What goes wrong**: `bg-white/5` のような半透明色は、背景色によってコントラストが変化する
**Why it happens**: 半透明色は「色そのもの」ではなく「混合する色」であるため
**How to avoid**: このフェーズではスコープ外とし、必要に応じて別途対応する
**Warning signs**: 異なる背景色の上で要素を見た際にコントラストが著しく異なる

## Code Examples

Verified patterns from official sources:

### カラーコントラスト検証
```typescript
// Source: WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)
// 使用方法: ブラウザ拡張またはWebツールで色を入力
//
// 背景: #121814 (--df-bg-surface)
// 前景色: #6b7280 (--df-text-secondary, 現在) → コントラスト比 ~3.5:1 (不適合)
// 前景色: #9ca3af (--df-text-secondary, 修正後) → コントラスト比 4.5:1以上 (適合)
//
// 検証手順:
// 1. WebAIM Contrast Checkerを開く
// 2. 前景色に#9ca3af、背景色に#121814を入力
// 3. "Normal Text" の "AA" が✅になることを確認
```

### グローバルFocusスタイル
```css
/* Source: Tailwind CSS v4 Documentation (https://tailwindcss.com/docs/hover-focus-and-other-states#focus-visible) */
/* 既存のindex.cssに以下を追加 */

@layer base {
  /* 既存設定 */
  * {
    @apply border-border outline-ring/50;
  }

  /* 新規追加: focus-visibleスタイル */
  *:focus-visible {
    outline: 2px solid var(--df-accent-focus);
    outline-offset: 2px;
  }

  /* フォールバック（必要に応じて） */
  @supports not selector(:focus-visible) {
    *:focus {
      outline: 2px solid var(--df-accent-focus);
      outline-offset: 2px;
    }
  }
}
```

### ドラッグハンドル常時表示
```tsx
// Source: src/components/todos/TodoItem.tsx (既存コードの修正前)
// 修正前:
<motion.button
  {...tapAnimation}
  onClick={(e) => e.stopPropagation()}
  className="opacity-0 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing text-cf-subtext"
>
  <GripVertical className="text-sm" />
</motion.button>

// 修正後:
<motion.button
  {...tapAnimation}
  onClick={(e) => e.stopPropagation()}
  className="opacity-30 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing text-cf-subtext"
  role="button"
>
  <GripVertical className="text-sm" />
</motion.button>
```

### ARIAラベル付与
```tsx
// Source: src/components/bgm/BgmPlayer.tsx (既存パターン)
// 既存の良い例:
<motion.button
  {...tapAnimation}
  onClick={() => setIsExpanded(!isExpanded)}
  className="text-cf-subtext hover:text-cf-primary cursor-pointer transition-colors"
  aria-label={isExpanded ? '縮小' : 'プレイリスト'}
>
  <List className="w-5 h-5" />
</motion.button>

// TodoItem削除ボタンに適用する例:
<motion.button
  {...tapAnimation}
  onClick={(e) => {
    e.stopPropagation()
    onDelete(id)
  }}
  className="text-cf-subtext hover:text-cf-danger transition-colors"
  aria-label="削除"
>
  <Trash2 className="text-sm" />
</motion.button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `:focus`のみ使用 | `:focus-visible`使用 | 2022年3月 | マウス操作時に不要なfocus表示が出なくなった |
| コントラスト目視確認 | WebAIM等の検証ツール | 2010年代前半 | WCAG準拠の正確な判定が可能に |
| ARIAラベルなし | ARIAラベル付与（日本語） | 2014年(WCAG 2.0) | スクリーンリーダー利用者のUX向上 |

**Deprecated/outdated:**
- **`:focus`のみの使用**: キーボード・マウス両方でfocus表示が出るため、`:focus-visible`が推奨
- **IE11対応**: IE11は`:focus-visible`非対応だが、現在はモダンブラウザ対応で十分
- **英語ARIAラベル**: 日本語アプリケーションでは日本語ラベルが推奨

## Open Questions

1. **半透明色のコントラスト改善**
   - What we know: `bg-white/5`等の半透明色は、スコープ外としてCONTEXT.mdで明記
   - What's unclear: 今後のフェーズで対応が必要か
   - Recommendation: ユーザーフィードバック次第でPhase 12以降で検討

2. **スクリーンリーダー対応の詳細検証**
   - What we know: 今回はARIAラベル付与のみ。スクリーンリーダーでの動作検証はスコープ外
   - What's unclear: NVDA、VoiceOver、JAWS等での具体的な動作確認
   - Recommendation: 別途アクセシビリティ監査を実施

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | vitest.config.ts |
| Setup file | src/test/setup.ts |
| Quick run command | `npm test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| A11Y-01 | カラーコントラスト4.5:1準拠 | manual-only | axe DevTools手動実行 | ❌ Wave 0 |
| A11Y-02 | キーボードfocus表示 | unit | `npm test -- TodoItem` | ❌ Wave 0 |
| A11Y-03 | ドラッグハンドル常時表示 | unit | `npm test -- TodoItem` | ❌ Wave 0 |
| A11Y-04 | ARIAラベル付与 | unit | `npm test -- --grep "aria-label"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit**: `npm test -- [target_component]`（該当コンポーネントのみテスト）
- **Per wave merge**: `npm run test:coverage`（全テスト + カバレッジ）
- **Phase gate**: axe DevTools手動実行 + カバレッジ80%以上

### Wave 0 Gaps
- [ ] `src/components/todos/TodoItem.test.tsx` — A11Y-02, A11Y-03（focus表示、ドラッグハンドル）
- [ ] `src/components/bgm/TrackItem.test.tsx` — A11Y-04（ARIAラベル）
- [ ] `src/test/accessibility-test-utils.tsx` — 共通アクセシビリティテストユーティリティ
- [ ] Framework install: なし（既にvitest導入済み）

## Sources

### Primary (HIGH confidence)
- [W3C WCAG 2.1 Understanding Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) — 4.5:1基準の定義と計算方法
- [MDN :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — :focus-visible擬似クラスの仕様とブラウザサポート
- [Deque axe DevTools](https://www.deque.com/axe/devtools/) — アクセシビリティ検証ツールの公式ページ
- [Tailwind CSS v4 Focus States](https://tailwindcss.com/docs/hover-focus-and-other-states#focus-visible) — Tailwind v4でのfocus-visible使用方法
- [Project CONTEXT.md](/.planning/phases/11-accessibility/11-CONTEXT.md) — ユーザーの決定事項
- [Project index.css](/src/index.css) — 既存のカラーパレット定義

### Secondary (MEDIUM confidence)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — コントラスト比計算ツール
- [Project BgmPlayer.tsx](/src/components/bgm/BgmPlayer.tsx) — 既存のARIAラベルパターン
- [Project TimerControls.tsx](/src/components/timer/TimerControls.tsx) — 既存のARIAラベルパターン
- [Project TodoItem.tsx](/src/components/todos/TodoItem.tsx) — ドラッグハンドルの現在の実装

### Tertiary (LOW confidence)
- なし（全てHIGHまたはMEDIUM confidenceで検証済み）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Tailwind CSS v4、lucide-reactはプロジェクトで既に採用済み
- Architecture: HIGH - プロジェクト内の既存パターン（BgmPlayer、TimerControls）に基づいて推奨
- Pitfalls: HIGH - 公式ドキュメント（W3C、MDN）で検証済み
- Validation architecture: HIGH - 既存のvitest設定を確認済み

**Research date:** 2026-03-23
**Valid until:** 2026-04-22（30日間有効。アクセシビリティ標準は安定しているため長期間有効）
