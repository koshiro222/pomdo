# Phase 12: 物理的インタラクション改善 - Research

**Researched:** 2026-03-24
**Domain:** タッチターゲットサイズ、カーソルスタイル、モバイルレスポンシブ
**Confidence:** HIGH

## Summary

Phase 12は、ユーザーがタッチ・マウス操作で快適にアプリを使えるようにする物理的インタラクションの改善を行う。主な取り組みとして、44px以上のタッチターゲットサイズ確保、全ての対話要素へのカーソルポインター付与、モバイルでのオーバーフロー解消、アルバムアートの固定サイズ化がある。

WCAG 2.1 Success Criterion 2.5.5では、タッチターゲットの最小サイズとして24x24 CSSピクセルを要求しているが、iOS Human Interface GuidelinesとMaterial Designはより厳しい44x44ポイント/48x48 dpを推奨している。本プロジェクトでは44px要件（CONTEXT.mdで決定）を採用する。

カーソルポインターのグローバル定義は、Phase 11のfocusスタイル実装と同様のアプローチで`@layer base`に追加する。これは全てのボタン要素に一貫したカーソルスタイルを提供し、アクセシビリティを向上させる。

**Primary recommendation:** CONTEXT.mdの実装決定に従い、小さなアイコンボタンに`p-3`パディングを追加して44pxタッチターゲットを確保し、`index.css`の`@layer base`に`button { cursor: pointer; }`をグローバル定義する。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- タッチターゲットサイズ: 全ての小さなアイコンボタンに`p-3`（12pxパディング）を追加して44px以上のタッチターゲットを確保
  - 対象: BgmPlayerの次/前ボタン、プレイリストボタン、TodoItemの削除ボタン、TrackItemの編集削除ボタン等
  - ホバー時の視覚的フィードバック: `hover:bg-white/10`で薄い背景色を表示
  - 音量スライダーのつまみ（16px）は除外（特別なUIパターンとして）
  - 実装例: `className="p-3 text-cf-subtext hover:bg-white/10 transition-colors"`
- カーソルポインター統一: `index.css`の`@layer base`で`button { cursor: pointer; }`をグローバル定義
  - ドラッグハンドルの`cursor-grab active:cursor-grabbing`はTailwindクラスで上書き（優先順位問題なし）
  - Phase 11のfocusスタイルと同様のグローバル定義アプローチを採用
- モバイルオーバーフロー: 各カードルート（TodoList、CurrentTaskCard、BgmPlayer等）の`overflow-hidden`は削除
  - アニメーション用の`overflow-hidden`（Framer Motion等）は維持
  - App.tsxのルート要素（`min-h-screen`）の`overflow-hidden`は全画面レイアウト用として維持
- アルバムアート表示: BgmPlayerのアルバムアートサイズを96pxで固定（`w-24 h-24`）
  - レスポンシブ縮小（`sm:w-32 sm:h-32`）は削除
  - 一貫性とレイアウト安定性を優先

### Claude's Discretion
- 各ボタンの具体的なパディング値（p-3で問題なければ調整不要）
- ホバー時の背景色の濃度（white/10で問題なければ調整不要）

### Deferred Ideas (OUT OF SCOPE)
- 音量スライダーのつまみ拡大 — スライダーは特別なUIパターンとして除外
- ボタンスタイル統一 — Phase 13（CONS-01, CONS-02）で対応
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TOUCH-01 | ユーザーは44px以上のタッチターゲットで操作できる | WCAG 2.1 SC 2.5.5（24x24px最小）、iOS HIG（44x44pt推奨）、Material Design（48x48dp推奨）に基づき、CONTEXT.mdで44px要件が決定済み。実装は`p-3`（12px）パディング追加で対応可能。 |
| TOUCH-02 | ユーザーは全ての対話要素にカーソルポインターを確認できる | MDN CSS cursorドキュメントに基づき、`button { cursor: pointer; }`のグローバル定義が標準的アプローチ。Phase 11のfocusスタイル実装パターンを適用可能。 |
| RESP-06 | ユーザーはモバイルでオーバーフローなしにコンテンツを閲覧できる | 各カードルートの`overflow-hidden`削除で対応。アニメーション用の`overflow-hidden`は維持し、コンテンツ切り取りを防ぐ。 |
| RESP-07 | ユーザーは小さい画面で圧迫感なくアルバムアートを表示できる | 96px（`w-24 h-24`）固定サイズ化で対応。レスポンシブ縮小の削除は一貫性とレイアウト安定性を優先。 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.1 | ユーティリティファーストCSS | プロジェクトで既に採用済み。`p-3`、`hover:bg-white/10`、`cursor-pointer`等のクラスを提供。 |
| React | 19.2.0 | UIコンポーネント | プロジェクトで既に採用済み。 |
| Framer Motion | 12.35.1 | アニメーション | プロジェクトで既に採用済み。アニメーション用`overflow-hidden`は維持。 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.575.0 | アイコン | 小さなアイコンボタンの対象コンポーネント（GripVertical, Trash2, Edit, SkipBack/SkipForward, List等） |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `p-3`パディング | カスタムタッチターゲットラッパー | `p-3`はTailwind標準クラスで簡潔。ラッパーはコンポーネント構造が複雑化。 |
| グローバルcursor定義 | 各ボタンに個別`cursor-pointer` | グローバル定義は一元管理でき、Phase 11のfocusスタイルパターンと一貫性。 |

**Installation:**
なし（既存パッケージで対応可能）

**Version verification:**
```bash
npm view tailwindcss version  # 4.2.1 (2026-03-24時点)
npm view react version  # 19.2.0 (2026-03-24時点)
npm view framer-motion version  # 12.35.1 (2026-03-24時点)
npm view lucide-react version  # 0.575.0 (2026-03-24時点)
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── bgm/
│   │   └── BgmPlayer.tsx          # 次/前ボタン、プレイリストボタンにp-3追加、overflow-hidden削除、アルバムアート固定サイズ
│   ├── todos/
│   │   ├── TodoItem.tsx           # 削除ボタンにp-3追加
│   │   └── TodoList.tsx           # overflow-hidden削除
│   ├── tasks/
│   │   └── CurrentTaskCard.tsx    # overflow-hidden削除
│   └── timer/
│       └── TimerControls.tsx      # 既に適切なサイズ（size-14）の参考例
├── index.css                      # @layer baseにbutton { cursor: pointer; }追加
└── App.tsx                        # ルート要素のoverflow-hidden維持確認
```

### Pattern 1: タッチターゲットサイズ確保（小さなアイコンボタン）
**What:** 小さなアイコンボタン（w-5 h-5、size={16}等）に`p-3`パディングを追加して44px以上のタッチターゲットを確保する
**When to use:** 対話要素が視覚的に小さい（< 44px）場合
**Example:**
```tsx
// Before: 20pxボタン
<motion.button
  onClick={handlePrevTrack}
  className="text-cf-text hover:text-cf-primary transition-colors"
>
  <SkipBack className="w-6 h-6" />
</motion.button>

// After: 44pxタッチターゲット（20pxアイコン + 12pxパディング×2）
<motion.button
  onClick={handlePrevTrack}
  className="p-3 text-cf-text hover:text-cf-primary hover:bg-white/10 transition-colors"
>
  <SkipBack className="w-6 h-6" />
</motion.button>
```

### Pattern 2: グローバルカーソル定義
**What:** `@layer base`で`button { cursor: pointer; }`を定義し、全ボタンにpointerカーソルを適用する
**When to use:** 全ての対話要素に一貫したカーソルスタイルを提供する場合
**Example:**
```css
/* src/index.css */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  *:focus-visible {
    outline: 2px solid var(--df-accent-focus);
    outline-offset: 2px;
  }

  /* グローバルcursor定義（Phase 12追加） */
  button {
    cursor: pointer;
  }

  /* ドラッグハンドルはTailwindクラスで上書き（cursor-grab active:cursor-grabbing） */

  body {
    @apply bg-background text-foreground;
  }
}
```

### Pattern 3: overflow-hidden削除（カードルート）
**What:** 各カードルートの`overflow-hidden`を削除し、モバイルでコンテンツが切り取られないようにする
**When to use:** カードルート要素がモバイルでコンテンツを切り取っている場合
**Example:**
```tsx
// Before
<div className="bento-card flex flex-col min-h-64 sm:h-full overflow-hidden p-4">

// After
<div className="bento-card flex flex-col min-h-64 sm:h-full p-4">
```

### Pattern 4: アルバムアート固定サイズ
**What:** アルバムアートサイズを96px（`w-24 h-24`）で固定し、レスポンシブ縮小を削除する
**When to use:** 画面サイズによる縮小がレイアウト不安定を引き起こしている場合
**Example:**
```tsx
// Before: レスポンシブサイズ（96px → 128px）
<div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">

// After: 固定サイズ（96px）
<div className="relative w-24 h-24 flex-shrink-0">
```

### Anti-Patterns to Avoid
- **`overflow-hidden`の全削除:** アニメーション用の`overflow-hidden`（Framer Motion等）は維持する必要がある
- **音量スライダーのつまみ拡大:** 16pxつまみは特別なUIパターンとして除外（CONTEXT.md決定）
- **カーソルスタイルの個別指定:** グローバル定義を優先し、ドラッグハンドル等の例外のみTailwindクラスで上書き

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| タッチターゲット計算 | カスタムサイズ計算ロジック | Tailwind `p-3`クラス | 12pxパディング×2 + アイコンサイズ = 44px以上の簡潔な実装 |
| カーソルスタイル管理 | 各ボタンに個別`cursor-pointer` | `@layer base`グローバル定義 | 一元管理され、Phase 11のfocusスタイルパターンと一貫性 |
| オーバーフロー検出 | カスタムオーバーフロー検出ロジック | ブラウザDevTools + 視覚的確認 | モバイル実機での視覚的確認が最も確実 |

**Key insight:** 物的インタラクション改善は、既存のCSS標準（Tailwindクラス、グローバルスタイル）を活用し、特別なUIパターン（スライダー等）を除いて一貫したパターンを適用することで、複雑さを最小限に抑えられる。

## Common Pitfalls

### Pitfall 1: `overflow-hidden`全削除によるアニメーション崩壊
**What goes wrong:** アニメーション用の`overflow-hidden`（Framer Motionの`layout` prop等）まで削除すると、アニメーションが崩れる
**Why it happens:** `overflow-hidden`はアニメーション中に要素をクリッピングするために必要
**How to avoid:** カードルートの`overflow-hidden`のみ削除し、アニメーション用の`overflow-hidden`は維持
**Warning signs:** Framer Motionアニメーションが突然崩れ始めた、要素がアニメーション中にはみ出す

### Pitfall 2: タッチターゲットと視覚的サイズの不一致
**What goes wrong:** パディング追加でタッチターゲットは44px以上になるが、視覚的には小さいままユーザーが気づかない
**Why it happens:** ホバー時の背景色フィードバックがない場合、ユーザーはクリッカブル範囲を認識できない
**How to avoid:** `hover:bg-white/10`等のホバー時背景色を追加し、視覚的フィードバックを提供
**Warning signs:** ユーザーが「ボタンが小さくて押しにくい」とフィードバックする

### Pitfall 3: カーソルスタイルの優先順位問題
**What goes wrong:** グローバル定義の`cursor: pointer`がドラッグハンドル等の例外に適用されない
**Why it happens:** Tailwindの`cursor-grab`クラスがグローバル定義より優先される可能性
**How to avoid:** Tailwindクラス（`cursor-grab active:cursor-grabbing`）はそのまま使用し、グローバル定義はデフォルトとして機能
**Warning signs:** ドラッグハンドルのカーソルがpointerになる

### Pitfall 4: アルバムアート固定サイズによるレイアウト崩壊
**What goes wrong:** 96px固定サイズ化で、既存のレイアウト計算（sm:w-32等）と整合性が取れなくなる
**Why it happens:** レスポンシブ縮小を削除したが、周辺要素の配置がレスポンシブサイズを前提としている
**How to avoid:** レイアウト全体で一貫した固定サイズを採用し、デザインシステムを統一
**Warning signs:** アルバムアート周辺で要素が重なる、余白が不整合になる

## Code Examples

Verified patterns from official sources:

### グローバルcursor定義（MDN CSS cursorドキュメント）
```css
/* Source: https://developer.mozilla.org/en-US/docs/Web/CSS/cursor */
@layer base {
  button {
    cursor: pointer;
  }
}
```

### タッチターゲットサイズ（WCAG 2.1 SC 2.5.5 + iOS HIG）
```tsx
/* Source: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
          https://developer.apple.com/design/human-interface-guidelines/components/menus-and-actions/buttons */

// WCAG 2.1: 24x24 CSS pixels最小
// iOS HIG: 44x44 points推奨
// 実装: p-3（12px）×2 + アイコンサイズ（20px）= 44px

<motion.button
  onClick={handlePrevTrack}
  className="p-3 text-cf-text hover:text-cf-primary hover:bg-white/10 transition-colors"
  title="前の曲"
>
  <SkipBack className="w-6 h-6" />
</motion.button>
```

### Tailwindパディングスケール（Tailwind CSSドキュメント）
```tsx
/* Source: https://tailwindcss.com/docs/padding */
// p-3 = calc(var(--spacing) * 3) = 12px（デフォルト--spacing: 4px）
// アイコン20px + p-3(12px)×2 = 44pxタッチターゲット
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 個別cursor指定 | グローバル`@layer base`定義 | Phase 12（CONTEXT.md決定） | 一元管理され、Phase 11のfocusスタイルパターンと一貫性 |
| レスポンシブアルバムアート | 固定サイズ（96px） | Phase 12（CONTEXT.md決定） | レイアウト安定性向上、一貫性のあるデザインシステム |
| カードルート`overflow-hidden` | 削除（アニメーション用は維持） | Phase 12（CONTEXT.md決定） | モバイルでコンテンツ切り取り解消 |

**Deprecated/outdated:**
- なし

## Open Questions

なし（CONTEXT.mdで全ての実装決定が確定済み）

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + React Testing Library |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOUCH-01 | 小さなアイコンボタンが44px以上のタッチターゲットを持つ | visual/manual | 実機で視覚的確認 | ❌ Wave 0 |
| TOUCH-02 | 全ての対話要素にpointerカーソルが表示される | visual/manual | DevToolsで確認 | ❌ Wave 0 |
| RESP-06 | モバイルでオーバーフローなしにコンテンツを閲覧できる | visual/manual | 実機で視覚的確認 | ❌ Wave 0 |
| RESP-07 | アルバムアートが96pxで固定表示される | visual/manual | 実機で視覚的確認 | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** 視覚的確認（実機テスト）完了後 `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/bgm/BgmPlayer.test.tsx` — 次/前ボタン、プレイリストボタンタッチターゲット検証
- [ ] `src/components/todos/TodoItem.test.tsx` — 削除ボタンタッチターゲット検証
- [ ] `src/components/bgm/TrackItem.test.tsx` — 編集削除ボタンタッチターゲット検証
- [ ] `src/index.css.test.ts` — グローバルcursor定義検証（新規）
- [ ] 視覚的テストユーティリティ — タッチターゲットサイズ、オーバーフロー検証（新規）

**Note:** Phase 12は視覚的改善が主なため、ユニットテストは補助的役割。実機での視覚的確認が最重要。

## Sources

### Primary (HIGH confidence)
- [WCAG 2.1 SC 2.5.5: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — 24x24 CSS pixels最小要件、44px推奨ベストプラクティス
- [iOS Human Interface Guidelines: Buttons](https://developer.apple.com/design/human-interface-guidelines/components/menus-and-actions/buttons) — 44x44 pointsタッチターゲット要件
- [MDN: cursor CSS property](https://developer.mozilla.org/en-US/docs/Web/CSS/cursor) — `cursor: pointer`標準使用法
- [Tailwind CSS: padding documentation](https://tailwindcss.com/docs/padding) — `p-3`（12px）パディング仕様

### Secondary (MEDIUM confidence)
- なし（WebSearchが空結果を返したため、一次ソースのみ使用）

### Tertiary (LOW confidence)
- なし（WebSearchが空結果を返したため、一次ソースのみ使用）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 既存パッケージで対応可能、バージョン確認済み
- Architecture: HIGH - CONTEXT.mdで全ての実装決定が確定済み、コード例あり
- Pitfalls: HIGH - 過去のフェーズ（Phase 11 focusスタイル）で同様のグローバル定義パターンが成功

**Research date:** 2026-03-24
**Valid until:** 2026-04-23（30日 - 安定したドメイン）
