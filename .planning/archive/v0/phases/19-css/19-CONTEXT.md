# Phase 19: CSSアニメーション定義 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

点滅（blink）とパルス（pulse-glow）エフェクトのCSSアニメーションを定義。

回転アニメーションの削除やコンポーネントへの適用はPhase 20の範囲。
</domain>

<decisions>
## Implementation Decisions

### アニメーション調整

#### タイミング方式
- **同期**: blinkとpulse-glowは同じタイミングで開始し、2sで一周する
- 理由: 「鼓動」として統一感を出すため

#### イージング関数
- **ease-in-out**を採用
- 理由: 始点と終点で滑らかに変化し、自然な脈動感を表現

#### Keyframe構造
- **3点構造**（0%, 50%, 100%）でblinkを定義
- 0%: opacity 0.6, scale 1
- 50%: opacity 1.0, scale 1.02
- 100%: opacity 0.6, scale 1

### Box-shadow構造

#### 層数
- **3層構造**とする
- 理由: 外側へ広がるglow効果を表現するのに適している

#### 色指定
- **動的（トラック色）**を使用
- アルバムアートのcolorプロパティを再利用
- コンポーネント側で渡す色でglowを表現

#### 広がり（spread-radius）
- **小〜中**: 内層0px → 中層8px → 外層16px
- blur-radiusは固定値（8px, 16px, 24px等）

### CSS構造

#### 配置場所
- **index.cssの下部**に配置
- 既存の@keyframes定義（rotate等）の近くに配置

#### 既存定義の処理
- **削除して整理**: rotate @keyframesとalbum-art-spinningクラスを削除
- album-art-pausedクラスは新アニメーションでも使用するため維持

#### クラス命名
- **album-art-***形式を採用
  - `album-art-blinking`
  - `album-art-pulsing`
- 既存命名規則（album-art-spinning）に準拠

### Claude's Discretion

- pulse-glow @keyframesの具体的なkeyframeパーセンテージ（0%, 50%, 100%でのshadow値）
- animation-iteration-countはinfiniteとするか、必要に応じて調整
- 既存のalbum-art-pausedクラスとの互換性確認

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — v1.6.1要件（BGMAN-01, BGMAN-02）
  - BGMAN-01: アルバムアートが点滅する（opacity 0.6 ↔ 1.0, scale 1 ↔ 1.02, 2s周期）
  - BGMAN-02: アルバムアートからパルスが広がる（box-shadow多層構造によるglowエフェクト）

### Phase Definition
- `.planning/ROADMAP.md` — Phase 19の成功基準（2項目）
  - index.cssにblink @keyframes定義
  - index.cssにpulse-glow @keyframes定義

### Project Context
- `.planning/STATE.md` — 決定事項（CSS keyframes使用、光感受性エピレプシー対策）

### Target Files
- `src/index.css` — @keyframes定義の追加と既存定義の削除対象
- `src/components/bgm/BgmPlayer.tsx` — AlbumArtコンポーネント（Phase 20での適用先）

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — CSS命名規則

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **Tailwind CSS** — スタイルユーティリティ
- **index.cssの既存@keyframes**:
  - `rotate`（削除対象）
  - `slideIn`, `checkmark`, `slideUp`, `bounce`（参考パターン）

### Established Patterns

- **アニメーション定義**: `@keyframes`はindex.cssの下部にグループ化
- **クラス命名**: `album-art-*`形式でBGM関連アニメーションを命名
- **GPUアクセラレーション**: transformとopacityのみ使用 → 60fps維持（Phase 13のパターン）

### Integration Points

- **AlbumArtコンポーネント**（`src/components/bgm/BgmPlayer.tsx`）:
  - 現在は`album-art-spinning`クラスを使用（Phase 20で置換）
  - 2つのdiv構造（背景div + 内部サークルdiv）
  - colorプロパティは動的に渡される

### Current Issues

- 回転アニメーション（rotate）を削除し、blink + pulse-glowに置換する必要
- album-art-spinningクラスはコードベースから削除対象

</code_context>

<specifics>
## Specific Ideas

- 「鼓動」を表現するため、点滅とパルスを同期させる
- 光感受性エピレプシー対策: 2s周期、opacity最小値0.6（要件の0.4以上を満たす）
- トラックの色をglowに反映することで、各BGMに個性を持たせる

</specifics>

<deferred>
## Deferred Ideas

なし — ディスカッションはフェーズ範囲内で完結

</deferred>

---

*Phase: 19-css*
*Context gathered: 2026-03-26*
