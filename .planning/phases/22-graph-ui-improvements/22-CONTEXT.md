# Phase 22: グラフUI改善 - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

グラフの視認性を向上させ、shadcn/uiデザインシステムに準拠したスタイルを適用する。グリッドラインや軸スタイルを改善し、データが読み取りやすいグラフを実装する。

</domain>

<decisions>
## Implementation Decisions

### グラフサイズと余白
- 高さはUXベストプラクティスに基づいてClaudeが裁量で決定（aspectベースの動的高さ推奨）
- パディングはRechartsデフォルトを使用（自動計算される余白を活用）
- X軸ラベルは3文字表記を維持（Sun, Mon, Tue...）
- レスポンシブ対応はResponsiveContainerを維持（デスクトップと同じ高さで幅に応じて縮小）

### 軸スタイル（shadcn/ui準拠）
- XAxis/YAxisに `tickLine={false}` を適用（目盛り線を非表示）
- XAxis/YAxisに `axisLine={false}` を適用（軸線を非表示）
- 軸ラベルの色は `text-cf-subtext`（#9ca3af）を使用
- ComposedChartに `accessibilityLayer` プロップを追加（スクリーンリーダー対応）

### グリッドライン
- 水平グリッドラインは追加しない（現状維持、シンプルな見た目を優先）

### Claude's Discretion
- グラフの具体的な高さ（数値またはaspectRatioの選択）
- YAxisの目盛り数と間隔
- Tooltipのスタイル調整

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### shadcn/ui Chartドキュメント
- https://ui.shadcn.com/docs/components/chart — shadcn/ui Chartコンポーネントのスタイルパターン（CartesianGrid vertical={false}、tickLine={false}、axisLine={false}、accessibilityLayer等）

### プロジェクトドキュメント
- `.planning/REQUIREMENTS.md` §STAT-02, STAT-03, STAT-04 — グラフ見やすさ改善の要件
- `.planning/ROADMAP.md` §Phase 22 — フェーズ成功基準

### 既存コード
- `src/components/stats/StatsCard.tsx` — 現在のStats実装（Recharts 3.8.0、ComposedChart、ResponsiveContainer）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Recharts 3.8.0**: ComposedChart、Bar、Line、XAxis、YAxis、Tooltip、ResponsiveContainer
- **lucide-react**: BarChart3アイコン
- **bento-cardクラス**: グラスモーフィズム効果、ボーダー、ホバー効果

### Established Patterns
- **カラースキーム**: Deep Forest（--df-accent-primary: #22c55e、--df-text-secondary: #9ca3af）
- **日曜始まり**: フェーズ21で実装済み（getDayLabel()関数、週データ生成ロジック）

### Integration Points
- `src/components/stats/StatsCard.tsx` — ComposedChartコンポーネントにスタイル適用

</code_context>

<specifics>
## Specific Ideas

- shadcn/uiのChartドキュメントスタイルを参考に、ミニマルで読みやすいグラフを目指す
- プロジェクトの既存カラーシステム（text-cf-subtext）との統一を優先
- accessibilityLayerでアクセシビリティ向上（スクリーンリーダー対応）

</specifics>

<deferred>
## Deferred Ideas

- STAT-05: ツールチップの日本語化 — v1.6.2では見送り
- STAT-06: prefers-reduced-motion対応 — v1.6.2では見送り
- YAxisの目盛りラベルカスタマイズ（単位表示） — v1.6.2では基本機能改善に焦点

</deferred>

---

*Phase: 22-graph-ui-improvements*
*Context gathered: 2026-03-27*
