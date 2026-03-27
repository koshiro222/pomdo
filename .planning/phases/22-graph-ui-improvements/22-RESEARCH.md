# Phase 22: グラフUI改善 - Research

**Researched:** 2026-03-27
**Domain:** Recharts グラフスタイリング / shadcn/ui デザインパターン
**Confidence:** HIGH

## Summary

フェーズ22は、Recharts 3.8.0を使用したStatsカード内のグラフUI改善を目的としている。shadcn/ui Chartコンポーネントのデザインパターンを参考に、ミニマルで読みやすいグラフスタイルを実装する。

主要な発見:
1. **Recharts 3.8.0**（2026-03-06リリース）には`accessibilityLayer`プロップが標準で実装されており、デフォルトで有効化されている
2. **XAxis/YAxisコンポーネント**には`tickLine={false}`、`axisLine={false}`、`tickMargin`プロップが存在し、shadcn/uiスタイルのミニマルな軸表現を実現可能
3. **CartesianGrid**は`vertical={false}`プロップで水平グリッドラインのみ表示できるが、本フェーズではグリッドライン追加を見送ることが決定済み
4. **プロジェクトのカラーシステム**（`text-cf-subtext`: #9ca3af）との統一が容易

**主要な推奨事項:** Rechartsの標準プロップのみを使用し、追加ライブラリなしでshadcn/ui準拠のミニマルなグラフスタイルを実装する。

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **グラフサイズと余白**: 高さはUXベストプラクティスに基づいてClaudeが裁量で決定（aspectベースの動的高さ推奨）。パディングはRechartsデフォルトを使用（自動計算される余白を活用）。X軸ラベルは3文字表記を維持（Sun, Mon, Tue...）。レスポンシブ対応はResponsiveContainerを維持（デスクトップと同じ高さで幅に応じて縮小）
- **軸スタイル（shadcn/ui準拠）**: XAxis/YAxisに `tickLine={false}` を適用（目盛り線を非表示）。XAxis/YAxisに `axisLine={false}` を適用（軸線を非表示）。軸ラベルの色は `text-cf-subtext`（#9ca3af）を使用。ComposedChartに `accessibilityLayer` プロップを追加（スクリーンリーダー対応）
- **グリッドライン**: 水平グリッドラインは追加しない（現状維持、シンプルな見た目を優先）

### Claude's Discretion
- グラフの具体的な高さ（数値またはaspectRatioの選択）
- YAxisの目盛り数と間隔
- Tooltipのスタイル調整

### Deferred Ideas (OUT OF SCOPE)
- STAT-05: ツールチップの日本語化 — v1.6.2では見送り
- STAT-06: prefers-reduced-motion対応 — v1.6.2では見送り
- YAxisの目盛りラベルカスタマイズ（単位表示） — v1.6.2では基本機能改善に焦点

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STAT-02 | グラフサイズと余白の調整 | ResponsiveContainerの高さ調整、Rechartsデフォルトパディング活用 |
| STAT-03 | 水平グリッドラインの追加 | CartesianGrid vertical={false} で実現可能だが、本フェーズでは見送り決定済み |
| STAT-04 | 軸スタイルの改善（shadcn/ui準拠） | XAxis/YAxisにtickLine、axisLineプロップで実現可能 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.0 | グラフ描画 | プロジェクト既存ライブラリ、accessibilityLayer等最新機能をサポート |
| react | ^19.2.0 | UIコンポーネント | プロジェクト既存 |
| lucide-react | ^0.575.0 | アイコン（BarChart3） | プロジェクト既存 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwind-merge | ^3.5.0 | スタイルマージ | 既存スタイルシステムとの統合時に使用 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts直接使用 | shadcn/ui Chartコンポーネント導入 | CONTEXT.mdで「Recharts直接使用維持、デザインパターンのみ参考」と決定済み |

**Installation:**
```bash
# 既にインストール済みのため不要
npm install recharts@3.8.0
```

**Version verification:**
```bash
npm view recharts@3.8.0 version
# 3.8.0 (リリース日: 2026-03-06)
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/stats/
├── StatsCard.tsx          # 既存実装（修正対象）
└── (将来拡張用)            # グラフ共通コンポーネント等
```

### Pattern 1: shadcn/ui準拠のミニマル軸スタイル
**What:** XAxis/YAxisコンポーネントで`tickLine={false}`、`axisLine={false}`を使用し、目盛り線・軸線を非表示にするスタイル
**When to use:** クリーンでモダンなグラフデザインを実現する場合
**Example:**
```tsx
// Source: https://ui.shadcn.com/docs/components/chart + Recharts 3.8.0 node_modules/types
<ComposedChart data={weeklyData}>
  <XAxis
    dataKey="date"
    tickLine={false}
    tickMargin={10}
    axisLine={false}
    tickFormatter={(value) => value.slice(0, 3)}  // 3文字表記維持
  />
  <YAxis
    yAxisId="left"
    tickLine={false}
    axisLine={false}
  />
  <YAxis
    yAxisId="right"
    orientation="right"
    tickLine={false}
    axisLine={false}
  />
  {/* ... */}
</ComposedChart>
```

### Pattern 2: accessibilityLayerによるアクセシビリティ向上
**What:** ComposedChart等のChartコンポーネントに`accessibilityLayer`プロップを追加し、キーボードナビゲーション・スクリーンリーダー対応を有効化
**When to use:** 全てのグラフコンポーネント（デフォルトで有効だが明示的に指定）
**Example:**
```tsx
// Source: Recharts 3.8.0 node_modules/types/chart/CartesianChart.d.ts
<ComposedChart
  data={weeklyData}
  accessibilityLayer  // キーボードアクセスとARIA属性の追加
>
  {/* ... */}
</ComposedChart>
```

### Anti-Patterns to Avoid
- **不要なプロップ追加**: `allowDataOverflow`等、ユースケースに合わないプロップを安易に追加しない
- **カラムの指定**: 軸ラベル色をCSS変数（`text-cf-subtext`）ではなく直接指定しない

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| グラフのアクセシビリティ対応 | カスタムARIA属性・キーボードハンドラー | `accessibilityLayer` プロップ | Recharts 3.8.0標準機能で実装済み |
| 軸線・目盛り線の非表示 | CSSでの非表示 | `tickLine={false}`, `axisLine={false}` | Rechartsネイティブな制御が最適 |

**Key insight:** Recharts 3.8.0には、shadcn/ui Chartコンポーネントが参考にしている機能（accessibilityLayer、tickLine、axisLine）が既に実装されている。追加ラッパーやカスタム実装は不要。

## Common Pitfalls

### Pitfall 1: 軸ラベルの色指定方法
**What goes wrong:** `stroke`プロップに直接色コードを指定すると、テーマ変更時に配色が崩れる
**Why it happens:** Tailwind CSSのカラーシステム（`text-cf-subtext`）と競合する
**How to avoid:** 現状はRechartsデフォルトの軸ラベルスタイルを使用し、必要に応じて`className`でTailwindクラスを適用
**Warning signs:** グラフ内のテキスト色が周囲のUIと異なる

### Pitfall 2: YAxisの目盛り数
**What goes wrong:** データ範囲に応じて目盛り数が自動調整され、ラベルが重なることがある
**Why it happens:** Rechartsのデフォルト目盛りアルゴリズム
**How to avoid:** `tickCount`プロップで目盛り数を制限（必要に応じて）
**Warning signs:** Y軸ラベルが重なって表示される

### Pitfall 3: グラフサイズの固定
**What goes wrong:** 高さを固定値にすると、コンテナサイズ変更時にグラフが伸びる
**Why it happens:** ResponsiveContainerのサイズ計算とCSSの高さ指定が競合
**How to avoid:** ResponsiveContainerの`height` propと親コンテナのスタイルを整合させる
**Warning signs:** グラフが縦伸び・横伸びする

## Code Examples

Verified patterns from Recharts 3.8.0 source:

### XAxis/YAxisミニマルスタイル
```tsx
// Source: node_modules/recharts/types/cartesian/XAxis.d.ts, YAxis.d.ts
// Verified: Recharts 3.8.0 (2026-03-06)
<XAxis
  dataKey="date"
  tickLine={false}        // 目盛り線を非表示
  tickMargin={10}         // ラベルの余白
  axisLine={false}        // 軸線を非表示
  tickFormatter={(value) => value.slice(0, 3)}  // "Today" -> "Tod"（現状維持）
/>
<YAxis
  yAxisId="left"
  tickLine={false}
  axisLine={false}
/>
```

### accessibilityLayerの使用
```tsx
// Source: node_modules/recharts/types/chart/CartesianChart.d.ts
// Verified: Recharts 3.8.0 (2026-03-06)
<ComposedChart
  data={weeklyData}
  accessibilityLayer  // boolean: デフォルトtrue
>
  {/* ... */}
</ComposedChart>
```

### グリッドライン（参考：使用しない決定済み）
```tsx
// Source: https://ui.shadcn.com/docs/components/chart
// Note: 本フェーズでは使用しない（CONTEXT.md決定）
import { CartesianGrid } from 'recharts'

<CartesianGrid vertical={false} strokeDasharray="3 3" />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| カスタムアクセシビリティ実装 | `accessibilityLayer` プロップ | Recharts 3.x | キーボードナビゲーション・ARIA対応が標準化 |
| CSSでの軸線非表示 | `axisLine={false}` プロップ | Recharts初期 | ネイティブな制御で最適化 |

**Deprecated/outdated:**
- **軸線のCSS非表示**: プロップでの制御が推奨
- **カラムのハードコード**: CSS変数との統一が推奨

## Open Questions

なし。Recharts 3.8.0のソースコードから必要なAPI情報を確認済み。

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (env: jsdom) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAT-02 | グラフサイズ・余白が適切 | manual-only | Visual inspection in browser | ❌ Wave 0 |
| STAT-03 | 水平グリッドライン（不使用） | N/A | N/A | - |
| STAT-04 | 軸スタイルがshadcn/ui準拠 | manual-only | Visual inspection in browser | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`（既存テスト regression 確認）
- **Per wave merge:** `npm test -- --run`（全スイート実行）
- **Phase gate:** Visual inspection（手動確認） + 既存テスト green

### Wave 0 Gaps
- [ ] `src/components/stats/StatsCard.test.tsx` — STAT-02, STAT-04 の視覚的検証
- [ ] E2E test for graph rendering — Playwrightでのグラフ表示確認

**Note:** グラフUI変更は視覚的検証が主となるため、ユニットテストは既存ロジックの regression 確認に留める。新規テストファイルはE2Eで補完。

## Sources

### Primary (HIGH confidence)
- **Recharts 3.8.0 source code** — `/node_modules/recharts/types/cartesian/XAxis.d.ts`, `YAxis.d.ts`, `CartesianChart.d.ts`
  - `accessibilityLayer?: boolean` プロップの存在を確認
  - `tickLine?: boolean \| SVGProps<SVGLineElement>` プロップの定義を確認
  - `axisLine?: boolean \| SVGProps<SVGLineElement>` プロップの定義を確認
- **Recharts 3.8.0 release date** — `npm info recharts@3.8.0 time` (2026-03-06T21:58:48.207Z)

### Secondary (MEDIUM confidence)
- **shadcn/ui Chart documentation** — https://ui.shadcn.com/docs/components/chart
  - `CartesianGrid vertical={false}` パターン
  - `tickLine={false}`, `axisLine={false}` パターン
  - `accessibilityLayer` プロップの使用例

### Tertiary (LOW confidence)
- なし（全て一次ソースまたは公式ドキュメントから確認）

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Recharts 3.8.0 npm registry + ソースコードで確認
- Architecture: HIGH - Recharts型定義ファイルから直接確認
- Pitfalls: HIGH - プロジェクト既存コード + Rechartsソースコードから分析

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (30日 - 安定したライブラリバージョン)
