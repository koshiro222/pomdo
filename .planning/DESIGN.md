# Pomdo デザインシステム

**Version:** 1.0
**Last Updated:** 2026-03-22
**Status:** Active

## Overview

Pomdoのデザインシステムは、ユーザーが集中して作業を完了できるようにするために設計されています。Deep Forestカラーパレットをベースにしたダークモードデザイン、一貫したスペーシング、スムーズなアニメーション、そしてレスポシブなグリッドシステムを提供します。

### 原則

- **一貫性**: 全コンポーネントで統一されたspacing、colors、typographyを使用
- **アクセシビリティ**: コントラスト比7+を確保（WCAG AA準拠）
- **レスポンシブ**: モバイルファースト、全画面サイズ対応
- **パフォーマンス**: アニメーションは0.2〜0.3秒、GPUアクセラレーション活用

---

## Spacing Scale

Tailwind CSS v4ベースの4px基数システム。

### 基本値

| Token | Value | Usage |
|-------|-------|-------|
| `0` | 0px | リセット |
| `1` | 4px | 最小スペース |
| `2` | 8px | 小さな要素間 |
| `3` | 12px | 中程度のスペース |
| `4` | 16px | **標準ガター**、カード内余白（小） |
| `5` | 20px | - |
| `6` | 24px | **カード内余白（大）** |
| `8` | 32px | セクション間 |
| `12` | 48px | 大きなセクション間 |

### 適用ルール

- **gap**: `gap-4`（16px）で全グリッドに統一
- **padding**:
  - 大きなカード（TimerWidget, StatsCard）: `p-6`（24px）
  - 小さなカード（CurrentTaskCard, BgmPlayer, TodoList）: `p-4`（16px）
- **margin**: 原則使用せず、gap/flex/grid spacingを使用

```tsx
// グリッドシステム
<div className="grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4">

// カード内余白
<div className="p-6">{/* 大きなカード */}</div>
<div className="p-4">{/* 小さなカード */}</div>
```

---

## Animation

### Duration

| コンテキスト | Duration | Easing | 用途 |
|------------|----------|--------|------|
| 初期表示 | 0.2s | ease-out | フェードイン、スライドイン |
| Hoverトランジション | 0.3s | ease | ボーダー、シャドウ |
| タイマーリング | 0.5s | ease-in-out | プログレス表示 |
| アルバムアート回転 | 8s | linear | BGM再生中表示 |

### Easing関数

| Token | 値 | 用途 |
|-------|---|------|
| `ease-out` | cubic-bezier(0, 0, 0.2, 1) | 自然な減速 |
| `ease` | cubic-bezier(0.4, 0, 0.2, 1) | 標準トランジション |
| `ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | 両方向アニメーション |
| `cubic-bezier(0.34, 1.56, 0.64, 1)` | バウンス | チェックマーク |

### Framer Motion設定

```tsx
// レイアウトシフト最適化
<motion.div layout="position" />

// フェードインアップアニメーション
const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
};
```

### CSSアニメーション

```css
/* タスク追加 - 上からスライドイン */
.todo-item-enter {
  animation: slideIn 0.2s ease-out;
}

/* タスク完了 - チェックマークスケール */
.check-icon-animate {
  animation: checkmark 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-xl` | 0.75rem（12px） | 小さな要素、ボタン |
| `rounded-3xl` | 1.5rem（24px） | **全カード（.bento-card）** |
| `rounded-2xl` | 1rem（16px） | 使用停止（bento-cardに統一） |

```css
.bento-card {
  border-radius: 1.5rem; /* rounded-3xl */
}
```

---

## Z-index Scale

レイヤー化のためのz-indexスケール。

| Class | Value | Usage |
|-------|-------|-------|
| `.z-widget-bg` | 10 | 背景要素 |
| `.z-widget` | 20 | 通常のウィジェット |
| `.z-widget-overlay` | 30 | オーバーレイ、ドロップダウン |
| `.z-widget-modal` | 9999 | モーダル、ダイアログ |

```tsx
<div className="z-widget-overlay">{/* オーバーレイ */}</div>
```

---

## Colors

### Deep Forestカラーパレット

| Role | CSS Variable | Value | Usage |
|------|--------------|-------|-------|
| Primary | `--df-accent-primary` | #22c55e | 完了、フォーカス、成功 |
| Focus | `--df-accent-focus` | #3b82f6 | アクティブ状態、選択中 |
| Break | `--df-accent-break` | #f59e0b | 休憩、警告 |
| Danger | `--df-accent-danger` | #ef4444 | 削除、エラー |
| Background | `--df-bg-surface` | #121814 | メイン背景 |
| Elevated | `--df-bg-elevated` | #1a211c | カード背景 |
| Border | `--df-border-subtle` | rgba(255,255,255,0.06) | カード境界線 |
| Text Primary | `--df-text-primary` | #e5e7eb | メインテキスト（コントラスト7+） |
| Text Secondary | `--df-text-secondary` | #6b7280 | サブテキスト |
| Text Muted | `--df-text-muted` | #4b5563 | 無効状態 |

### Tailwindクラスでの使用

```tsx
// テキスト
<p className="text-foreground">{/* --df-text-primary */}</p>
<p className="text-muted-foreground">{/* --df-text-secondary */}</p>

// 背景
<div className="bg-background">{/* --df-bg-surface */}</div>
<div className="bg-card">{/* --df-bg-elevated */}</div>

// アクセント
<button className="bg-primary">{/* --df-accent-primary */}</button>
<button className="bg-accent">{/* --df-accent-focus */}</button>
```

---

## Typography

### Font Family

```css
.font-display {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

### Font Sizes

| Token | Value | Line Height | Usage |
|-------|-------|-------------|-------|
| `text-xs` | 12px | leading-tight（1.25） | キャプション、ラベル |
| `text-sm` | 14px | leading-normal（1.5） | 小さなテキスト |
| `text-base` | 16px | leading-normal（1.5） | 本文 |
| `text-lg` | 18px | leading-normal（1.5） | 小見出し |
| `text-xl` | 20px | leading-tight（1.25） | 中見出し |
| `text-2xl` | 24px | leading-tight（1.25） | 大見出し |

```tsx
<h1 className="text-2xl leading-tight">{/* 大見出し */}</h1>
<p className="text-base leading-normal">{/* 本文 */}</p>
<span className="text-sm">{/* 小さなテキスト */}</span>
```

---

## Card Design

### .bento-cardクラス

全カードで`.bento-card`クラスを使用します。

```css
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

### 使用パターン

```tsx
// Framer Motionと組み合わせ
<motion.div
  className="bento-card"
  variants={fadeInUpVariants}
  initial="hidden"
  animate="visible"
  layout="position"
>
  <TimerWidget />
</motion.div>
```

---

## Grid System

### レスポンシブグリッド

12列システム（lg）、6列システム（sm）、1列システム（base）。

| Breakpoint | 列数 | ガター | 用途 |
|------------|------|--------|------|
| base | 1列 | gap-4（16px） | モバイル |
| sm（640px+） | 6列 | gap-4（16px） | タブレット |
| lg（1024px+） | 12列 | gap-4（16px） | デスクトップ |

### カード配置

| カード | sm（6列） | lg（12列） | 行数 |
|--------|-----------|------------|------|
| Timer | col-span-4 | col-span-8 | 2行 |
| CurrentTask | col-span-2 | col-span-2 | 1行 |
| BGM | col-span-2 | col-span-2 | 1行 |
| Stats | col-span-2 | col-span-4 | 1行 |
| Todo | col-span-6 | col-span-12 | 1行 |

### 実装

```tsx
<div className="h-full grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4">
  <motion.div className="bento-card sm:col-span-4 sm:row-span-2 lg:col-span-8 lg:row-span-2">
    <TimerWidget />
  </motion.div>

  <motion.div className="bento-card sm:col-span-2 lg:col-span-2 lg:row-span-1">
    <CurrentTaskCard />
  </motion.div>

  <motion.div className="bento-card sm:col-span-2 lg:col-span-2 lg:row-span-1">
    <BgmPlayer />
  </motion.div>

  <motion.div className="bento-card sm:col-span-2 lg:col-span-4 lg:row-span-1">
    <StatsCard />
  </motion.div>

  <motion.div className="bento-card sm:col-span-6 lg:col-span-12 lg:row-span-1">
    <TodoList />
  </motion.div>
</div>
```

### 検証

各ブレイクポイントで各行がグリッド列数に収まっていることを確認：

- **sm（6列）**: Timer(4) + CurrentTask(2) = 6列、Timer(4) + BGM(2) = 6列、Timer(4) + Stats(2) = 6列、Todo(6) = 6列
- **lg（12列）**: Timer(8) + CurrentTask(2) + BGM(2) = 12列、Timer(8) + Stats(4) = 12列、Todo(12) = 12列

---

## Component Examples

### TimerWidget

```tsx
<motion.div className="bento-card p-6">
  <TimerWidget />
</motion.div>
```

- padding: `p-6`（大きなカード）
- col-span: sm:4, lg:8
- row-span: sm:2, lg:2

### CurrentTaskCard

```tsx
<motion.div className="bento-card p-6">
  <CurrentTaskCard />
</motion.div>
```

- padding: `p-6`（大きなカード）
- col-span: sm:2, lg:2
- row-span: lg:1

### BgmPlayer

```tsx
<motion.div className="bento-card p-4">
  <BgmPlayer />
</motion.div>
```

- padding: `p-4`（小さなカード）
- col-span: sm:2, lg:2
- row-span: lg:1

### StatsCard

```tsx
<motion.div className="bento-card p-6">
  <StatsCard />
</motion.div>
```

- padding: `p-6`（大きなカード）
- col-span: sm:2, lg:4
- row-span: lg:1

### TodoList

```tsx
<motion.div className="bento-card">
  <TodoList />
</motion.div>
```

- padding: ルートにpaddingなし（子要素で制御）
- col-span: sm:6, lg:12
- row-span: lg:1

---

## 関連リソース

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Deep Forest Color Palette](https://github.com/) — プロジェクト独自
- [WCAG AA Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

*Last Updated: 2026-03-22*
*Version: 1.0*
