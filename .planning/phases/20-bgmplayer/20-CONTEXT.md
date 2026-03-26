# Phase 20: BgmPlayerコンポーネント修正 - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

アルバムアートが再生中のみ点滅+パルスし、回転アニメーションを削除する。

CSS定義はPhase 19で完了済み。このフェーズではコンポーネント側の修正のみを行う。
</domain>

<decisions>
## Implementation Decisions

### アニメーション適用対象

- **背景divのみ**に適用
- 理由: 外側の背景div（`rounded-2xl`）のみに適用し、内側のサークルdivとMusicアイコンは静止状態で維持
- 実装: `album-art-blinking`と`album-art-pulsing`クラスを背景divに条件付きで適用

### 停止時の状態

- **完全に静止**
- 理由: REQUIREMENTS.md BGMAN-03で「停止時は静止する」と明記、Phase 13のアクセシビリティ決定に準拠
- 実装: `isPlaying=false`時にアニメーションクラスを適用しない。`album-art-paused`は使用しない

### クラス適用ロジック

```tsx
// 背景divの実装パターン
<div
  className={`w-full h-full rounded-2xl flex items-center justify-center ${
    isPlaying ? 'album-art-blinking album-art-pulsing' : ''
  }`}
  style={{
    background: `linear-gradient(135deg, ${color}40, ${color}20)`,
    color: color, // pulse-glowのcurrentColor用
    boxShadow: `0 8px 24px ${color}40`,
  }}
>
```

### 削除対象

- **album-art-spinningクラスの完全削除**
- 現在: 背景divと内側サークルdivの両方に適用中（2箇所）
- 削除後: コードベースから完全に削除

### 内側サークルdivの扱い

- **animation削除後も維持**
- アニメーションなしの静止状態で表示
- 現在の`animationDuration: '12s'`プロパティを削除

### Claude's Discretion

- Musicアイコンの`album-art-paused`クラスの扱い（現在は停止時のみ適用）
- 再生インジケーター（中央の白点）の挙動（現在はscaleで制御）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — v1.6.1要件（BGMAN-03, BGMAN-04）
  - BGMAN-03: 再生中のみアニメーションが動作し、停止時は静止する
  - BGMAN-04: 回転アニメーション（album-art-spinning）を削除する

### Phase Definition
- `.planning/ROADMAP.md` — Phase 20の成功基準（3項目）
  - アルバムアートはBGM再生中に点滅+パルスアニメーションを表示する
  - BGM停止時、アルバムアートは静止した状態で表示される
  - 回転アニメーション（album-art-spinningクラス）がコードベースから完全に削除されている

### Project Context
- `.planning/STATE.md` — 決定事項（CSS keyframes使用、光感受性エピレプシー対策）

### Target Files
- `src/index.css` — Phase 19で定義されたアニメーションクラス（参照のみ）
- `src/components/bgm/BgmPlayer.tsx` — AlbumArtコンポーネント修正対象

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — コンポーネント命名規則

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **CSSアニメーションクラス**（Phase 19で定義済み）:
  - `.album-art-blinking` — `animation: blink 2s ease-in-out infinite`
  - `.album-art-pulsing` — `animation: pulse-glow 2s ease-in-out infinite`
  - `.album-art-paused` — `animation-play-state: paused`（今回は不使用）

### Established Patterns

- **条件付きクラス適用**: `${isPlaying ? 'class-name' : ''}`パターン（既存コードで使用）
- **GPUアクセラレーション**: transformとopacityのみ使用 → 60fps維持（Phase 13のパターン）
- **Framer Motion**: 既存の`motion.button`とアニメーションユーティリティ（tapAnimation, hoverAnimation）

### Integration Points

- **AlbumArtコンポーネント**（`src/components/bgm/BgmPlayer.tsx`内の7-44行目）:
  - 現在の構造: 背景div + 内側サークルdiv + Musicアイコン + 再生インジケーター
  - `isPlaying`と`color`プロパティを既に受け取っている
  - 2箇所で`album-art-spinning`クラス使用中（17行目、25行目）

### Current Issues

- `album-art-spinning`クラスが2箇所で使用中（背景divと内側サークルdiv）
- 内側サークルdivに`animationDuration: '12s'`プロパティが設定中
- `album-art-paused`クラスがMusicアイコンで使用中（31行目）

</code_context>

<specifics>
## Specific Ideas

- 背景divのみにアニメーションを適用することで、視覚的な「鼓動」を表現しつつ、内側のアイコンは識別可能に維持
- 再生/停止の切り替えが即座に反映されるよう、条件分岐を簡潔に実装

</specifics>

<deferred>
## Deferred Ideas

なし — ディスカッションはフェーズ範囲内で完結

</deferred>

---

*Phase: 20-bgmplayer*
*Context gathered: 2026-03-26*
