# Phase 10: グリッド統一 - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

全体的なデザインの一貫性を向上させる。カードデザインの統一、スペーシングの一貫性、デザインシステムの文書化を行う。

</domain>

<decisions>
## Implementation Decisions

### カードデザイン統一（GRID-01）
- 既存の`.bento-card`クラスを使用（新しいコンポーネントは作らない）
- App.tsxの各カード: `glass rounded-3xl overflow-hidden` → `bento-card` に置き換え
- StatsCard.tsx: `glass rounded-3xl` → `bento-card` に置き換え
- `.bento-card`クラスは既にglassmorphism + border-radius + overflow + transition + hoverを含む
- Framer Motionの`motion.div`構造は維持

### スペーシング統一（GRID-03）
- **gap**: `gap-4`（16px）で維持（既に統一済み）
- **padding**: コンテンツ密度に応じて使い分け
  - 大きなカード（TimerWidget, StatsCard）: `p-6`（24px）
  - 小さなカード（CurrentTaskCard, BgmPlayer, TodoList）: `p-4`（16px）

### デザインシステム文書化
- `.planning/DESIGN.md`を作成し、以下を定義
  - Spacing scale（4px基数）
  - Animation（duration, easing関数）
  - Border radius（rounded-xl, rounded-3xlなど）
  - Z-index scale（.z-widget-*クラス）
  - Colors（Deep Forestカラーパレット）
  - Typography（font-family, font-size, line-height）

### グリッド構造（GRID-04）
- Phase 08でcol-span修正済み
- 実装時に各ブレイクポイントで合計が正しいか検証
  - sm（6列）: Timer(4) + CurrentTask(2) → BGM(2) + Stats(2) → Todo(6) = 6列
  - lg（12列）: Timer(8) + CurrentTask(2) → BGM(2) + Stats(4) → Todo(12) = 12列

### ガターサイズ（GRID-02）
- `gap-4`（16px）で既に統一済み。変更なし。

### Claude's Discretion
- 具体的なアニメーションのdurationとeasing関数の値
- DESIGN.mdの具体的な構成と記述内容

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### グリッド統一要件
- `.planning/REQUIREMENTS.md` §GRID-01～GRID-04 — グリッド統一要件（カードデザイン、ガターサイズ、スペーシング、グリッドシステム）

### 既存コード
- `src/App.tsx` — グリッド定義、各カードのclassName（glass rounded-3xl overflow-hidden）
- `src/components/stats/StatsCard.tsx` — StatsCardのclassName（glass rounded-3xl）
- `src/index.css` — .glassクラスと.bento-cardクラスの定義

### 関連ドキュメント
- `.planning/ROADMAP.md` §Phase 10 — 成功基準（GRID-01～GRID-04対応）
- `.planning/phases/08-responsive-fix/08-CONTEXT.md` — Phase 08のグリッド修正内容

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **.bento-cardクラス**: glassmorphism + border-radius + overflow + transition + hover
- **Tailwind CSS**: v4使用、spacing scaleは4px基数
- **Deep Forestカラーパレット**: --df-accent-primary（#22c55e）、--df-bg-elevated、--df-text-primaryなど

### Established Patterns
- **グリッドシステム**: `grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4`
- **カードスタイル**: 各カードが`motion.div`でラップされ、個別のclassNameを持つ
- **Z-index scale**: .z-widget-bg（10）, .z-widget（20）, .z-widget-overlay（30）, .z-widget-modal（9999）

### Integration Points
- **App.tsx line 167-237**: 各カードのmotion.divのclassName修正箇所
- **StatsCard.tsx line 60**: className修正箇所
- **.planning/DESIGN.md**: 新規作成

### 既存の問題
- `.glass`と`.bento-card`の両クラスが存在し、用途が重複している
- App.tsxで各カードに`glass rounded-3xl overflow-hidden`が個別指定されている
- padding（p-4/p-6）がカードによって異なり、統一ルールがない

</code_context>

<specifics>
## Specific Ideas

- `.bento-card`クラスが既に完璧な定義を持っているため、これを使用する
- 大きなカードと小さなカードでpaddingを変えるのは、コンテンツ密度に応じた適切な判断
- DESIGN.mdは開発者がデザインルールを参照するためのドキュメントとして作成する

</specifics>

<deferred>
## Deferred Ideas

なし — ディスカッションはフェーズ範囲内で完結

</deferred>

---

*Phase: 10-grid-unification*
*Context gathered: 2026-03-22*
