# Feature Landscape

**Domain:** BGMプレイヤーアニメーション刷新（点滅+パルスエフェクト）
**Researched:** 2026-03-26

## Table Stakes

ユーザーがBGM再生中の視覚的フィードバックとして期待する機能。

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 点滅アニメーション（Blink） | 再生中かどうかを瞬時に認識するため | Low | opacity 0.6 ↔ 1.0、ease-in-out、2s周期が標準 |
| パルスエフェクト（Pulse） | 音楽の「鼓動」を視覚的に表現 | Medium | box-shadowの広がり + scale微増、ease-in-out必須 |
| prefers-reduced-motion対応 | アクセシビリティ要件（WCAG 2.3.3） | Low | 動きを無効化、静的なopacity変更のみに |
| 再生状態による変化 | isPlayingで制御 | Low | paused時はアニメーション停止、状態維持 |

## Differentiators

既存の回転円盤からの変更点。必須ではないが、価値のある機能。

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| ユニークな点滅パターン | 他の音楽プレイヤーとの差別化 | Medium | 複数のkeyframeを組み合わせたリズミカルな表現 |
| カラーに応じたパルス色 | BGMトラックの色に合わせたglow効果 | Low | `currentTrack.color` をbox-shadowに適用 |
| 段階的変化（3段階keyframe） | 単調な2点間変化よりリッチな表現 | Medium | 0% → 50% → 100% でopacityとscaleを制御 |

## Anti-Features

明示的に実装しない機能。

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| 回転アニメーション（rotate） | 削除対象。dizzy感を与える可能性 | 点滅+パルスで「鼓動」を表現 |
| 高速点滅（< 1s周期） | 光過敏性エピレプシーのリスク | 最低2s周期、推奨2-3s |
| 複雑な変換（skew/perspective） | パフォーマンス低下、アクセシビリティ低下 | scale + opacity + box-shadowのみ使用 |
| JavaScript制御のアニメーション | CSS keyframesの方がパフォーマンス良好 | 純粋なCSS keyframes + classのtoggle |

## Feature Dependencies

```
AlbumArtコンポーネント改良 → 点滅アニメーション実装 → パルスエフェクト追加 → prefers-reduced-motion対応
```

## MVP Recommendation

優先順位:

1. **点滅アニメーション（Blink）** — Table stakes、再生状態の視覚的フィードバックに必須
2. **パルスエフェクト（Pulse）** — Table stakes、音楽の「鼓動」表現に必須
3. **prefers-reduced-motion対応** — Table stakes、アクセシビリティ要件

延期: ユニークな点滅パターン（MVP後の改善候補）

理由: 点滅とパルスの基本実装で要件を満たし、リズミカルな変化は後で追加可能

## アニメーションパターン詳細

### 1. 点滅アニメーション（Blink）

```css
@keyframes blink {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.02);
  }
}

.album-art-blinking {
  animation: blink 2s ease-in-out infinite;
}
```

**パラメータ:**
- duration: 2s（推奨）- 1s未満は避ける（光過敏性考慮）
- timing-function: ease-in-out（自然な呼吸感）
- iteration-count: infinite（再生中は継続）

**Complexity:** Low — 標準的なCSSアニメーション

### 2. パルスエフェクト（Pulse）

```css
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.2),
                0 0 10px var(--pulse-color, rgba(255, 255, 255, 0.1));
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6),
                0 0 40px var(--pulse-color, rgba(255, 255, 255, 0.4));
  }
}

.album-art-pulsing {
  animation: pulse 2s ease-in-out infinite;
}
```

**パラメータ:**
- duration: 2s（点滅と同期）
- timing-function: ease-in-out
- 複数のbox-shadowレイヤーでソフトなglow表現
- カラー変数対応（`--pulse-color`）

**Complexity:** Medium — box-shadowの多層構造とカラー変数

### 3. prefers-reduced-motion対応

```css
@media (prefers-reduced-motion: reduce) {
  .album-art-blinking,
  .album-art-pulsing {
    animation: none;
  }

  /* 静的な状態変更のみ */
  .album-art-blinking {
    opacity: 0.8;
  }
}
```

**Complexity:** Low — メディアクエリの追加のみ

## 実装上の注意点

### アニメーションの組み合わせ

- 点滅とパルスは**同じduration**で同期させる（2s推奨）
- 異なるkeyframe名で定義し、同じ要素に両方のclassを適用
- `animation-play-state: paused` で一時停止対応

### パフォーマンス考慮

- アニメートするプロパティ: **opacity**, **transform**, **box-shadow**のみ
- 回避: width/height/margin/padding（reflowトリガー）
- GPUアクセラレーション: transformとopacityは自動的に最適化

### カスタマイズ性

- CSS変数でdurationを制御可能に: `--blink-duration: 2s`
- カラーは`currentTrack.color`からインラインスタイルで注入
- 将来のテーマ切り替え対応のため、CSS変数経由で色を定義

## 既存UIとの整合性

### 保持する要素

- アルバムアートの基本レイアウト（96x96px）
- 再生インジケーター（中心の白い点）
- トラックリストの音波バウンス（`animate-[bounce_1s_infinite]`）

### 削除する要素

- `.album-art-spinning` クラス（回転アニメーション）
- `animation: rotate 8s linear infinite` 定義
- 内側の円盤要素（現在の2層構造を1層に簡素化）

### 新規追加

- `.album-art-blinking` クラス
- `.album-art-pulsing` クラス
- `@keyframes blink` 定義
- `@keyframes pulse` 定義

## アニメーション比較表

| パターン | Duration | Timing-function | 用途 | Complexity |
|---------|----------|-----------------|------|------------|
| **Blink（点滅）** | 2s | ease-in-out | 再生状態の視覚的フィードバック | Low |
| **Pulse（パルス）** | 2s | ease-in-out | 音楽の「鼓動」表現 | Medium |
| **Slow blink** | 3s | ease-in-out | 落ち着いた雰囲気 | Low |
| **Rhythmic（3段階）** | 2.4s | ease-in-out | リズミカルな変化 | Medium |

## Sources

- [MDN: @keyframes](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes) — HIGH confidence（公式ドキュメント）
- [W3C WAI: C39 - Using the CSS reduce-motion query](https://www.w3.org/WAI/WCAG21/Techniques/css/C39.html) — HIGH confidence（W3C公式テクニック）
- 現行コードベース分析（`src/index.css`, `src/components/bgm/BgmPlayer.tsx`） — HIGH confidence（実装済みコード）
