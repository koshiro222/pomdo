# Feature Research: Statsカードデザイン改善

**Domain:** Pomodoro統計ダッシュボード
**Researched:** 2026-03-27
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Statsカードに期待される基本機能。これがないと製品が不完全に感じられる。

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 曜日ラベルの表示 | グラフの軸が何を表しているか理解するために必要 | LOW | 現在実装済み（月曜始まり） |
| 余白とパディングの適切さ | グラフ要素が窮屈だと読みにくい | LOW | 現在の`height={200}`は少し小さい可能性 |
| カラーコントラスト | データが視認できないと意味がない | LOW | `#22c55e`使用、現在は良好 |
| ホバー時のツールチップ | 正確な数値を確認するために必要 | MEDIUM | Rechartsの`Tooltip`使用、改善の余地あり |
| レスポンシブ対応 | モバイルとデスクトップ両方で見る必要がある | LOW | `ResponsiveContainer`使用済み |

### Differentiators (Competitive Advantage)

競合他社と差別化できる機能。必須ではないが価値がある。

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 日曜始まりの曜日表示 | 日本のカレンダー文化（日曜始まり）に合わせる | LOW | 現在は月曜始まり、変更必要 |
| 複合チャート（Bar + Line） | 1つのグラフで2つの指標を同時に把握できる | MEDIUM | 既に実装済み（セッション数 + 累積時間） |
| タブ切り替え（Today/Week/Month） | 異なる時間軸で同じデータを素早く確認できる | LOW | 既に実装済み |
| 空状態のデザイン | データがない時も混乱させない親切なUI | LOW | 既に実装済み（アイコン + メッセージ） |

### Anti-Features (Commonly Requested, Often Problematic)

一見良さそうだが問題を引き起こす機能。

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 3Dグラフ | 見た目が派手で「高機能」に見える | データの歪み、可読性低下、パフォーマンス悪化 | 2Dグラフで十分、色とレイアウトで工夫 |
| 過度なアニメーション | 動きがあると「モダン」に見える | 気分の悪さ、データの追跡困難、アクセシビリティ低下 | 必要最小限のアニメーションのみ |
| 多数のデータ系列 | 詳しいデータが見たい | 情報過多、主要なインサイトが見えなくなる | 別のタブやグラフに分割 |
| 複雑なツールチップ | 詳細情報を見たい | ホバー時の認知負荷増加 | シンプルな数値表示、詳細は別ビュー |
| 曜日略字の多様化 | 国際化対応が必要 | コード複雑化、ロケール依存のバグ | 日本向けに固定（日/月/...） |

## Graph Readability Best Practices

### 可読性を高める要素

1. **サイズと余白**
   - グラフ高さは最低200px、推奨は250-300px（現在: 200px）
   - 軸ラベル用の余白を確保（XAxis `dy`プロップで調整）
   - データポイント間の十分な間隔

2. **色とコントラスト**
   - 色は3-5色までに制限
   - カラーブラインド対応（`#22c55e`は緑、問題なし）
   - 背景と十分なコントラスト比（WCAG AA以上）

3. **ラベルとテキスト**
   - フォントサイズは最低12px
   - 軸ラベルには単位を含める（「分」「回」等）
   - 曜日は略字（日/月/火/...）または英語（Sun/Mon/...）

4. **グリッドライン**
   - 水平グリッドのみ（垂直グリッドはノイズになりやすい）
   - 色は薄く（`stroke="#e0e0e0"`等）
   - 実線より破線（`strokeDasharray="3 3"`）

### 週の始まり: 日曜 vs 月曜

| 基準 | 日曜始まり | 月曜始まり |
|------|-----------|-----------|
| **日本** | ✓ 一般的 | 職場による |
| **米国** | ✓ 一般的 | 一部企業 |
| **欧州** | 一部国 | ✓ 一般的 |
| **ISO 8601** | - | ✓ 標準 |

**Pomdoの推奨:** 日曜始まり
- 理由1: 日本市場向けアプリのため、日本のカレンダー文化に合わせる
- 理由2: 週末をまとめて表示（土日）の方が直感的
- 理由3: 既存の`getDayLabel`関数を変更するだけ（実装簡単）

### Recharts固有のベストプラクティス

```typescript
// 1. 余白設定
<ComposedChart
  data={weeklyData}
  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
>

// 2. グリッドライン（水平のみ）
<CartesianGrid
  strokeDasharray="3 3"
  stroke="#e0e0e0"
  horizontal={true}
  vertical={false}
/>

// 3. XAxisカスタマイズ
<XAxis
  dataKey="date"
  tick={{ fontSize: 12, fill: '#6b7280' }}
  dy={10}  // ラベルの下方向オフセット
/>

// 4. ツールチップスタイル
<Tooltip
  contentStyle={{
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #ccc',
    borderRadius: '4px',
  }}
/>

// 5. YAxisの範囲制御
<YAxis
  yAxisId="left"
  domain={[0, 'auto']}  // 0から開始
/>
```

## Feature Dependencies

```
[曜日表示修正]
    └──requires──> [getDayLabel関数の変更]

[グラフサイズ改善]
    └──requires──> [ResponsiveContainer height調整]

[ツールチップ改善]
    └──requires──> [Tooltipコンポーネントのカスタマイズ]

[グリッドライン追加]
    └──requires──> [CartesianGridの追加]
```

### Dependency Notes

- **曜日表示修正 requires getDayLabel関数の変更:** 現在の`dayIndex = (date.getDay() + 6) % 7`（月曜始まり）を`dayIndex = date.getDay()`（日曜始まり）に変更
- **グラフサイズ改善 requires ResponsiveContainer height調整:** `height={200}`を`height={240}`に増やすことで可読性向上
- **ツールチップ改善 requires Tooltipコンポーネントのカスタマイズ:** 日本語ラベル、単位表示、背景色の追加
- **グリッドライン追加 requires CartesianGridの追加:** 現在は未実装、データ値を読み取りやすくするために必要

## MVP Definition

### v1.6.2 で実装（今回のマイルストーン）

- [x] 曜日表示を日曜始まりに変更 — 日本のカレンダー文化に合わせる
- [x] グラフサイズ改善 — `height={200}` → `height={240}`
- [x] 余白調整 — `margin`プロップで適切なスペースを確保
- [x] グリッドライン追加 — `CartesianGrid`で水平グリッドのみ表示
- [x] ツールチップ改善 — 日本語ラベルと単位を追加

### 今回は実装しない（将来検討）

- [ ] YAxisの目盛りラベルカスタマイズ — 「分」「回」等の単位表示
- [ ] グラフのアニメーション — データ更新時のスムーズな遷移
- [ ] データがない日を表示 — 0値の日も明示的にプロット
- [ ] 複数週の比較機能 — 先週との比較表示

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| 曜日表示を日曜始まりに変更 | HIGH | LOW | P1 |
| グラフサイズ改善 | HIGH | LOW | P1 |
| 余白調整 | MEDIUM | LOW | P1 |
| グリッドライン追加 | MEDIUM | LOW | P2 |
| ツールチップ改善 | MEDIUM | MEDIUM | P2 |
| YAxisラベルカスタマイズ | LOW | MEDIUM | P3 |
| グラフアニメーション | LOW | HIGH | P3 |
| 0値の日を明示的表示 | LOW | MEDIUM | P3 |

**Priority key:**
- P1: v1.6.2で実装（本マイルストーン）
- P2: 可能なら実装、または次回
- P3: 将来の検討事項

## Anti-Patterns to Avoid

### 過度な複雑化

❌ **悪い例:** 1つのグラフに5つ以上のデータ系列を表示
```typescript
// 読みにくい
<ComposedChart>
  <Bar dataKey="sessions" />
  <Bar dataKey="breaks" />
  <Line dataKey="focusTime" />
  <Line dataKey="breakTime" />
  <Line dataKey="efficiency" />
</ComposedChart>
```

✅ **良い例:** 2つのデータ系列に制限
```typescript
// 読みやすい
<ComposedChart>
  <Bar dataKey="sessions" />
  <Line dataKey="cumulativeMinutes" />
</ComposedChart>
```

### 不必要な装飾

❌ **悪い例:** 3D効果、過度なグラデーション
```typescript
// 見にくい
<Bar fill="url(#gradient3d)" />
```

✅ **良い例:** シンプルな flat design
```typescript
// 見やすい
<Bar fill="#22c55e" />
```

### 貧弱なラベリング

❌ **悪い例:** 単位がない、意味不明な略語
```typescript
// 何の単位？
<XAxis dataKey="date" label="D" />
<YAxis label="V" />
```

✅ **良い例:** 明確なラベルと単位
```typescript
// 意味が明確
<XAxis dataKey="date" label="日付" />
<YAxis label="セッション数" />
```

## ユーザーがStatsダッシュボードに期待すること

### プロダクティビティアプリの統計機能において、ユーザーは以下を期待します：

1. **迅速なインサイト把握**
   - 今日の成果が一目でわかること
   - 週の傾向が即座に理解できること
   - 複雑な操作なしで核心情報が見えること

2. **正確性と信頼性**
   - データが正確であること
   - 計算ロジックが透明であること
   - データの更新がリアルタイムであること

3. **モチベーション維持**
   - 達成感が視覚的にフィードバックされること
   - 進捗が追跡できること
   - 比較が可能であること（昨日 vs 今日、先週 vs 今週）

4. **シンプルさ**
   - 情報が過負荷でないこと
   - 必要な情報がすぐに見つかること
   - カスタマイズが直感的であること

### Pomdoの現状と改善点

| 期待 | 現状 | 改善アクション |
|------|------|---------------|
| 週の傾向が理解できる | グラフが小さく、曜日が月曜始まり | サイズ増加、日曜始まりに変更 |
| データが正確に読める | グリッドラインがない | 水平グリッド追加 |
| 数値が明確にわかる | ツールチップが英語 | 日本語化＋単位表示 |
| 視覚的に整理されている | 余白が不足 | margin調整 |

## 実装ガイドライン

### 曜日表示の変更（日曜始まり）

**現在の実装（月曜始まり）:**
```typescript
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const dayIndex = (date.getDay() + 6) % 7  // 月曜を0にする計算
```

**変更後（日曜始まり）:**
```typescript
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dayIndex = date.getDay()  // 日曜が0、土曜が6
```

### グラフのサイズと余白調整

**現在の実装:**
```typescript
<ResponsiveContainer width="100%" height={200}>
  <ComposedChart data={weeklyData}>
```

**変更後:**
```typescript
<ResponsiveContainer width="100%" height={240}>
  <ComposedChart
    data={weeklyData}
    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
  >
```

### グリッドラインの追加

**現在の実装:** なし

**変更後:**
```typescript
<CartesianGrid
  strokeDasharray="3 3"
  stroke="#e0e0e0"
  horizontal={true}
  vertical={false}
/>
```

### ツールチップの改善

**現在の実装:**
```typescript
<Tooltip />
```

**変更後:**
```typescript
<Tooltip
  contentStyle={{
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
  }}
  formatter={(value: number, name: string) => {
    if (name === 'セッション数') {
      return [`${value} 回`, 'セッション']
    }
    if (name === '累積時間(分)') {
      return [`${value} 分`, '累積集中時間']
    }
    return [value, name]
  }}
/>
```

## Sources

**信頼性: LOW-MEDIUM**
- ウェブ検索はレートリミットにより実行不可
- 内容はデータ可視化の一般的ベストプラクティスに基づく
- Rechartsの実装経験に基づく知識
- 現行コードベースの分析（`src/components/stats/StatsCard.tsx`）

**検証が必要な項目:**
- 日本のカレンダーにおける日曜始まりの割合（推定では80%以上）
- Rechartsの最新バージョンでの`margin`プロップの挙動
- モバイル環境での最適なグラフ高さ

**高信頼性の参照元（今後の調査推奨）:**
- Recharts公式ドキュメント: https://recharts.org — HIGH confidence（公式ドキュメント）
- ISO 8601標準: https://www.iso.org/standard/70907.html — HIGH confidence（国際標準）
- WCAG 2.1 カラーコントラスト基準 — HIGH confidence（アクセシビリティ標準）
- Edward Tufte "The Visual Display of Quantitative Information" — MEDIUM confidence（データ可視化の古典的文献）

---
*Feature research for: Pomodoro Statsカードデザイン改善*
*Researched: 2026-03-27*
