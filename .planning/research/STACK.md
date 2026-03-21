# Technology Stack

**Project:** Pomdo v1.2 UI/UX改善
**Researched:** 2026-03-21

## Recommended Stack

### Core Framework（既存）
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | ^19.2.0 | UIフレームワーク | 既存採用、最新版で安定 |
| TypeScript | ~5.9.3 | 型安全 | 既存採用 |
| Vite | ^7.3.1 | バンドラ | 既存採用、高速開発 |
| Tailwind CSS | ^4.2.1 | スタイリング | **既存採用、v4の新機能を活用** |

### グラフライブラリ（Stats機能用）
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Recharts** | ^2.15.0 | 統計グラフ表示 | **Reactネイティブ、宣言的API、Tree-shaking対応** |
| Chart.js | - | （代替案） | CanvasベースだがReact統合が不自然 |
| Victory | - | （代替案） | ReactネイティブだがBundleサイズが大きい |

### レスポンシブ対応（Tailwind CSS v4）
| 機能 | バージョン | Purpose | Why |
|------|----------|---------|-----|
| **Tailwind CSS v4** | ^4.2.1 | レスポンシブユーティリティ | **既存導入済み、Container Queries対応** |
| @tailwindcss/vite | ^4.2.1 | Viteプラグイン | **既存導入済み、自動コンテンツ検出** |
| tw-animate-css | ^1.4.0 | アニメーション | **既存導入済み、Statsアニメーションに使用** |

### Supporting Libraries（既存）
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | ^12.35.1 | アニメーション | **Statsのバーチャートアニメーションで既に使用** |
| lucide-react | ^0.575.0 | アイコン | 既存採用 |
| clsx + tailwind-merge | ^2.1.1, ^3.5.0 | クラス結合 | 既存採用 |

## Installation

### Stats用グラフライブラリ
```bash
npm install recharts
```

**依存関係（自動インストール）:**
- `react`: ^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0（✓ 既存）
- `react-dom`: ^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0（✓ 既存）

**Bundleサイズ:**
- 圧縮時: ~40KB（Tree-shakingで最小化可能）
- Victory: ~200KB（却下理由）
- Chart.js: ~60KB（却下理由: React統備が不自然）

### レスポンシブ対応
**追加インストール不要** — Tailwind CSS v4に以下が含まれています:
- モバイルファーストブレークポイント（`sm:`, `md:`, `lg:`, `xl:`, `2xl:`）
- Container Queries（`@container`, `@sm`, `@md`, ...）
- Max-width variants（`max-sm:`, `max-md:`, ...）

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| グラフライブラリ | Recharts | Chart.js | HTML5 CanvasベースでReact統備が不自然、宣言的APIではない |
| グラフライブラリ | Recharts | Victory | Bundleサイズが大きい（~200KB）、メンテナンスが停滞 |
| レスポンシブ | Tailwind CSS v4 | CSS Modules | ユーティリティファーストの方が迅速な反復が可能 |
| レスポンシブ | Tailwind CSS v4 | CSS-in-JS | ランタイムオーバーヘッド、Edge Runtimeで不安定 |

## Integration Details

### Rechartsで実装するStatsグラフ

**既存のカスタム実装を置き換え:**
```tsx
// src/components/stats/StatsCard.tsx（既存）
// → framer-motionで手作りしたバーチャート

// 新しい実装例:
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height="100%">
  <BarChart data={weeklyData}>
    <XAxis dataKey="date" tickFormatter={getDayLabel} />
    <YAxis hide />
    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} />
    <Bar
      dataKey="focusMinutes"
      fill="var(--df-accent-primary)"
      radius={[4, 4, 0, 0]}
    />
  </BarChart>
</ResponsiveContainer>
```

**Edge Runtime互換性:**
- ✅ Rechartsはクライアントサイドのみで動作
- ✅ Server ComponentsではないのでEdge Runtimeの制約を受けない
- ✅ CanvasではなくSVGベース（軽量）

### Tailwind CSS v4でのレスポンシブ対応

**既存の課題:**
- 要素が重なり、ボタンがクリックできない
- 各グリッドに統一感がない
- タイマー部分の余白が大きすぎる

**解決アプローチ:**
```css
/* src/index.css（既存の@themeディレクティブを拡張） */
@import "tailwindcss";

@theme {
  /* カスタムブレークポイントの追加（必要な場合） */
  --breakpoint-mobile: 20rem;  /* 320px */
  --breakpoint-tablet: 48rem;  /* 768px */
}
```

```tsx
/* グリッドデザイン統一の例 */
<div className="
  grid
  grid-cols-1
  mobile:grid-cols-2
  md:grid-cols-3
  lg:grid-cols-4
  gap-4
  p-4
">
  {/* Bento Gridカード */}
</div>

/* Container Queriesでカード内のレスポンシブ */
<div className="@container">
  <div className="flex flex-col @md:flex-row">
    {/* 小さいコンテナでは縦並び、大きいコンテナでは横並び */}
  </div>
</div>
```

**タイマー余白の調整:**
```tsx
/* 左右の無駄な余白を削減 */
<div className="
  w-full
  max-w-7xl
  mx-auto
  px-4 sm:px-6 lg:px-8  /* レスポンシブなパディング */
">
  {/* Timerコンテンツ */}
</div>
```

## Pitfalls to Avoid

### Recharts
1. **Server Componentsで使用しない** — `'use client'`が必要
2. **データ変換を忘れない** — Recharts expects `{ name: string, value: number }[]`
3. **ツールチップのスタイル** — デフォルトが白背景なのでDark Modeで調整が必要

### Tailwind CSS v4
1. **v3とのAPI変更** — `tailwind.config.js`ではなく`@theme`ディレクティブを使用
2. **ブレークポイントの意味** — `sm:`は「640px以上」で「小さい画面のみ」ではない
3. **Container Queriesの乱用** — 深いネストでパフォーマンス低下

## Edge Runtime Compatibility

| Library | Compatible | Notes |
|---------|-----------|-------|
| Recharts | ✅ YES | クライアントサイドのみ、SVGベースで軽量 |
| Tailwind CSS v4 | ✅ YES | ビルドタイムでCSS生成、ランタイム依存なし |
| framer-motion | ✅ YES | 既に使用中、問題なし |

## Sources

- [Recharts Official Documentation](https://recharts.org) — HIGH confidence
- [Recharts npm package](https://www.npmjs.com/package/recharts) — HIGH confidence
- [Chart.js Official Documentation](https://www.chartjs.org) — HIGH confidence
- [Victory Official Documentation](https://formidable.com/open-source/victory) — HIGH confidence
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/responsive-design) — HIGH confidence
- [Tailwind CSS v4 Alpha Announcement](https://tailwindcss.com/blog/tailwindcss-v4-alpha) — HIGH confidence
