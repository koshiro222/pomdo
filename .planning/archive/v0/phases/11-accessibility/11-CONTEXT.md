# Phase 11: アクセシビリティ基盤 - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

ユーザーはWCAG AA基準を満たすUIで、色、キーボード操作、ARIAを通じてアプリを利用できる。

新機能追加ではなく、既存UIのアクセシビリティ基盤改善が範囲。
</domain>

<decisions>
## Implementation Decisions

### カラーコントラスト
- text-cf-subtext (#6b7280) を #9ca3af に変更してWCAG AA 4.5:1準拠
- CSS変数 `--df-text-secondary` を直接修正（一箇所の修正で全体に適用）
- text-cf-muted (#4b5563) は廃止し、text-cf-subtextとtext-cf-textの2段階に整理
- 半透明色（bg-white/5等）のコントラスト改善はスコープ外

### Focusスタイル
- Tailwind v4のfocus-visible擬似クラスを使用（マウスクリック時は非表示、キーボード操作時のみ表示）
- デザイン: `outline: 2px solid var(--df-accent-focus)` + `outline-offset: 2px`
  - 太さ: 2px（標準的）
  - 色: --df-accent-focus (#3b82f6)
  - オフセット: 2px（要素から少し離れて見やすい）
- グローバル適用（@layer baseで全対話要素に一括適用）

### ドラッグハンドル
- 常時薄く表示（opacity-30）し、ホバー時に強調（opacity-50）
- 現在の `opacity-0 group-hover:opacity-50` を `opacity-30 group-hover:opacity-50` に変更
- ARIAラベルは付与しない（role="button"のみ）

### ARIAラベル
- 日本語ラベル（「編集」「削除」「閉じる」「縮小」「プレイリスト」等）
- 各コンポーネントに直接記述（既存パターン：BgmPlayer, TimerControlsに準拠）
- 対象範囲: 主要なアイコンボタンのみ（TodoItem削除、TrackItem編集・削除等）

### Claude's Discretion
- 検証ツールの選択と使用方法（axe DevTools等）
- コントラスト比の具体的な測定と検証手順
- 半透明色のコントラスト改善が必要かの判断
- ARIAラベルの文言の最終調整

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — v1.3要件（A11Y-01～A11Y-04、4件）

### Phase Definition
- `.planning/ROADMAP.md` — Phase 11の成功基準（4項目）

### Design System
- `src/index.css` — Deep Forestカラーパレット定義、@layer base設定
  - `--df-text-secondary: #6b7280` → `#9ca3af` に変更対象
  - `--df-text-muted: #4b5563` → 廃止対象
  - `--df-accent-focus: #3b82f6` — focusスタイルの色参照
  - 現在の `outline-ring/50` 設定との統合が必要

### Existing Patterns
- `src/components/bgm/BgmPlayer.tsx` — aria-label付与の参考例
- `src/components/timer/TimerControls.tsx` — aria-label付与の参考例
- `src/components/todos/TodoItem.tsx` — ドラッグハンドル実装（line 54-60）

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — コンポーネントパターン、命名規則
- `.planning/codebase/STRUCTURE.md` — コンポーネント構造

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **lucide-react** — GripVertical（ドラッグハンドル）, Trash2（削除）, Edit（編集）等のアイコン
- **framer-motion** — motion.button等のアニメーションコンポーネント
- **Tailwind CSS v4** — @theme, @custom-variant, @layer機能

### Established Patterns
- **ARIAラベル**: `aria-label="..."` 属性を直接button要素に付与
- **Drag handle**: `cursor-grab active:cursor-grabbing` でカーソルスタイル指定
- **Focus styles**: 一部inputに `focus:border-cf-primary` が付与されているが不統一

### Integration Points
- **index.css @layer base**: `*:focus-visible` のグローバルスタイル追加
- **Deep Forest カラー**: `--df-text-secondary` 変数の値変更で `text-cf-subtext` 使用箇所（70+箇所）に適用

### Current Issues
- text-cf-subtext (#6b7280) は背景 #121814 とコントラスト比 ~3.5:1（AA 4.5:1に不足）
- text-cf-muted (#4b5563) はさらに低コントラスト（~2.5:1）
- ドラッグハンドルが `opacity-0` でホバー時のみ表示（A11Y-03違反）
- 主要なアイコンボタン（編集・削除）にARIAラベルが欠落

</code_context>

<specifics>
## Specific Ideas

- カラーコントラスト検証はWCAG検証ツールを使用してから判断
- FocusスタイルはGitHub/Google/Notion等の主要サイトの標準（2px青枠）に合わせる
- ドラッグハンドルはNotionの実装（常時薄く表示＋ホバーで強調）を参考
- ARIAラベルは既存のBgmPlayer/TimerControlsの日本語ラベルパターンに準拠

</specifics>

<deferred>
## Deferred Ideas

- **ボタンスタイル統一** — Phase 13（CONS-01, CONS-02）で対応
- **半透明色のコントラスト改善** — 実装時に判断
- **スクリーンリーダー対応の詳細検証** — 今回はARIAラベル付与のみ

</deferred>

---

*Phase: 11-accessibility*
*Context gathered: 2026-03-23*
