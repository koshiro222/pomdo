# Phase 9: Stats機能実装 - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

ユーザーは自分の作業統計を視覚的に把握できる。今日・週次・月次の統計（集中時間・セッション数）、日別セッション数の棒グラフ、累積集中時間の折れ線グラフを表示する。

</domain>

<decisions>
## Implementation Decisions

### 月次統計UI
- タブ切り替え方式で実装（Today | Week | Month）
- タブ順序: Today → Week → Month
- 月次統計の期間: 今月（1日〜末日）
- 月次統計の表示内容: 合計値のみ（月間合計集中時間と月間セッション数）

### グラフ実装
- 週次チャートの棒グラフを自前実装からRechartsのBarChartに移行
- Weekタブに棒グラフ＋折れ線グラフの複合グラフを表示
  - 棒グラフ: 日別セッション数
  - 折れ線グラフ: 累積集中時間の推移
- グラフのカラースキーム: プライマリーカラー#22c55e（green）をベースに統一
- Tooltip: Rechartsのデフォルト（日付＋セッション数＋集中時間）

### ローディング/空状態
- ローディング状態: 既存のセッションデータを表示しつつ、グラフ中央にスピナーを配置
- 空状態: 「セッションがありません\nポモドーロを始めて記録を残しましょう」というメッセージとBarChart3アイコンを表示

### データ更新挙動
- 既存ロジック維持: useEffectは不要、Reactの再レンダーフローで十分
- 自動更新: セッション完了時のみ
- 初期表示: Todayタブをデフォルトで表示
- 進行中のセッション: 統計に含めない（完了したもののみ）

### Claude's Discretion
- Rechartsの具体的な実装方法（BarChart、LineChart、ComposedChartの選択）
- タブ切り替えのアニメーション
- スピナーの具体的なデザイン

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Stats機能要件
- `.planning/REQUIREMENTS.md` §STAT-01～STAT-08 — Stats機能の全要件（今日/週次/月次統計、棒/折れ線グラフ、ローディング/空状態、データ更新）

### 既存コード
- `src/components/stats/StatsCard.tsx` — 現在のStats実装（今日の統計、週次チャート、自前divベースグラフ）
- `src/hooks/usePomodoro.ts` — sessionsデータとloading状態の取得元

### 関連ドキュメント
- `.planning/ROADMAP.md` §Phase 9 — 成功基準（STAT-01～STAT-08対応）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **usePomodoroフック**: sessions配列、loading状態、error状態を提供
  - Session型: `{ id, userId?, todoId, type, startedAt, completedAt, durationSecs, createdAt }`
  - セッション完了時に自動的にinvalidateQueriesで更新
- **lucide-react**: Clock, Target, BarChart3アイコンが使用可能
- **Framer Motion**: motion.div、AnimatePresenceが既に導入済み
- **glassクラス**: `.glass` で統一されたカードスタイル

### Established Patterns
- **カードヘッダー**: `text-xs uppercase tracking-widest text-cf-subtext font-bold mb-4`
- **統計表示**: アイコン（`w-10 h-10 rounded-xl bg-cf-primary/20`）+ 数値（`text-2xl font-bold`）+ ラベル（`text-xs text-cf-subtext`）
- **グラフアニメーション**: Framer Motionのinitial/animate/transitionパターン

### Integration Points
- **StatsCard.tsx**: Recharts導入、タブ切り替え、月次統計、ローディング/空状態の実装
- **package.json**: Rechartsの追加（`npm install recharts`）

### 既存の問題
- 週次チャートが自前のdivベースで実装されている（Rechartsへの移行が必要）
- 月次統計が実装されていない
- 折れ線グラフが実装されていない
- ローディング状態と空状態の表示がない
- タブ切り替え機能がない

</code_context>

<specifics>
## Specific Ideas

- タブ切り替えはGitHub Contributionタブを参考にする
- グラフの色はプライマリーカラー#22c55eをベースに統一
- 月次統計は合計値のみでシンプルに（グラフはWeekタブのみ）
- ローディング中は既存データを維持（UXの観点から）

</specifics>

<deferred>
## Deferred Ideas

- リアルタイム更新（WebSocket等）— v1.3以降で検討（STAT-EXT-01）
- CSVエクスポート — v1.3以降で検討（STAT-EXT-02）
- プロジェクト別統計 — v1.3以降で検討（STAT-EXT-03）
- 年次レポート — v1.3以降で検討（STAT-EXT-04）

</deferred>

---

*Phase: 09-stats*
*Context gathered: 2026-03-22*
