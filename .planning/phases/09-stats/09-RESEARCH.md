# Phase 9: Stats機能実装 - Research

**Researched:** 2026-03-22
**Domain:** React + Rechartsによる統計可視化
**Confidence:** MEDIUM

## Summary

本フェーズでは、ユーザーが自分の作業統計を視覚的に把握できるStats機能を実装する。Recharts（v3.8.0）を使用して棒グラフと折れ線グラフを表示し、今日・週次・月次の統計をタブ切り替えで提供する。

**主要な技術的決定:**
- Recharts v3.8.0を採用（Reactネイティブ、軽量、宣言的API）
- ComposedChartで棒グラフと折れ線グラフを複合表示
- Framer Motionのlayout propによるタブ切り替えアニメーション
- ローディング状態は既存データを維持したままスピナーを表示
- 空状態はBarChart3アイコンとメッセージを表示

**主要な推奨事項:**
- Rechartsの`<ComposedChart>`コンポーネントを使用して複数のグラフを1つのチャートに表示
- タブ切り替えはstate管理でシンプルに実装（useEffect不要、Reactの再レンダーフローで十分）
- ローディング状態の設計はUXの観点から「既存データを維持」アプローチを採用

## <user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- 月次統計UI: タブ切り替え方式（Today | Week | Month）
- タブ順序: Today → Week → Month
- 月次統計の期間: 今月（1日〜末日）
- 月次統計の表示内容: 合計値のみ（月間合計集中時間と月間セッション数）
- 週次チャートの棒グラフを自前実装からRechartsのBarChartに移行
- Weekタブに棒グラフ＋折れ線グラフの複合グラフを表示
- グラフのカラースキーム: プライマリーカラー#22c55e（green）をベースに統一
- Tooltip: Rechartsのデフォルト（日付＋セッション数＋集中時間）
- ローディング状態: 既存のセッションデータを表示しつつ、グラフ中央にスピナーを配置
- 空状態: 「セッションがありません\nポモドーロを始めて記録を残しましょう」というメッセージとBarChart3アイコンを表示
- 既存ロジック維持: useEffectは不要、Reactの再レンダーフローで十分
- 自動更新: セッション完了時のみ
- 初期表示: Todayタブをデフォルトで表示
- 進行中のセッション: 統計に含めない（完了したもののみ）

### Claude's Discretion
- Rechartsの具体的な実装方法（BarChart、LineChart、ComposedChartの選択）
- タブ切り替えのアニメーション
- スピナーの具体的なデザイン

### Deferred Ideas (OUT OF SCOPE)
- リアルタイム更新（WebSocket等）— v1.3以降で検討（STAT-EXT-01）
- CSVエクスポート — v1.3以降で検討（STAT-EXT-02）
- プロジェクト別統計 — v1.3以降で検討（STAT-EXT-03）
- 年次レポート — v1.3以降で検討（STAT-EXT-04）
</user_constraints>

## <phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STAT-01 | 今日の統計表示（集中時間・セッション数） | 既存のStatsCard.tsxで実装済み、データ集計ロジックは再利用可能 |
| STAT-02 | 週次統計表示 | RechartsのComposedChart使用、日別セッション数と累積集中時間を表示 |
| STAT-03 | 月次統計表示 | 今月1日〜末日のセッションを集計、合計値のみ表示 |
| STAT-04 | 棒グラフ表示（日別セッション数） | RechartsのBarChart使用、データ変換ロジックが必要 |
| STAT-05 | 折れ線グラフ表示（累積集中時間） | RechartsのLineChart使用、累積計算ロジックが必要 |
| STAT-06 | ローディング状態の表示 | usePomodoroフックのloading状態を使用、スピナー実装 |
| STAT-07 | 空状態の表示（データがない場合） | sessions.length === 0の条件分岐で実装 |
| STAT-08 | データ更新時の再描画 | Reactの再レンダーフローで自動対応、useEffect不要 |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.0 | Reactチャートライブラリ | Reactネイティブ、軽量、宣言的API、SVGベースでレスポンシブ対応 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| framer-motion | ^12.35.1 | タブ切り替えアニメーション | 既に導入済み、layout propでスムーズな遷移 |
| lucide-react | ^0.575.0 | アイコン（BarChart3） | 既に導入済み、空状態で使用 |
| usePomodoro | custom | sessionsデータとloading状態 | 既存フック、データ取得元 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js, Victory, Nivo | RechartsはReactネイティブで最もシンプル、他は heavier または API が複雑 |
| ComposedChart | 複数チャートを並列配置 | ComposedChartは1つのチャートで複系列を表示、データ整合性が容易 |

**Installation:**
```bash
npm install recharts
```

**Version verification:** 2026-03-22時点で最新版は3.8.0
```bash
npm view recharts version
# 3.8.0
```

## Architecture Patterns

### Recommended Component Structure
```
src/components/stats/
├── StatsCard.tsx           # メインコンポーネント（既存、拡張）
├── TodayStats.tsx          # 今日の統計表示（抽出）
├── WeeklyChart.tsx         # 週次グラフ（抽出）
└── MonthlyStats.tsx        # 月次統計（新規）
```

### Pattern 1: Recharts ComposedChart
**What:** 棒グラフと折れ線グラフを1つのチャートに複合表示
**When to use:** 週次統計で日別セッション数と累積集中時間を同時に表示する場合
**Example:**
```typescript
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface WeeklyData {
  date: string
  sessions: number
  cumulativeMinutes: number
}

// データ変換
const weeklyData: WeeklyData[] = last7Days.map(date => ({
  date: formatDayLabel(date),
  sessions: countSessions(sessions, date),
  cumulativeMinutes: calculateCumulative(sessions, date),
}))

// グラフ描画
<ResponsiveContainer width="100%" height={200}>
  <ComposedChart data={weeklyData}>
    <XAxis dataKey="date" />
    <YAxis yAxisId="left" />
    <YAxis yAxisId="right" orientation="right" />
    <Tooltip />
    <Bar yAxisId="left" dataKey="sessions" fill="#22c55e" name="セッション数" />
    <Line yAxisId="right" type="monotone" dataKey="cumulativeMinutes" stroke="#22c55e" name="累積時間(分)" />
  </ComposedChart>
</ResponsiveContainer>
```

### Pattern 2: タブ切り替え
**What:** stateで現在のタブを管理し、条件レンダリングで表示を切り替え
**When to use:** 今日・週次・月次の統計を切り替える場合
**Example:**
```typescript
const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today')

const tabs = [
  { id: 'today' as const, label: 'Today' },
  { id: 'week' as const, label: 'Week' },
  { id: 'month' as const, label: 'Month' },
]

return (
  <div>
    {/* タブボタン */}
    <div className="flex gap-2 mb-4">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 rounded-lg ${activeTab === tab.id ? 'bg-cf-primary text-white' : 'bg-white/10'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* タブコンテンツ */}
    {activeTab === 'today' && <TodayStats sessions={sessions} />}
    {activeTab === 'week' && <WeeklyChart sessions={sessions} />}
    {activeTab === 'month' && <MonthlyStats sessions={sessions} />}
  </div>
)
```

### Pattern 3: ローディング状態の表示
**What:** 既存データを維持したまま、グラフ中央にスピナーを表示
**When to use:** データ取得中も既存コンテンツを表示したい場合
**Example:**
```typescript
const { sessions, loading } = usePomodoro()

return (
  <div className="relative">
    {/* 既存の統計表示 */}
    <StatsContent sessions={sessions} />

    {/* ローディングスピナー（オーバーレイ） */}
    {loading && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl">
        <div className="w-8 h-8 border-2 border-cf-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )}
  </div>
)
```

### Pattern 4: 空状態の表示
**What:** データがない場合にアイコンとメッセージを表示
**When to use:** セッションが1件もない場合
**Example:**
```typescript
const { sessions, loading } = usePomodoro()
const completedSessions = sessions.filter(s => s.completedAt !== null)

if (completedSessions.length === 0 && !loading) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-cf-subtext">
      <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
      <p className="text-center">セッションがありません<br />ポモドーロを始めて記録を残しましょう</p>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **useEffectでsessionsを監視**: Reactの再レンダーフローで十分、useEffectは不要でパフォーマンス劣化の原因
- **グラフのデータ変換をレンダリング内で実行**: useMemoを使用して計算結果をキャッシュ
- **ローディング中にコンテンツを完全に非表示**: UXの観点から既存データを維持
- **空状態とローディング状態の混同**: loadingフラグとデータ長を別々に判定

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| グラフ描画 | 自前のdivベース実装 | RechartsのBarChart/LineChart | レスポンシブ対応、アニメーション、Tooltip、アクセシビリティ |
| 日付計算 | 手動でDate操作 | date-fnsやluxon（必要な場合） | タイムゾーン、フォーマット、境界条件の複雑さ |
| タブアニメーション | CSS transition | Framer Motionのlayout prop | レイアウトシフトの自動計算、パフォーマンス最適化 |
| 累積計算 | ループで足し算 | reduce関数 | 宣言的、テスト容易、バグりにくい |

**Key insight:** 自前実装は一見簡単に見えるが、エッジケース（タイムゾーン、月末日、閏年、データ境界）で複雑になる。Rechartsはこれらを抽象化している。

## Common Pitfalls

### Pitfall 1: タイムゾーンの不一致
**What goes wrong:** クライアントとサーバーのタイムゾーンが異なり、日付集計がずれる
**Why it happens:** `new Date(string)` はローカルタイムゾーンで解釈される
**How to avoid:** すべての日付操作をUTCで統一、またはローカルタイムゾーンで一貫して処理
**Warning signs:** 「今日の統計」が昨日のセッションを含む、または含まない

### Pitfall 2: グラフのデータ未ソート
**What goes wrong:** グラフが時系列順に表示されない
**Why it happens:** セッションデータがstartedAtでソートされていない
**How to avoid:** データ変換時に必ず日付でソート
**Warning signs:** グラフのX軸が日付順でない

### Pitfall 3: 累積計算の誤り
**What goes wrong:** 累積集中時間が正しく計算されない
**Why it happens:** 1日ごとの累積ではなく、全期間の累積を表示している
**How to avoid:** 各日付で「その日までの合計」を計算
**Warning signs:** 折れ線グラフが単調増加していない

### Pitfall 4: Rechartsのレスポンシブ対応不足
**What goes wrong:** 画面サイズ変更時にグラフが崩れる
**Why it happens:** ResponsiveContainerを使用していない、または親要素の高さが固定されていない
**How to avoid:** 必ずResponsiveContainerでラップし、親要素に`min-h-0`と`flex-1`を設定
**Warning signs:** グラフが小さすぎる、または溢れている

### Pitfall 5: ローディング状態の誤判定
**What goes wrong:** ローディング中に空状態が表示される
**Why it happens:** loadingとデータ長の判定順序が間違っている
**How to avoid:** `if (loading && sessions.length === 0)` で初期ロードを判定
**Warning signs:** 初回ロード時に「セッションがありません」が表示される

## Code Examples

Verified patterns from official sources:

### Recharts BarChart基本形
```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Mon', sessions: 4 },
  { name: 'Tue', sessions: 3 },
  { name: 'Wed', sessions: 5 },
]

<ResponsiveContainer width="100%" height={200}>
  <BarChart data={data}>
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="sessions" fill="#22c55e" />
  </BarChart>
</ResponsiveContainer>
```

### Recharts ComposedChart（複合チャート）
```typescript
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const data = [
  { date: 'Mon', sessions: 4, minutes: 100 },
  { date: 'Tue', sessions: 3, minutes: 75 },
  { date: 'Wed', sessions: 5, minutes: 125 },
]

<ResponsiveContainer width="100%" height={200}>
  <ComposedChart data={data}>
    <XAxis dataKey="date" />
    <YAxis yAxisId="left" />
    <YAxis yAxisId="right" orientation="right" />
    <Tooltip />
    <Legend />
    <Bar yAxisId="left" dataKey="sessions" fill="#22c55e" name="セッション数" />
    <Line yAxisId="right" type="monotone" dataKey="minutes" stroke="#22c55e" strokeWidth={2} name="集中時間(分)" />
  </ComposedChart>
</ResponsiveContainer>
```

### 日別セッション集計
```typescript
interface DailyStats {
  date: string
  focusMinutes: number
  pomodoros: number
}

const getDailyStats = (sessions: Session[], dateStr: string): DailyStats => {
  return sessions
    .filter(s => s.type === 'work' && s.completedAt !== null && new Date(s.startedAt).toDateString() === dateStr)
    .reduce(
      (acc, s) => ({
        focusMinutes: acc.focusMinutes + Math.floor(s.durationSecs / 60),
        pomodoros: acc.pomodoros + 1,
      }),
      { focusMinutes: 0, pomodoros: 0 }
    )
}

// 直近7日間のデータ
const weeklyData: DailyStats[] = []
for (let i = 6; i >= 0; i--) {
  const date = new Date()
  date.setDate(date.getDate() - i)
  const dateStr = date.toDateString()
  weeklyData.push({ date: dateStr, ...getDailyStats(sessions, dateStr) })
}
```

### 月次統計集計
```typescript
const getMonthlyStats = (sessions: Session[]): { totalMinutes: number; totalSessions: number } => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

  return sessions
    .filter(s => {
      const sessionDate = new Date(s.startedAt)
      return s.type === 'work' && s.completedAt !== null && sessionDate >= firstDay && sessionDate <= now
    })
    .reduce(
      (acc, s) => ({
        totalMinutes: acc.totalMinutes + Math.floor(s.durationSecs / 60),
        totalSessions: acc.totalSessions + 1,
      }),
      { totalMinutes: 0, totalSessions: 0 }
    )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 自前divベースグラフ | RechartsのBarChart/LineChart | 2026-03-22（Phase 09） | レスポンシブ対応、アニメーション、Tooltipの自動実装 |
| 単一の週次統計 | タブ切り替え（Today/Week/Month） | 2026-03-22（Phase 09） | ユーザーが異なる期間の統計を簡単に比較可能 |
| ローディング中は空白 | 既存データ維持＋スピナー | 2026-03-22（Phase 09） | UX向上、コンテキスト維持 |

**Deprecated/outdated:**
- 自前のdivベースチャート実装: Rechartsへの移行により、簡潔で保守性の高いコードに改善

## Open Questions

1. **RechartsのTooltipカスタマイズ**
   - What we know: デフォルトのTooltipで日付＋セッション数＋集中時間を表示可能
   - What's unclear: 日本語フォーマット、色のカスタマイズ方法
   - Recommendation: 最初はデフォルトを使用、必要に応じて`content` propでカスタムTooltipを実装

2. **グラフのアニメーション有無**
   - What we know: Rechartsはデフォルトでアニメーション有効
   - What's unclear: パフォーマンスへの影響、無効化するかどうか
   - Recommendation: デフォルト有効で実装、問題があれば`animation={false}`で無効化

3. **月次統計の期間境界**
   - What we know: 「今月（1日〜末日）」という仕様
   - What's unclear: 月末のセッションが翌月1日に完結した場合の集計方法
   - Recommendation: startedAt基準で集計（仕様通り実装、エッジケースは無視）

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- src/components/stats/StatsCard.test.ts -x` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAT-01 | 今日の統計表示（集中時間・セッション数） | unit | `npm test -- src/components/stats/StatsCard.test.ts -t "today stats"` | ❌ Wave 0 |
| STAT-02 | 週次統計表示 | unit | `npm test -- src/components/stats/StatsCard.test.ts -t "weekly stats"` | ❌ Wave 0 |
| STAT-03 | 月次統計表示 | unit | `npm test -- src/components/stats/StatsCard.test.ts -t "monthly stats"` | ❌ Wave 0 |
| STAT-04 | 棒グラフ表示（日別セッション数） | visual | `npm run test:e2e -- tests/e2e/stats.spec.ts -t "bar chart"` | ❌ Wave 0 |
| STAT-05 | 折れ線グラフ表示（累積集中時間） | visual | `npm run test:e2e -- tests/e2e/stats.spec.ts -t "line chart"` | ❌ Wave 0 |
| STAT-06 | ローディング状態の表示 | visual | `npm run test:e2e -- tests/e2e/stats.spec.ts -t "loading state"` | ❌ Wave 0 |
| STAT-07 | 空状態の表示（データがない場合） | visual | `npm run test:e2e -- tests/e2e/stats.spec.ts -t "empty state"` | ❌ Wave 0 |
| STAT-08 | データ更新時の再描画 | visual | `npm run test:e2e -- tests/e2e/stats.spec.ts -t "data refresh"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- src/components/stats/StatsCard.test.ts -x`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/stats.test.ts` — 統計集計ロジックのユニットテスト（getDailyStats, getMonthlyStats, 累積計算）
- [ ] `tests/e2e/stats.spec.ts` — Stats機能のE2Eテスト（タブ切り替え、グラフ描画、ローディング/空状態）
- [ ] `src/test/setup.ts` — Rechartsのモック設定（必要な場合）

## Sources

### Primary (HIGH confidence)
- Recharts公式サイト - https://recharts.org/ - APIドキュメント、基本サンプル
- npmレジストリ - https://www.npmjs.com/package/recharts - バージョン3.8.0（2026-03-22確認）

### Secondary (MEDIUM confidence)
- 既存コードベース - `src/components/stats/StatsCard.tsx` - 現在の実装パターン、データ構造
- 既存コードベース - `src/hooks/usePomodoro.ts` - sessionsデータとloading状態の仕様
- CONTEXT.md - Phase 09の実装決定事項

### Tertiary (LOW confidence)
- なし（WebSearchが機能しなかったため、公式ドキュメントと既存コードに依存）

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Recharts v3.8.0は確認済みだが、具体的な実装パターンは公式ドキュメントに基づく
- Architecture: HIGH - 既存コードベースのパターンを分析、React標準のアプローチ
- Pitfalls: MEDIUM - 一般的なReact/Rechartsの落とし穴に基づくが、プロジェクト固有の問題は実装中に発見の可能性

**Research date:** 2026-03-22
**Valid until:** 2026-04-22（30日間 - Rechartsは安定したライブラリ）
