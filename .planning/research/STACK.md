# Technology Stack

**Project:** Pomdo v1.6.1 BGMプレイヤーアニメーション刷新
**Researched:** 2026-03-26
**Overall Confidence:** HIGH

## 要約

点滅+パルスエフェクトの実装に**新規ライブラリは不要**。既存のTailwind CSS v4とCSS keyframesのみで完結可能。Framer Motionは他コンポーネントで利用中だが、今回のアニメーションにはCSS keyframesを選択（パフォーマンス・シンプルさのため）。

## 推奨スタック

### アニメーション実装方式

| 技術 | バージョン | 用途 | 採用理由 |
|------|----------|------|----------|
| **CSS keyframes** | 標準 | 点滅アニメーション（opacity/scale） | パフォーマンス良好、GPUアクセラレーション効く、シンプル |
| **CSS keyframes** | 標準 | パルスエフェクト（box-shadow拡散） | glow効果はCSSで実装済みパターン、Framer Motionより軽量 |
| **Tailwind CSS v4** | 4.2.1 | ユーティリティクラス適用 | 既存プロジェクトで導入済み、`animate-[<value>]`構文でカスタムアニメーション適用可能 |

### 削除対象

| 技術 | 理由 |
|------|------|
| `album-art-spinning` クラス | 回転アニメーション削除 |
| `rotate` @keyframes | 使用箇所がBGMプレイヤーのみのため削除可能 |

## 比較検討

### アニメーション方式: CSS keyframes vs Framer Motion

| 基準 | CSS keyframes | Framer Motion | 結論 |
|------|--------------|---------------|------|
| パフォーマンス | GPUアクセラレーション効く | JavaScript制御、JSスレッド依存 | **CSS採用** |
| コード量 | keyframes定義 + クラス付与のみ | variants定義 + motionコンポーネント | **CSS採用** |
| 柔軟性 | 固定キーフレーム | 動的制御可能 | **Framer Motion** |
| メンテナンス | CSSファイルで一元管理 | TypeScriptで型安全 | **Framer Motion** |
| ファイルサイズ | 追加なし | 既存のframer-motion利用 | **CSS採用** |

**結論**: 点滅/パルスのような単純なループアニメーションにはCSS keyframesが最適。Framer Motionは複雑なインタラクション（ドラッグ&ドロップ、条件付きアニメーション）に留める。

### Tailwind `animate-pulse` vs カスタムkeyframes

| 基準 | `animate-pulse` | カスタムkeyframes | 結論 |
|------|-----------------|------------------|------|
| 機能 | opacity: 1 → 0.5 → 1 | opacity/scale/box-shadow制御可能 | **カスタム採用** |
| 柔軟性 | 固定 | 完全カスタム | **カスタム採用** |
| 実装コスト | クラス付与のみ | keyframes定義必要 | **`animate-pulse`** |

**結論**: opacityのみなら`animate-pulse`で十分。scaleとbox-shadowを含むパルスエフェクトにはカスタムkeyframes定義が必要。

## 追加定義が必要なCSS keyframes

### 点滅アニメーション（blink）

```css
@keyframes blink {
  0%, 100% { opacity: 1; scale: 1; }
  50% { opacity: 0.6; scale: 0.95; }
}
```

### パルスエフェクト（pulse-glow）

```css
@keyframes pulse-glow {
  0% {
    box-shadow: 0 0 0 0 var(--color);
    opacity: 1;
  }
  50% {
    box-shadow: 0 0 20px 10px var(--color-alpha);
    opacity: 0.8;
  }
  100% {
    box-shadow: 0 0 0 0 var(--color);
    opacity: 1;
  }
}
```

**注意**: `--color` と `--color-alpha` はインラインスタイルで動的に設定。

## 推奨アニメーションパターン

### パターン1: シンプル点滅（opacityのみ）

```tsx
<div className="animate-pulse" />
```

**用途**: 最小限の実装で即座に点滅効果。

### パターン2: カスタム点滅+スケール

```tsx
<div style={{ animation: 'blink 2s ease-in-out infinite' }} />
```

**用途**: よりリッチな表現が必要な場合。

### パターン3: パルスエフェクト（glow拡散）

```tsx
<div
  style={{
    '--color': color,
    '--color-alpha': `${color}40`,
    animation: 'pulse-glow 3s ease-in-out infinite',
  } as React.CSSProperties}
/>
```

**用途**: BGM再生中の視覚的フィードバック。

## インストール

**不要**。既存パッケージのみで完結。

- `tailwindcss@^4.2.1` - 既存
- `framer-motion@^12.35.1` - 既存（他コンポーネントで使用）

## 避けるべきアンチパターン

### アンチパターン1: Framer Motion for simple looping

```tsx
❌ <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity }} />
```

**理由**: JavaScriptスレッドで制御、オーバーヘッド大。CSS keyframesで十分。

### アンチパターン2: inline styleでkeyframes定義

```tsx
❌ <div style={{ animation: 'blink 2s infinite' }} keyframes={...} />
```

**理由**: Reactではinline styleでkeyframes定義不可。必ずCSSファイルで定義。

### アンチパターン3: 既存のFramer Motion variantsを無理に活用

```tsx
❌ const blinkVariants = { ... }
<motion.div variants={blinkVariants} animate="blink" />
```

**理由**: 単純なループアニメーションにvariantsは過剰。CSSクラスで十分。

## 移行計画

### ステップ1: 既存回転アニメーション削除

1. `index.css` から `rotate` keyframes削除
2. `album-art-spinning` クラス削除
3. `BgmPlayer.tsx` でクラス参照削除

### ステップ2: 新規アニメーション定義追加

1. `index.css` に `blink` と `pulse-glow` keyframes定義追加
2. `BgmPlayer.tsx` でAlbumArtコンポーネント修正

### ステップ3: スタイル適用

1. 条件付きクラス付与: `isPlaying ? 'animate-[blink_2s_ease-in-out_infinite]' : ''`
2. インラインスタイルで色変数設定

## Sources

- **HIGH confidence**: [Framer Motion Animation公式ドキュメント](https://www.framer.com/motion/animation/) - keyframes、repeat、transitionオプション確認
- **HIGH confidence**: [Framer Motion Transition公式ドキュメント](https://www.framer.com/motion/transition/) - repeat、repeatType、repeatDelayパラメータ確認
- **HIGH confidence**: [Tailwind CSS v4 Animation公式ドキュメント](https://tailwindcss.com/docs/animation) - animate-pulse、animate-[<value>]構文確認
- **HIGH confidence**: 既存コードベース分析 - `src/index.css`, `src/components/bgm/BgmPlayer.tsx`, `src/lib/animation.ts`
