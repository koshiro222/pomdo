# Architecture Patterns

**Domain:** Statsカードデザイン改善
**Researched:** 2026-03-27

## 推奨アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│                   StatsCard.tsx                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         usePomodoro Hook                     │   │
│  │  - sessions: Session[]                      │   │
│  │  - loading: boolean                         │   │
│  │  - fetchSessions()                          │   │
│  └─────────────────────────────────────────────┘   │
│                      ↓                             │
│  ┌─────────────────────────────────────────────┐   │
│  │     データ集計レイヤー                       │   │
│  │  - getDayLabel(dateStr): string             │   │
│  │  - weeklyData: WeeklyData[]                 │   │
│  │  - todayStats                               │   │
│  │  - monthlyStats                             │   │
│  └─────────────────────────────────────────────┘   │
│                      ↓                             │
│  ┌─────────────────────────────────────────────┐   │
│  │       Recharts ComposedChart                 │   │
│  │  - XAxis (曜日ラベル)                        │   │
│  │  - YAxis (left/right)                        │   │
│  │  - Bar (セッション数)                        │   │
│  │  - Line (累積時間)                           │   │
│  │  - Tooltip                                   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### コンポーネント境界

| コンポーネント | 責任 | 通信先 |
|----------------|------|---------|
| `StatsCard.tsx` | 統計UIのレンダリング、タブ管理、データ集計 | `usePomodoro` hook、Recharts |
| `usePomodoro` | セッションデータの取得・保存・同期 | tRPC API、localStorage |
| `getDayLabel()` | 曜日ラベルの生成（日曜始まり対応） | `weeklyData` 集計ロジック |
| `ComposedChart` | 週間統計のグラフ描画 | `weeklyData[]`、Recharts props |

### データフロー

```
1. セッションデータ取得
   usePomodoro → sessions: Session[]
   ├─ ログイン済み: tRPC pomodoro.getSessions
   └─ ゲストモード: localStorage.getPomodoroSessions()

2. データ集計
   completedSessions = sessions.filter(s => s.completedAt !== null)

   weeklyData集計ループ:
   for i = 6 to 0:
     date = today - i days
     daySessions = sessions.filter(同一日付)
     dayMinutes = sum(daySessions.durationSecs / 60)
     cumulativeTotal += dayMinutes
     weeklyData.push({
       date: getDayLabel(dateStr),  // ← 日曜始まり修正ポイント
       sessions: daySessions.length,
       cumulativeMinutes: cumulativeTotal
     })

3. グラフ描画
   ComposedChart data={weeklyData}
   ├─ XAxis dataKey="date" (曜日ラベル)
   ├─ Bar yAxisId="left" dataKey="sessions"
   └─ Line yAxisId="right" dataKey="cumulativeMinutes"
```

## 改善パターン

### パターン1: getDayLabel関数修正（日曜始まり対応）

**現状:**
```typescript
function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  if (isToday) return 'Today'

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayIndex = (date.getDay() + 6) % 7  // 月曜始まり
  return days[dayIndex]
}
```

**改善後:**
```typescript
function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  if (isToday) return 'Today'

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayIndex = date.getDay()  // 日曜始まり (0=日曜, 6=土曜)
  return days[dayIndex]
}
```

**変更点:**
- `days` 配列を日曜始まりに変更
- `(date.getDay() + 6) % 7` 計算削除
- `date.getDay()` を直接使用

### パターン2: Recharts ComposedChart設定改善

**現在の問題点:**
- XAxisラベルが折り返される可能性
- YAxisのスケールが自動調整で見づらい
- Tooltipのフォーマットが整形されていない
- グラフサイズが固定（height={200}）

**改善後の設定:**
```typescript
<ComposedChart
  data={weeklyData}
  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
>
  <XAxis
    dataKey="date"
    axisLine={false}
    tickLine={false}
    tick={{ fontSize: 12, fill: 'var(--cf-subtext)' }}
    interval={0}  // 全ラベル表示
  />
  <YAxis
    yAxisId="left"
    axisLine={false}
    tickLine={false}
    tick={{ fontSize: 11, fill: 'var(--cf-subtext)' }}
    width={30}
  />
  <YAxis
    yAxisId="right"
    orientation="right"
    axisLine={false}
    tickLine={false}
    tick={{ fontSize: 11, fill: 'var(--cf-subtext)' }}
    width={35}
  />
  <Tooltip
    contentStyle={{
      backgroundColor: 'var(--df-bg-elevated)',
      border: '1px solid var(--df-border-subtle)',
      borderRadius: '8px',
    }}
    labelStyle={{ color: 'var(--cf-text)' }}
    itemStyle={{ color: 'var(--cf-subtext)' }}
  />
  <Bar
    yAxisId="left"
    dataKey="sessions"
    fill="var(--cf-primary)"
    radius={[4, 4, 0, 0]}  // 上部のみ角丸
    name="セッション数"
  />
  <Line
    yAxisId="right"
    type="monotone"
    dataKey="cumulativeMinutes"
    stroke="var(--cf-primary)"
    strokeWidth={2}
    dot={{ fill: 'var(--cf-primary)', r: 3 }}
    name="累積時間(分)"
  />
</ComposedChart>
```

**改善点:**
1. **マージン調整**: `margin` propで上下左右の余白を最適化
2. **軸の簡素化**: `axisLine={false}`, `tickLine={false}`で視覚ノイズ削減
3. **フォントサイズ統一**: `tick` propで一貫性のあるサイズ設定
4. **CSS変数対応**: `var(--cf-*)`でテーマ統一
5. **Barの角丸**: `radius={[4, 4, 0, 0]}`でモダンなデザイン
6. **Lineのドット**: `dot` propでデータポイントを明確化

### パターン3: ResponsiveContainerの高さ最適化

**現状:**
```typescript
<ResponsiveContainer width="100%" height={200}>
```

**改善後:**
```typescript
<div className="flex-1 min-h-[200px]">
  <ResponsiveContainer width="100%" height="100%">
```

**理由:**
- `flex-1` で親コンテナに合わせて伸縮
- `min-h-[200px]` で最低限の高さを確保
- `height="100%"` でResponsiveContainerに完全制御を委譲

## アンチパターンを回避

### アンチパターン1: 曜日配列のハードコード

**問題:** ロケール対応が必要になった場合に修正が困難
```typescript
// 悪い例
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
```

**回避:** 現在の要件では英語3文字略称で固定
```typescript
// 良い例（明示的なコメント付き）
// English 3-letter abbreviations (en-US locale standard)
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
```

### アンチパターン2: グラフ設定の分散

**問題:** コンポーネント内外で設定が散らばる
```typescript
// 悪い例: グローバルCSSでRechartsのスタイルを上書き
.recharts-tooltip { ... }
```

**回避:** ComposedChart内でpropsとして完結
```typescript
// 良い例: propsで明示的に制御
<Tooltip contentStyle={{ ... }} />
```

### アンチパターン3: データ変換ロジックの分離

**問題:** 集計ロジックがコンポーネント外にあると依存関係が不明確
```typescript
// 悪い例: 別ファイルでの集計
const weeklyData = calculateWeeklyData(sessions)  // どこで定義？
```

**回避:** コンポーネント内で閉じたデータ変換
```typescript
// 良い例: コンポーネント内で完結
const weeklyData: WeeklyData[] = []
// ... 集計ロジック
```

## 構築順序

### Phase 1: 曜日ラベル修正（先制）
1. `getDayLabel`関数を修正（`days`配列の順序変更、計算ロジック簡素化）
2. ローカルでグラフを確認（曜日が日曜始まりになっているか）

**理由:** データ変更はUI変更よりも影響範囲が大きいため、最初に検証する

### Phase 2: Recharts設定改善
1. `ComposedChart` のpropsを追加（margin, axisLine, tickLine等）
2. `XAxis`, `YAxis` のスタイル調整
3. `Bar`, `Line` の見た目改善（radius, dot等）
4. `Tooltip` のカスタムスタイル適用

**理由:** データが正しい状態であれば、UI調整は安全に反復可能

### Phase 3: レスポンシブ対応
1. `ResponsiveContainer` の高さを `100%` に変更
2. 親コンテナに `flex-1 min-h-[200px]` を追加
3. モバイル/デスクトップでグラフサイズを確認

**理由:** 最後にレスポンシブ挙動を調整することで、他の変更に影響されない

## スケーラビリティ考慮事項

| 懸念点 | 現行 | 今後の拡張 |
|--------|------|------------|
| ロケール対応 | 英語固定 | `Intl.DateTimeFormat` でロケール対応可能 |
| グラフ種類追加 | ComposedChartのみ | `BarChart`, `LineChart` など条件分岐で追加可能 |
| データ期間 | 直近7日固定 | 選択可能な期間（30日、90日）に拡張可能 |
| テーマ対応 | CSS変数参照 | ダークモード追加時に即対応可能 |

## 統合ポイント

### 既存コードとの統合
- **データフロー:** 変更なし（`usePomodoro` → `sessions` → `weeklyData`）
- **コンポーネント構造:** 変更なし（`StatsCard.tsx`単一ファイル）
- **状態管理:** 変更なし（ローカルstate `activeTab` のみ）
- **API通信:** 変更なし（tRPC `pomodoro.getSessions` を継続使用）

### 新規ファイルの必要性
- なし（既存 `StatsCard.tsx` 内で完結）

### 修正箇所の明示
| ファイル | 箇所 | 変更内容 |
|---------|------|---------|
| `src/components/stats/StatsCard.tsx` | `getDayLabel`関数（92-102行目） | 日曜始まりに変更 |
| `src/components/stats/StatsCard.tsx` | `ComposedChart` props（186-193行目） | グラフ設定追加 |
| `src/components/stats/StatsCard.tsx` | `ResponsiveContainer`（185行目） | 高さを `100%` に変更 |
| `src/components/stats/StatsCard.tsx` | 親div（184行目） | `flex-1 min-h-[200px]` 追加 |

## Sources

- Recharts公式ドキュメント: https://recharts.org/en-US/api/ComposedChart
- JavaScript Dateオブジェクト: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDay
- 既存コードベース: `src/components/stats/StatsCard.tsx`
- プロジェクトコンテキスト: `.planning/PROJECT.md` (v1.6.2 Statsカードデザイン改善)
