# Technology Stack

**Project:** Pomdo v1.6.2 Statsカードデザイン改善
**Researched:** 2026-03-27
**Confidence:** HIGH

## Summary

既存のRecharts 3.8.0を使用したStatsカードグラフの見やすさ改善には、**追加ライブラリは不要**です。Recharts v3.8+の組み込み機能で、サイズ調整、余白、ラベル、色のカスタマイズが十分に可能です。

## Recommended Stack

### Core Technologies（既存）

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Recharts | 3.8.0 | グラフ描画 | Reactネイティブ、軽量、宣言的API。既に導入済みでv3.8+は高度なカスタマイズ機能を備える |
| React | 19.2.0 | UIフレームワーク | 既存コードベース |
| TypeScript | 5.9.3 | 型安全 | 既存コードベース |
| Tailwind CSS | 4.2.1 | スタイリング | 既存コードベース |

### No Additional Libraries Required

以下の機能はすべてRecharts 3.8.0の標準機能で実現可能です：

| 機能 | 実現方法 | 既存対応 |
|------|---------|---------|
| グラフサイズ調整 | `ResponsiveContainer`の`width`/`height`/`minHeight` | ✓ あり |
| 余白調整 | `ComposedChart`の`margin`プロパティ | ✗ なし（追加推奨） |
| 軸ラベル改善 | `XAxis`/`YAxis`の`tick`/`tickMargin`/`fontSize` | ✗ なし（追加推奨） |
| 色のカスタマイズ | `Bar`/`Line`の`fill`/`stroke`プロパティ | ✓ あり |
| 日曜始まり表示 | データ配列の順序調整（ロジック側で対応） | ✗ なし |

## Recharts 3.8+ スタイリング機能

### 1. グラフサイズと余白（ComposedChart）

```typescript
// ComposedChartでmarginプロパティを使用
<ComposedChart
  data={weeklyData}
  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
>
  {/* 既存コードにはmarginがないため、追加推奨 */}
</ComposedChart>
```

**効果:**
- グラフ描画エリアの余白を制御
- 軸ラベルがグラフ領域外にはみ出すのを防止
- `top`: 上部余白、`right`: 右側余白（右Y軸用）、`bottom`: 下部余白（X軸用）、`left`: 左側余白（左Y軸用）

### 2. ResponsiveContainerの改善

```typescript
// 既存: height={200}固定
// 改善案: 最小高さを確保しつつ、親コンテナに応じて伸縮
<ResponsiveContainer
  width="100%"
  height="100%"
  minHeight={200}
  debounce={0}
>
```

**効果:**
- `height="100%"`: 親コンテナのflex-1 min-h-0と連携して、利用可能なスペースを最大限活用
- `minHeight={200}`: グラフが小さくなりすぎるのを防止
- `debounce={0}`: リサイズ時の即座の再描画（デフォルトは0で問題ない）

### 3. 軸のカスタマイズ（XAxis, YAxis）

```typescript
// XAxis: 曜日ラベルの見やすさ改善
<XAxis
  dataKey="date"
  tick={{ fill: '#94a3b8', fontSize: 12 }}  // ラベル色とサイズ
  tickMargin={8}                            // ラベルと軸線の間隔
  stroke='#e2e8f0'                          // 軸線の色
  axisLine={{ stroke: '#e2e8f0' }}          // 軸線スタイル
  tickLine={false}                          // 目盛り線を非表示（クリーンな見た目）
/>

// 左YAxis（セッション数）
<YAxis
  yAxisId="left"
  tick={{ fill: '#94a3b8', fontSize: 11 }}
  tickMargin={8}
  stroke='#e2e8f0'
  axisLine={{ stroke: '#e2e8f0' }}
  tickLine={false}
/>

// 右YAxis（累積時間）
<YAxis
  yAxisId="right"
  orientation="right"
  tick={{ fill: '#94a3b8', fontSize: 11 }}
  tickMargin={8}
  stroke='#e2e8f0'
  axisLine={{ stroke: '#e2e8f0' }}
  tickLine={false}
/>
```

**効果:**
- `tick={{ fill, fontSize }}`: ラベルの色とフォントサイズを指定
- `tickMargin`: ラベルと軸線の間隔を確保し、読みやすさ向上
- `stroke`/`axisLine`: 軸線の色を薄くして、グラフを目立たせる
- `tickLine={false}`: 目盛り線を非表示にして、スッキリした見た目に

### 4. バーとラインのスタイリング（Bar, Line）

```typescript
// 既存の色設定は維持しつつ、視認性向上
<Bar
  yAxisId="left"
  dataKey="sessions"
  fill="#22c55e"           // 既存のプライマリーカラー
  radius={[4, 4, 0, 0]}    // バーの上部を丸める（オプション）
  maxBarSize={40}          // バーの最大幅を制限（オプション）
/>

<Line
  yAxisId="right"
  type="monotone"
  dataKey="cumulativeMinutes"
  stroke="#22c55e"         // 既存のプライマリーカラー
  strokeWidth={2}          // ラインの太さ
  dot={{ fill: '#22c55e', r: 3 }}  // データポイントのドット（オプション）
  activeDot={{ r: 5 }}     // アクティブ時のドットサイズ（オプション）
/>
```

**効果:**
- `radius`: バーの上部を角丸にして、モダンな外観に
- `maxBarSize`: バーが太くなりすぎるのを防止
- `dot`/`activeDot`: データポイントを可視化

### 5. ツールチップのカスタマイズ（Tooltip）

```typescript
<Tooltip
  contentStyle={{
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
    padding: '8px 12px',
  }}
  itemStyle={{
    padding: '4px 0',
  }}
  cursor={{ stroke: '#22c55e', strokeWidth: 1 }}
/>
```

**効果:**
- ダークモードに適したツールチップスタイル
- カーソルラインでホバー位置を明確に

## What NOT to Use（避けるべきライブラリ）

| ライブラリ | Why Avoid | Use Instead |
|-----------|-----------|-------------|
| Chart.js / Victory | 既にRechartsを使用中。二重導入はバンドルサイズ増大 | Rechartsの既存機能 |
| D3.js | 直接使用は複雑すぎる。Rechartsが内部で使用 | Rechartsの宣言的API |
| ApexCharts | Rechartsと機能重複。移行コスト大 | 現行のRecharts 3.8 |
| react-vis | メンテナンス停止（2019年で更新停止） | アクティブなRecharts |
| styled-components | 既にTailwind CSSを使用中。二重導入は複雑化 | Tailwind CSS + Recharts props |

## Installation

```bash
# 追加インストールは不要
# 既存のRecharts 3.8.0で十分

# もし将来的にバージョンアップする場合のみ:
npm install recharts@latest
```

## Implementation Approach

### Phase 1: グラフコンテナのレスポンシブ化
1. `ResponsiveContainer`の`height`を`"100%"`に変更
2. `minHeight={200}`を追加して最小高さを確保
3. 親コンテナの`flex-1 min-h-0`との連携を確認

### Phase 2: 余白とレイアウト調整
1. `ComposedChart`に`margin={{ top: 20, right: 30, bottom: 20, left: 20 }}`を追加
2. 右Y軸用に`right`余白を多めに確保
3. X軸ラベル用に`bottom`余白を確保

### Phase 3: 軸のスタイリング
1. `XAxis`に`tick={{ fill: '#94a3b8', fontSize: 12 }}`を追加
2. `XAxis`に`tickMargin={8}`を追加
3. `YAxis`（左右両方）に同様のスタイルを適用
4. `tickLine={false}`で目盛り線を非表示化

### Phase 4: 色とアクセント
1. `Bar`に`radius={[4, 4, 0, 0]}`で角丸を追加
2. `Bar`に`maxBarSize={40}`で最大幅を制限
3. `Line`に`dot`と`activeDot`を追加（オプション）

### Phase 5: 曜日表示順序調整
1. `getDayLabel`関数の曜日配列を日曜始まりに変更
2. `weeklyData`生成ループで日曜始まりの7日間を生成

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| recharts | 3.8.0 | React 19.2.0 | 現行バージョンで問題なし |
| react | 19.2.0 | recharts 3.8.0 | Recharts 3.8+はReact 19をサポート |
| typescript | 5.9.3 | recharts 3.8.0 | 型定義完備 |

## Recharts 3.8 Key Features

### v3.8.0での新機能・改善点（2025年3月リリース）
- `niceTicks`プロパティ: `'auto'`, `'adaptive'`, `'snap125'`, `'none'`で目盛り計算アルゴリズムを選択可能
- Z-Indexレイヤー: `zIndex`プロパティで要素の重なり順を制御
- パフォーマンス改善: 大量データポイントでのレンダリング最適化
- アクセシビリティ向上: `prefers-reduced-motion`対応（`isAnimationActive="auto"`）

### 既存コードで活用できる機能
- **型安全性**: TypeScript型定義が完全にサポート
- **レスポンシブ**: `ResponsiveContainer`で親コンテナに自動適応
- **カスタマイズ性**: 各コンポーネントで詳細なスタイル調整可能
- **宣言的API**: JSXでグラフ構造を直感的に記述

## Sources

- [Recharts GitHub Repository](https://github.com/recharts/recharts) - バージョン3.8.1（2026年3月25日リリース）
- [Recharts npm Package](https://www.npmjs.com/package/recharts) - パッケージ情報とインストール手順
- [Recharts Type Definitions](node_modules/recharts/types/) - ローカルの型定義ファイル（v3.8.0）
  - `types/chart/ComposedChart.d.ts`
  - `types/cartesian/XAxis.d.ts`
  - `types/cartesian/YAxis.d.ts`
  - `types/cartesian/Bar.d.ts`
  - `types/cartesian/Line.d.ts`
  - `types/component/ResponsiveContainer.d.ts`
  - `types/component/Tooltip.d.ts`
  - `types/util/types.d.ts`

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Recharts機能 | HIGH | 型定義ファイルから直接検証。v3.8.0の全機能を確認 |
| 追加ライブラリ不要 | HIGH | Recharts標準機能で実現可能なことを確認 |
| 実装アプローチ | HIGH | 既存コードベースと完全互換 |
| 曜日順序調整 | HIGH | ロジック側の変更で対応可能 |
