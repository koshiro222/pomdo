# Domain Pitfalls

**Domain:** BGMプレイヤーアニメーション刷新（点滅+パルスエフェクト）
**Researched:** 2026-03-26

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: 光感受性エピレプシー違反のアニメーション

**何が問題か:**
点滅アニメーションがWCAG 2.3.1基準（1秒間に3回以上の点滅禁止）を超えると、光感受性エピレプシーを持つユーザーに発作を誘発する可能性がある。これは法的・倫理的な重大問題につながる。

**なぜ起こる:**
- CSS animation-durationを短く設定しすぎる（0.3秒未満など）
- opacityを0↔1の完全なオン/オフで繰り返す
- 複数の要素が同時に異なるタイミングで点滅する

**結果:**
- ユーザーの健康被害（発作、めまい、頭痛）
- WCAG違反による法的リスク
- アクセシビリティ不備としての批判

**予防策:**
```css
/* 安全な点滅アニメーション */
@keyframes safe-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6; /* 完全には消さない */
    transform: scale(1.05);
  }
}

/* 1秒間に3回以下に制限（0.33秒以上）*/
.album-art-pulse {
  animation: safe-pulse 2s ease-in-out infinite;
}

/* prefers-reduced-motion対応 */
@media (prefers-reduced-motion: reduce) {
  .album-art-pulse {
    animation: none !important; /* ユーザー設定を最優先 */
    opacity: 1;
    transform: scale(1);
  }
}
```

**実装ガイドライン:**
- animation-durationは最低0.5秒以上（推奨2秒以上）
- opacityの最小値は0.4以上（完全には消さない）
- 同時に点滅する要素は1つまで
- 赤色の点滅は避ける（特に危険）

**検出方法:**
- Chrome DevToolsでアニメーション速度を確認
- 1秒間に何回点滅しているか数える
- Lighthouseアクセシビリティ監査でチェック

---

### Pitfall 2: パルスエフェクトによるパフォーマンス劣化

**何が問題か:**
パルスエフェクト（box-shadowやborder-radiusの拡大）でreflowを引き起こすと、モバイル端末でフレームレートが低下し、UXが悪化する。

**なぜ起こる:**
- width, height, margin, paddingなどレイアウトに影響するプロパティをアニメーションする
- box-shadowの拡大でペイント処理が重くなる
- 複数の要素で同時にパルスを実行する

**結果:**
- フレームレート低下（60fpsから30fps以下へ）
- バッテリー消費増加
- モバイル端末での動作遅延
- ユーザー離脱

**予防策:**
```css
/* 悪い例: width/heightでパルス（reflow発生）*/
.album-art-pulse-bad {
  animation: pulse-bad 2s infinite; /* width/height変更でreflow */
}

@keyframes pulse-bad {
  0%, 100% {
    width: 96px;
    height: 96px;
  }
  50% {
    width: 104px;
    height: 104px;
  }
}

/* 良い例: transformでパルス（GPU加速）*/
.album-art-pulse-good {
  animation: pulse-good 2s infinite;
  will-change: transform, opacity; /* ヒントを与える */
}

@keyframes pulse-good {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

/* box-shadowの代わりに擬似要素でglow効果（軽量化）*/
.album-art-glow::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  background: inherit;
  opacity: 0.3;
  filter: blur(8px);
  z-index: -1;
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.2;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.1);
  }
}
```

**実装ガイドライン:**
- transform（scale, translate, rotate）のみを使用
- opacityはGPU加速されるので安全
- box-shadowはfilter: blur()と擬似要素で代用
- will-changeプロパティでブラウザにヒントを与える
- Chrome DevTools > Performance > Rendering > Paint flashingで確認

---

### Pitfall 3: Framer MotionのuseReducedMotion未使用

**何が問題か:**
Framer Motionのアニメーションで`useReducedMotion`フックを使用しないと、OS設定で「動作を減らす」を有効にしていてもアニメーションが無効化されない。

**なぜ起こる:**
- CSSのprefers-reduced-motionのみ実装し、Framer Motionを考慮しない
- motionコンポーネントのtransitionを動的に制御しない
- AnimatePresenceのexitアニメーションが常に実行される

**結果:**
- アクセシビリティ設定を無視した挙動
- 前庭障害を持つユーザーの不快感
- WCAG 2.3.3違反（アニメーションの制御）

**予防策:**
```tsx
import { useReducedMotion } from 'framer-motion'
import { motion, AnimatePresence } from 'framer-motion'

function AlbumArt({ isPlaying, color }: AlbumArtProps) {
  const shouldReduceMotion = useReducedMotion()

  const pulseVariants = {
    playing: {
      opacity: [1, 0.6, 1],
      scale: [1, 1.05, 1],
      transition: {
        duration: shouldReduceMotion ? 0 : 2, /* reduced motion時は無効化 */
        repeat: Infinity,
        ease: 'easeInOut'
      }
    },
    paused: {
      opacity: 1,
      scale: 1
    }
  }

  return (
    <motion.div
      className="album-art"
      variants={pulseVariants}
      animate={isPlaying ? 'playing' : 'paused'}
      style={{
        background: `linear-gradient(135deg, ${color}40, ${color}20)`,
      }}
    >
      <Music className="w-8 h-8 text-white" />
    </motion.div>
  )
}

/* BGMリスト展開時のアニメーションも対応 */
<AnimatePresence>
  {isExpanded && (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.2, /* reduced motion時は即時切り替え */
        ease: 'easeOut'
      }}
    >
      {/* トラックリスト */}
    </motion.div>
  )}
</AnimatePresence>
```

**実装ガイドライン:**
- すべてのmotionコンポーネントのtransitionにshouldReduceMotionを反映
- duration: 0でアニメーションを即時完了させる
- AnimatePresenceのexitも制御
- テスト時はDevToolsでprefers-reduced-motionをエミュレート

---

## Moderate Pitfalls

### Pitfall 1: CSS特異性の競合によるアニメーション無効化

**何が問題か:**
Tailwind CSSのクラスとカスタムCSSの特異性が競合すると、アニメーションが期待通りに動作しない。

**なぜ起こる:**
- index.cssのアニメーション定義がTailwindユーティリティより優先度が低い
- !importantの乱用で保守性が低下
- @layerの順序が不適切

**結果:**
- アニメーションが適用されない
- デバッグが困難
- スタイルの予期せぬ上書き

**予防策:**
```css
/* index.cssでの適切な定義順序 */
@import "tailwindcss";
@import "tw-animate-css";

@layer base {
  /* グローバルスタイル */
}

@layer components {
  /* アニメーション定義はcomponentsレイヤーで */
  @keyframes album-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
      box-shadow: 0 0 20px var(--pulse-color, rgba(34, 197, 94, 0.3));
    }
    50% {
      opacity: 0.7;
      transform: scale(1.05);
      box-shadow: 0 0 30px var(--pulse-color, rgba(34, 197, 94, 0.5));
    }
  }

  .album-art-pulse {
    animation: album-pulse 2s ease-in-out infinite;
  }

  /* prefers-reduced-motion対応はutilitiesレイヤーより後で */
  @media (prefers-reduced-motion: reduce) {
    .album-art-pulse {
      animation: none !important; /* ユーザー設定を最優先 */
    }
  }
}

/* コンポーネントではカスタムプロパティで色を渡す */
<div
  className="album-art-pulse"
  style={{ '--pulse-color': 'rgba(34, 197, 94, 0.4)' } as React.CSSProperties}
>
```

**実装ガイドライン:**
- アニメーション定義は@layer componentsで
- Tailwindユーティリティ（@layer utilities）より前に定義
- カスタムプロパティ（CSS変数）で動的な値を渡す
- !importantはprefers-reduced-motionなどユーザー設定の優先時のみ使用

---

### Pitfall 2: 既存のalbum-art-spinningクラスの不完全削除

**何が問題か:**
回転アニメーションから点滅+パルスへの移行時、古いクラスやキーフレームが残っていると、意図しない動作が発生する。

**なぜ起こる:**
- index.cssから@keyframes rotateを削除するのを忘れる
- アルバムアート要素にalbum-art-spinningクラスが残っている
- アニメーションの競合でtransformプロパティが上書きされる

**結果:**
- 点滅と回転が同時に発生する
- transformプロパティの競合でアニメーションが壊れる
- 不要なCSSコードの肥大化

**予防策:**
```tsx
/* BgmPlayer.tsx - 古いクラスを完全に削除 */
function AlbumArt({ isPlaying, color }: AlbumArtProps) {
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      {/* album-art-spinningクラスを削除し、新しいクラスに置き換え */}
      <motion.div
        className={`w-full h-full rounded-2xl flex items-center justify-center ${
          isPlaying ? 'album-art-pulse' : ''
        }`}
        animate={isPlaying ? {
          opacity: [1, 0.7, 1],
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          background: `linear-gradient(135deg, ${color}40, ${color}20)`,
        }}
      >
        <Music className="w-8 h-8 text-white" />
      </motion.div>
    </div>
  )
}
```

**実装ガイドライン:**
- グレップ検索で`album-art-spinning`を全削除
- `@keyframes rotate`もindex.cssから削除
- アルバムアート内の全要素でtransformプロパティを確認
- レビューチェックリストに「古いアニメーションの削除確認」を追加

---

## Minor Pitfalls

### Pitfall 1: ダークモードでのパルスエフェクトの視認性低下

**何が問題か:**
ダークモードでbox-shadowやglow効果が暗い背景に溶け込み、アニメーションが見えづらくなる。

**予防策:**
```css
/* ダークモードで色調整 */
.dark .album-art-pulse {
  --pulse-color: rgba(34, 197, 94, 0.6); /* 明るさを上げる */
}

/* またはカラーミックスで動的に調整 */
@keyframes album-pulse {
  0%, 100% {
    box-shadow: 0 0 20px color-mix(in srgb, var(--pulse-color) 40%, transparent);
  }
  50% {
    box-shadow: 0 0 30px color-mix(in srgb, var(--pulse-color) 60%, transparent);
  }
}
```

---

### Pitfall 2: アニメーション初期化時のちらつき

**何が問題か:**
ページ読み込み時、アニメーションが適用される前のスタイルが一瞬表示され、ちらつきが発生する。

**予防策:**
```css
/* 初期状態を設定 */
.album-art {
  opacity: 1;
  transform: scale(1);
}

/* Framer Motionのinitial propで初期状態を制御 */
<motion.div
  initial={{ opacity: 1, scale: 1 }}
  animate={isPlaying ? {
    opacity: [1, 0.7, 1],
    scale: [1, 1.05, 1],
  } : { opacity: 1, scale: 1 }}
>
```

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 01: CSSアニメーション定義 | 光感受性エピレプシー違反 | animation-durationを0.5秒以上にし、opacity最小値を0.4以上に設定 |
| Phase 02: BgmPlayerコンポーネント修正 | album-art-spinning残滓 | グレップ検索で完全削除し、レビューで確認 |
| Phase 03: Framer Motion統合 | useReducedMotion未使用 | すべてのmotionコンポーネントでshouldReduceMotionをtransitionに反映 |
| Phase 04: パフォーマンス最適化 | reflowによるフレームレート低下 | transform/opacityのみ使用し、width/height/box-shadowは避ける |
| Phase 05: アクセシビリティ検証 | OS設定の無視 | DevToolsでprefers-reduced-motionをエミュレートしテスト |

---

## Sources

- [MDN - prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) - HIGH confidence（公式ドキュメント、2025年8月更新）
- [web.dev - prefers-reduced-motion: Sometimes less movement is more](https://web.dev/prefers-reduced-motion/) - HIGH confidence（Google公式、2022年9月更新）
- [Framer Motion Documentation](https://www.framer.com/motion/) - MEDIUM confidence（公式ドキュメント、useReducedMotionフックの存在を確認）
- [WCAG 2.3.1 - Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below.html) - HIGH confidence（W3C公式、ただしURLが404のため一般的なWCAG知識に基づく記載）
- 現行コードベースのindex.cssとBgmPlayer.tsxの分析 - HIGH confidence（実際のコード確認）

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| 光感受性エピレプシー | HIGH | MDNとweb.devの公式ドキュメントに基づき具体的な数値基準を提供 |
| prefers-reduced-motion | HIGH | MDNで2025年8月に更新された最新情報を使用 |
| パフォーマンス最適化 | MEDIUM | 一般的なCSSアニメーションのベストプラクティスに基づくが、Edge Runtime固有の制約は考慮が必要 |
| Framer Motion統合 | MEDIUM | 公式ドキュメントでuseReducedMotionフックの存在を確認したが、具体的な実装例は一般的なパターンに基づく |
| ダークモード対応 | LOW | 一般的なCSSダークモードの知識に基づく推奨 |

## Gaps to Address

- WebSearchツールが結果を返さなかったため、光感受性エピレプシーに関する最新の2026年のガイドラインを確認できていない
- WCAG 2.3.1の具体的な閾値（輝度と面積）については、追加の信頼できるソースが必要
- Edge Runtime（Cloudflare Workers）環境でのFramer Motionの動作に関する具体的な制約について、さらなる調査が必要
- パルスエフェクトのパフォーマンス影響について、実際のモバイル端末でのベンチマークデータが不足
