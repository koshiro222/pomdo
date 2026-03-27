# Phase 21: 曜日表示修正 - Research

**Researched:** 2026-03-27
**Domain:** Frontend (React/Recharts) - Date handling & chart configuration
**Confidence:** HIGH

## Summary

本フェーズでは、Statsカードの週次グラフにおける曜日表示を「月曜始まり」から「日曜始まり」に変更します。現在の実装では、`getDayLabel()`関数内で曜日配列が`['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']`と定義されており、`(date.getDay() + 6) % 7`という計算式で月曜始まりのインデックスに変換しています。これを日曜始まりに合わせる必要があります。

**Primary recommendation:** 曜日配列を`['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']`に変更し、`date.getDay()`を直接使用するシンプルな実装に変更する。

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Recharts | 3.8.0 | グラフ描画 | プロジェクト既存ライブラリ、安定したReactチャートライブラリ |
| React | 19.2.0 | UIコンポーネント | プロジェクト既存バージョン |
| TypeScript | 5.9.3 | 型安全性 | プロジェクト既存バージョン |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.0.18 | ユニットテスト | 既存テストファイルの更新 |

**Version verification:** Recharts 3.8.0（npm view recharts version で確認済み、2026-03-27時点）

**Installation:** 不要（既存ライブラリのみ使用）

## Architecture Patterns

### Current Implementation Analysis

**File:** `src/components/stats/StatsCard.tsx`

**Current getDayLabel() function (line 92-102):**
```typescript
function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  if (isToday) return 'Today'

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] // 月曜始まり
  const dayIndex = (date.getDay() + 6) % 7 // 月曜=0, 日曜=6に変換
  return days[dayIndex]
}
```

**Problem:**
- 曜日配列が月曜始まり（Mon, Tue...）
- `date.getDay()`は日曜=0、月曜=1...土曜=6を返す
- `(date.getDay() + 6) % 7`で月曜=0、日曜=6に変換している

### Recommended Pattern 1: 日曜始まりの曜日配列

**What:** JavaScript標準の`Date.getDay()`戻り値（日曜=0...土曜=6）に対応する曜日配列を使用

**When to use:** 曜日を日曜始まりで表示する場合

**Example:**
```typescript
function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  if (isToday) return 'Today'

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] // 日曜始まり
  const dayIndex = date.getDay() // 日曜=0, 月曜=1... 土曜=6（標準通り）
  return days[dayIndex]
}
```

### Pattern 2: weeklyData生成ロジック（変更不要）

**What:** 直近7日間のデータを生成する既存ロジック

**Current implementation (line 108-125):**
```typescript
const weeklyData: WeeklyData[] = []
let cumulativeTotal = 0

for (let i = 6; i >= 0; i--) {
  const date = new Date()
  date.setDate(date.getDate() - i)
  const dateStr = date.toDateString()

  const daySessions = sessions.filter(
    (s) => s.type === 'work' && s.completedAt !== null && new Date(s.startedAt).toDateString() === dateStr
  )

  const dayMinutes = daySessions.reduce((sum, s) => sum + Math.floor(s.durationSecs / 60), 0)
  cumulativeTotal += dayMinutes

  weeklyData.push({
    date: getDayLabel(dateStr), // ここで変更後のgetDayLabelが呼ばれる
    sessions: daySessions.length,
    cumulativeMinutes: cumulativeTotal,
  })
}
```

**Why no change needed:**
- このループは「今日から遡って7日分」を生成しており、曜日の並び順は`getDayLabel()`の出力に依存するのみ
- `getDayLabel()`を修正すれば、グラフのX軸表示も自動的に日曜始まりになる

### Pattern 3: Recharts XAxis設定（変更不要）

**Current implementation (line 186-193):**
```typescript
<ComposedChart data={weeklyData}>
  <XAxis dataKey="date" /> <!-- dataKey="date"でweeklyData[].dateを参照 -->
  <YAxis yAxisId="left" />
  <YAxis yAxisId="right" orientation="right" />
  <Tooltip />
  <Bar yAxisId="left" dataKey="sessions" fill="#22c55e" name="セッション数" />
  <Line yAxisId="right" type="monotone" dataKey="cumulativeMinutes" stroke="#22c55e" strokeWidth={2} name="累積時間(分)" />
</ComposedChart>
```

**Why no change needed:**
- XAxisは`dataKey="date"`で`weeklyData[].date`（既に`getDayLabel()`で変換済み）を表示している
- `getDayLabel()`の戻り値が変われば、XAxis表示も自動的に変わる

### Anti-Patterns to Avoid

- **曜日配列のハードコーディング複数箇所:** 配列定義は`getDayLabel()`内1箇所のみにする
- **マジックナンバーでの曜日計算:** `(date.getDay() + 6) % 7`のような複雑な変換は避ける
- **英語3文字表記の統一性欠如:** 'Sun', 'Mon'...の統一表記を使用する（'Sunday', 'Mon.'など混在禁止）

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 曜日計算ロジック | 独自の曜日計算関数 | JavaScript標準`Date.getDay()` | 既に日曜=0...土曜=6の標準仕様あり |
| 日付操作ライブラリ | 独自の日付操作関数 | 標準`Date`オブジェクト | 単純な曜日取得のみで十分、追加ライブラリ不要 |
| グラフX軸カスタマイズ | 独自の軸描画コンポーネント | Recharts標準`XAxis` | `tickFormatter`等で十分対応可能 |

**Key insight:** JavaScript標準の`Date`オブジェクトとRechartsの既存機能だけで、日曜始まりの曜日表示は実現可能。追加ライブラリや複雑なカスタムロジックは不要。

## Common Pitfalls

### Pitfall 1: 曜日配列とgetDay()戻り値の不一致
**What goes wrong:** 曜日配列が`['Mon', 'Tue'...]`なのに、`date.getDay()`を直接使用すると、月曜のデータが「Sun」位置に表示される

**Why it happens:** `date.getDay()`は日曜=0、月曜=1を返すが、配列が`['Mon', 'Tue'...]`だとインデックス0=月曜になってしまう

**How to avoid:** 曜日配列を`['Sun', 'Mon'...]`にし、`date.getDay()`をそのまま使用する

**Warning signs:** グラフの曜日と実際の曜日が1日ずれている、テストで曜日不一致エラー

### Pitfall 2: "Today"表示の曜日ずれ
**What goes wrong:** 今日が日曜日の場合、"Today"が表示されず、"Sun"が表示される、または曜日がずれる

**Why it happens:** `getDayLabel()`内の`isToday`チェックが、曜日計算の前に行われているため、配列変更の影響を受けないが、週の始まりが変わるとデータの並び順が変わる

**How to avoid:** "Today"表示ロジックは変更不要だが、週次データ生成ループが「今日から遡る」実装であることを確認する

**Warning signs:** テストで"Today"が期待通り表示されない

### Pitfall 3: テストデータの曜日ハードコーディング
**What goes wrong:** テストコードで`date: 'Mon'`のように曜日をハードコーディングすると、日曜始まり変更時にテストが失敗する

**Why it happens:** 実装変更時にテストデータも更新し忘れる

**How to avoid:** テストでも`getDayLabel()`または標準的な日付生成ロジックを使用する

**Warning signs:** テストで曜日の文字列比較を行っている箇所

## Code Examples

Verified patterns from current codebase:

### getDayLabel()の修正前後
```typescript
// 修正前（月曜始まり）
function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  if (isToday) return 'Today'

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dayIndex = (date.getDay() + 6) % 7
  return days[dayIndex]
}

// 修正後（日曜始まり）
function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  if (isToday) return 'Today'

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayIndex = date.getDay() // 日曜=0, 月曜=1... 土曜=6
  return days[dayIndex]
}
```

### JavaScript Date.getDay()標準仕様
```javascript
// Source: MDN Web Docs - Date.getDay()
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDay

const date = new Date()
const day = date.getDay()
// 戻り値: 0（日曜）〜 6（土曜）

// 使用例
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const dayName = days[day] // 'Sunday' if day === 0
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 月曜始まりの曜日配列 + 変換ロジック | 日曜始まりの曜日配列 + 標準getDay() | Phase 21 (2026-03-27) | コード簡素化、日曜始まり表示 |

**Current implementation details:**
- **File:** `src/components/stats/StatsCard.tsx` (line 92-102)
- **Target function:** `getDayLabel()`
- **Change scope:** 曜日配列とインデックス計算の2箇所のみ

**Recharts version:** 3.8.0（2025年リリース、安定版）

## Open Questions

なし

**調査結果に基づき、実装は以下の1箇所の変更のみで完了:**
- `getDayLabel()`関数内の曜日配列と`dayIndex`計算

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vitest.config.ts`（プロジェクトルート） |
| Quick run command | `npm test -- --run StatsCard` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAT-01 | 曜日表示が日曜始まり（Sun, Mon...） | unit | `npm test -- --run StatsCard.test.tsx` | ✅ 既存 |

### Sampling Rate
- **Per task commit:** `npm test -- --run StatsCard.test.tsx`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
なし — 既存テストインフラがカバー

**既存テストの更新が必要:**
- `src/components/stats/StatsCard.test.tsx` — 曜日文字列の期待値を更新（テストデータ内の曜日文字列を確認）

## Sources

### Primary (HIGH confidence)
- **Current codebase analysis** — `src/components/stats/StatsCard.tsx` (line 92-102, 108-125)
- **JavaScript standard** — `Date.getDay()` returns 0 (Sunday) through 6 (Saturday)
- **Recharts 3.8.0** — npm registry verified current version

### Secondary (MEDIUM confidence)
- **MDN Web Docs** — `Date.getDay()`仕様（標準API）

### Tertiary (LOW confidence)
- なし — Web検索結果が空だったため、コードベース分析と標準仕様のみに依存

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 既存ライブラリのみ使用、バージョン確認済み
- Architecture: HIGH - 現行コードの直接分析に基づく
- Pitfalls: HIGH - 曜日計算のよくあるバグパターンを特定

**Research date:** 2026-03-27
**Valid until:** 2026-04-27（30日間 — 安定したドメイン）
