# Architecture Research

**Domain:** BGMプレイヤーアニメーション刷新（点滅+パルスエフェクト）
**Researched:** 2026-03-26
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        BgmPlayer                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    AlbumArt                          │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │         アニメーションレイヤー構造            │   │    │
│  │  │  1. 背景コンテナ（点滅エフェクト）            │   │    │
│  │  │  2. パルスレイヤー（広がるglow）              │   │    │
│  │  │  3. メインコンテンツ（Musicアイコン）          │   │    │
│  │  │  4. 中心インジケーター（点滅）                 │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
           ↓ (isPlaying state)
┌─────────────────────────────────────────────────────────────┐
│              CSSアニメーション定義（index.css）                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ @keyframes   │  │ @keyframes   │  │  Class制御   │      │
│  │   blink      │  │   pulse      │  │   条件付き   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| AlbumArt | 再生中のビジュアルフィードバック、isPlayingに応じたアニメーション制御 | 条件付きCSSクラス付与、style属性での動的色指定 |
| BgmPlayer | useBgmフック経由で再生状態を管理、AlbumArtにpropsを渡す | State管理のみ、アニメーションロジックは含まない |
| index.css | @keyframes定義、アニメーションクラスのグローバル定義 | Tailwind CSSベース、カスタムアニメーション追加 |

## Recommended Project Structure

```
src/
├── components/
│   └── bgm/
│       ├── BgmPlayer.tsx       # AlbumArt呼び出し、isPlaying state管理
│       └── AlbumArt.tsx        # 新CSSクラス適用、点滅+パルスエフェクト実装
├── lib/
│   └── animation.ts            # 既存アニメーション定義（Framer Motion）
└── index.css                   # 新@keyframes定義（blink, pulse-bg）
```

### Structure Rationale

- **components/bgm/**: BGM関連UIコンポーネントを集約、AlbumArtはBgmPlayerからのみ使用
- **lib/animation.ts**: Framer MotionのVariants定義、今回は使用せずCSSアニメーションで実装
- **index.css**: グローバルな@keyframes定義、Tailwind CSSとの統合

## Architectural Patterns

### Pattern 1: 条件付きCSSクラスによるアニメーション制御

**What:** `isPlaying` stateに基づいてCSSアニメーションクラスを条件付きで付与

**When to use:** 状態に応じたアニメーションの有効/無効を切り替える場合

**Trade-offs:**
- ✓ シンプルで理解しやすい
- ✓ CSS側にアニメーションロジックを集約できる
- ✓ JavaScriptのパフォーマンス影響が最小限
- ✗ 複雑なアニメーション制御には不向き

**Example:**
```typescript
// AlbumArt.tsx
<div className={`base-class ${isPlaying ? 'animate-blink' : ''}`}>
  {/* コンテンツ */}
</div>
```

### Pattern 2: 多層アニメーションレイヤー

**What:** 単一のコンポーネント内に複数のアニメーション効果をレイヤー状に重ねる

**When to use:** 複数の独立したアニメーション効果を組み合わせる場合

**Trade-offs:**
- ✓ 視覚効果の組み合わせが容易
- ✓ 各レイヤーを独立して制御可能
- ✗ DOM深度が増す可能性
- ✗ アニメーション同期の考慮が必要

**Example:**
```typescript
// レイヤー構造
<div className="background-container"> {/* 点滅エフェクト */}
  <div className="pulse-layer"> {/* パルスエフェクト */}
    <div className="content-layer"> {/* メインコンテンツ */}
      <Music className="icon" />
    </div>
  </div>
</div>
```

### Pattern 3: Tailwind CSSのanimate-*

**What:** Tailwind CSS v4の`tw-animate-css`を使用して標準アニメーションを適用

**When to use:** シンプルな点滅・パルスエフェクトなど、標準的なアニメーションの場合

**Trade-offs:**
- ✓ 追加のCSS記述が不要
- ✓ ビルド時の最適化が自動
- ✗ カスタマイズには@keyframes定義が必要
- ✗ 複雑なタイミング制御には制限あり

**Example:**
```typescript
// Tailwind標準アニメーション
<div className="animate-pulse"> {/* Tailwind標準 */}
```

## Data Flow

### State Flow

```
useBgm Hook
    ↓ (isPlaying: boolean)
BgmPlayer Component
    ↓ (prop: isPlaying)
AlbumArt Component
    ↓ (conditional class)
DOM Element (className="animate-blink animate-pulse")
    ↓ (browser renders)
CSS Animation (@keyframes)
```

### Animation Flow

```
isPlaying === true
    ↓
AlbumArt applies classes:
  - "album-art-blink" (opacity: 0.7 ↔ 1.0)
  - "album-art-pulse" (scale: 1.0 ↔ 1.1, glow spread)
    ↓
CSS @keyframes execute:
  - blink: 2s ease-in-out infinite
  - pulse-bg: 2s ease-out infinite
    ↓
Visual Output:
  - 背景が明滅
  - グローが広がる
  - 中心インジケーターが点滅
```

### Key Data Flows

1. **再生状態伝達:** `useBgm()` → `BgmPlayer` → `AlbumArt` （props経由）
2. **アニメーション適用:** `AlbumArt` → DOM `className` → CSS `@keyframes`
3. **動的スタイル:** `currentTrack.color` → inline `style` → `background`, `boxShadow`

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 現在（1アニメーション） | CSS @keyframesで十分、パフォーマンス問題なし |
| 複数アニメーション（5+） | アニメーション設定を別ファイルに抽出、テーマ化 |
| カスタマイズ要件増加 | CSS Variablesを使用してアニメーション速度を動的制御 |

### Scaling Priorities

1. **First bottleneck:** アニメーション速度のハードコーディング → CSS Variablesで解決
2. **Second bottleneck:** 複数の@keyframes定義の散乱 → 専用CSSファイルへの分離

## Anti-Patterns

### Anti-Pattern 1: JavaScript側でのアニメーション制御

**What people do:** `requestAnimationFrame`や`setInterval`で直接DOMを操作

**Why it's wrong:** パフォーマンス劣化、メインスレッドブロック、コード複雑化

**Do this instead:** CSSアニメーションを使用（GPUアクセラレーションが自動適用）

### Anti-Pattern 2: 単一クラスに複数の@keyframesを混在

**What people do:** 1つのクラスで回転・点滅・パルスを全て制御しようとする

**Why it's wrong:** アニメーションの個別制御が不可能、保守性低下

**Do this instead:** 責務を分離（blinkクラス、pulseクラス、pausedクラス）

### Anti-Pattern 3: !importantでのCSS上書き乱用

**What people do:** アニメーション競合を!importantで解決

**Why it's wrong:** 保守不可能、スタイル優先順序の混乱

**Do this instead:** クラスの設計を見直し、セレクタの特異度を適切に管理

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| なし | — | アニメーションは完全にクライアントサイドで完結 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| BgmPlayer ↔ AlbumArt | Props（isPlaying, color） | 一方向データフロー、Eventなし |
| AlbumArt ↔ CSS | className条件付き付与 | 直接的なDOM操作なし |
| index.css ↔ Tailwind | @layer baseでの統合 | 既存の@keyframesパターンに従う |

## Implementation Guide

### 変更範囲

**削除:**
- `album-art-spinning` クラス（回転アニメーション）
- `album-art-paused` クラス（アニメーション一時停止、現在は未使用）

**追加:**
1. **@keyframes定義（index.css）**
   - `blink`: opacity 0.7 ↔ 1.0, scale 0.98 ↔ 1.0
   - `pulse-bg`: box-shadowの広がり + scale微増

2. **CSSクラス（index.css）**
   - `.album-art-blink`: 点滅アニメーション適用
   - `.album-art-pulse`: パルスエフェクト適用

3. **AlbumArtコンポーネント（BgmPlayer.tsx内）**
   - 既存の `album-art-spinning` を `album-art-blink album-art-pulse` に置換
   - 背景コンテナにもアニメーションクラスを追加

### ビルド順序

1. **CSSの定義**（`src/index.css`）
   - @keyframesを追加
   - アニメーションクラスを定義

2. **AlbumArtの修正**（`src/components/bgm/BgmPlayer.tsx`）
   - クラス名を置換
   - アニメーション適用対象を拡張

3. **動作確認**
   - 再生時: 点滅+パルスが有効
   - 停止時: アニメーション無効
   - ゲストモード: localStorageベースでも動作

### 既存スタイルとの統合

```css
/* 既存のアニメーションパターンに従う */
@keyframes rotate { ... } /* 既存 */

/* 新規追加: 回転の隣に配置 */
@keyframes blink {
  0%, 100% { opacity: 0.7; transform: scale(0.98); }
  50% { opacity: 1.0; transform: scale(1.0); }
}

@keyframes pulse-bg {
  0% { box-shadow: 0 8px 24px var(--color); transform: scale(1); }
  50% { box-shadow: 0 12px 40px var(--color); transform: scale(1.05); }
  100% { box-shadow: 0 8px 24px var(--color); transform: scale(1); }
}

/* 既存クラスパターンに従う */
.album-art-spinning { animation: rotate 8s linear infinite; } /* 既存 */

/* 新規追加: spinningの隣に配置 */
.album-art-blink { animation: blink 2s ease-in-out infinite; }
.album-art-pulse { animation: pulse-bg 2s ease-out infinite; }
```

## Sources

- 既存コードベース（src/index.css, src/components/bgm/BgmPlayer.tsx）
- Tailwind CSS v4公式ドキュメント（animate-*ユーティリティ）
- CSS Animation仕様（@keyframes, animationプロパティ）
- Framer Motion使用実績（src/lib/animation.ts）— 今回は未使用だが参考として

---
*Architecture research for: BGMプレイヤーアニメーション刷新*
*Researched: 2026-03-26*
