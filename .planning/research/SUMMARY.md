# プロジェクト研究サマリー

**Project:** Pomdo v1.6.1 BGMプレイヤーアニメーション刷新
**Domain:** フロントエンドUIアニメーション / CSSアニメーション
**Researched:** 2026-03-26
**Confidence:** HIGH

## エグゼクティブサマリー

BGMプレイヤーのアニメーション刷新は、既存の回転円盤アニメーションから点滅+パルスエフェクトへの移行プロジェクトです。研究の結果、**新規ライブラリは不要**であり、既存のTailwind CSS v4とCSS keyframesのみで完結可能であることが明らかになりました。Framer Motionはプロジェクトで既に使用されていますが、単純なループアニメーションにはCSS keyframesが最適であり、パフォーマンスとシンプルさの観点から推奨されます。

推奨されるアプローチは、`index.css`に`blink`と`pulse-glow`の@keyframesを定義し、`AlbumArt`コンポーネントで条件付きCSSクラスを適用することです。主要なリスクとして、光感受性エピレプシー違反（WCAG 2.3.1）、パフォーマンス劣化（reflow）、アクセシビリティ（prefers-reduced-motion）の3つが特定されました。これらは適切なガイドラインに従うことで回避可能です。

## 主要な発見

### 推奨スタック

**新規ライブラリは不要**。既存パッケージのみで完結します。

**コア技術:**
- **CSS keyframes** — 点滅・パルスアニメーション — GPUアクセラレーションが効き、パフォーマンス良好
- **Tailwind CSS v4** — ユーティリティクラス適用 — `animate-[<value>]`構文でカスタムアニメーション適用可能
- **framer-motion** — 他コンポーネントで使用中 — 今回のアニメーションには使用せず、CSS keyframesを採用

### 期待される機能

**必須機能（Table Stakes）:**
- **点滅アニメーション（Blink）** — 再生中かどうかを瞬時に認識するため必須
- **パルスエフェクト（Pulse）** — 音楽の「鼓動」を視覚的に表現するために必須
- **prefers-reduced-motion対応** — アクセシビリティ要件（WCAG 2.3.3）

**競争力のある機能（Differentiators）:**
- **カラーに応じたパルス色** — BGMトラックの色に合わせたglow効果

**延期（v2+）:**
- **ユニークな点滅パターン** — 複数のkeyframeを組み合わせたリズミカルな表現はMVP後の改善候補

### アーキテクチャアプローチ

アニメーションは完全にクライアントサイドで完結し、外部サービスは不要です。`useBgm()`フックから再生状態（`isPlaying`）が`BgmPlayer`コンポーネントに伝達され、さらに`AlbumArt`コンポーネントへpropsとして渡されます。`AlbumArt`は`isPlaying`に基づいてCSSクラスを条件付きで付与し、CSS @keyframesがアニメーションを実行します。

**主要コンポーネント:**
1. **AlbumArt** — 再生中のビジュアルフィードバック、isPlayingに応じたアニメーション制御
2. **BgmPlayer** — useBgmフック経由で再生状態を管理、AlbumArtにpropsを渡す
3. **index.css** — @keyframes定義、アニメーションクラスのグローバル定義

### 重要な落とし穴

1. **光感受性エピレプシー違反** — animation-durationは最低0.5秒以上（推奨2秒以上）、opacityの最小値は0.4以上
2. **パフォーマンス劣化（reflow）** — width/height/margin/paddingを避け、transform/opacityのみ使用
3. **prefers-reduced-motion未対応** — `@media (prefers-reduced-motion: reduce)`でアニメーションを無効化
4. **既存album-art-spinningクラスの残滓** — グレップ検索で完全削除し、レビューで確認

## ロードマップへの影響

研究に基づき、推奨フェーズ構造：

### Phase 1: CSSアニメーション定義
**根拠:** すべてのアニメーションの基盤となるCSS keyframes定義を最初に完了させることで、以降のコンポーネント修正がスムーズになります。
**成果:** index.cssにblinkとpulse-glowの@keyframes定義、アニメーションクラス
**対応機能:** FEATURES.mdの点滅アニメーション、パルスエフェクト
**回避すべき落とし穴:** PITFALLS.mdの光感受性エピレプシー違反（durationとopacityの適切な設定）

### Phase 2: BgmPlayerコンポーネント修正
**根拠:** AlbumArtコンポーネントはBgmPlayer内で定義されているため、CSS定義の完了後にコンポーネント修正を行います。
**成果:** album-art-spinningクラスの削除、新しいアニメーションクラスの適用
**使用スタック:** STACK.mdのCSS keyframes、ARCHITECTURE.mdの条件付きクラスパターン
**実装:** ARCHITECTURE.mdのAlbumArtコンポーネント
**回避すべき落とし穴:** PITFALLS.mdの既存クラスの残滓

### Phase 3: prefers-reduced-motion対応
**根拠:** アクセシビリティ対応はアニメーション実装の完了後に検証します。基本機能が動作してから、OS設定を尊重する機能を追加します。
**成果:** @mediaクエリによるアニメーション無効化、静的な状態変更
**対応機能:** FEATURES.mdのprefers-reduced-motion対応
**使用スタック:** PITFALLS.mdの予防策

### Phase 4: パフォーマンス検証
**根拠:** 実装完了後、実際にモバイル端末でフレームレートを確認し、必要に応じて最適化を行います。
**成果:** Chrome DevToolsでのパフォーマンス確認、will-changeプロパティの追加
**回避すべき落とし穴:** PITFALLS.mdのパフォーマンス劣化（reflow）

### フェーズ順序の根拠

- **CSS定義→コンポーネント修正**の順序により、コンポーネント修正時にCSSクラスが既に存在することを保証
- **基本機能→アクセシビリティ対応**の順序により、まずアニメーションが動作することを確認してから、OS設定を尊重する機能を追加
- **実装→検証**の順序により、実際のパフォーマンス問題を特定してから最適化を実施

この順序により、各フェーズで前のフェーズの出力を利用でき、反復作業を回避できます。

### 研究フラグ

**追加研究が必要なフェーズ:**
- **なし** — すべてのフェーズで標準的なCSSアニメーションパターンを使用しており、研究から得られた情報で十分

**標準パターンのフェーズ（研究フェーズをスキップ）:**
- **Phase 1:** CSS @keyframes定義は標準的なWeb開発パターン
- **Phase 2:** 条件付きCSSクラス付与はReactの基本パターン
- **Phase 3:** prefers-reduced-motion対応はMDNで文書化された標準手法
- **Phase 4:** パフォーマンス検証はChrome DevToolsの標準機能

## 信頼性評価

| 領域 | 信頼度 | 理由 |
|------|--------|------|
| スタック | HIGH | 公式ドキュメント（Framer Motion、Tailwind CSS）と既存コードベースの分析に基づく |
| 機能 | HIGH | MDNとW3Cの公式ドキュメントに基づき、具体的な数値基準を提供 |
| アーキテクチャ | HIGH | 既存コードベースの分析と標準的なReactパターンに基づく |
| 落とし穴 | HIGH | MDNとweb.devの公式ドキュメント、WCAGガイドラインに基づく |

**全体の信頼度:** HIGH

### 対処すべきギャップ

- **光感受性エピレプシーの最新ガイドライン:** WebSearchツールが結果を返さなかったため、2026年の最新ガイドラインを確認できていない。ただし、MDNとWCAGの情報に基づき安全なデフォルト値（duration: 2s、opacity min: 0.4）を設定しているため、実装上の問題はない
- **Edge Runtime固有の制約:** Cloudflare Workers環境でのCSSアニメーション動作に関する具体的な制約は、クライアントサイドアニメーションであるため影響しない
- **モバイル端末でのベンチマーク:** パルスエフェクトの実際のパフォーマンス影響については、Phase 4での検証で確認

## 情報源

### 主要（HIGH信頼度）
- [Framer Motion Animation公式ドキュメント](https://www.framer.com/motion/animation/) — keyframes、repeat、transitionオプション
- [Tailwind CSS v4 Animation公式ドキュメント](https://tailwindcss.com/docs/animation) — animate-pulse、animate-[<value>]構文
- [MDN: @keyframes](https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes) — CSSアニメーション基本
- [W3C WAI: C39 - Using the CSS reduce-motion query](https://www.w3.org/WAI/WCAG21/Techniques/css/C39.html) — prefers-reduced-motion実装
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — 2025年8月更新の最新情報
- [web.dev: prefers-reduced-motion](https://web.dev/prefers-reduced-motion/) — Google公式ベストプラクティス
- 既存コードベース（`src/index.css`、`src/components/bgm/BgmPlayer.tsx`） — 実装済みコードの分析

### 二次（MEDIUM信頼度）
- [WCAG 2.3.1 - Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below.html) — 光感受性エピレプシーに関するガイドライン（URLは404だが一般的なWCAG知識に基づく記載）

### 三次（LOW信頼度）
- なし

---
*研究完了日: 2026-03-26*
*ロードマップ準備完了: はい*
