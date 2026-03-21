# Phase 8: レスポンシブ対応修正 - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

全画面サイズでUIが正しく表示される。要素の重なり解消、一貫したスクロール挙動、レイアウトシフトの解消、タイマー部分の余白調整を行う。

</domain>

<decisions>
## Implementation Decisions

### グリッド修正
- smブレイクポイント（6列）を維持
- Statsカードのcol-spanを4→2に変更
- smブレイクポイントでの2行目: BGM(2) + Stats(2) + 残り2列 → 残り2列をTodo(2)に割り当てて合計6列に
- lgブレイクポイント（12列）は現状維持

**修正後のcol-span:**
- Timer: sm:col-span-4 lg:col-span-8 row-span-2
- CurrentTask: sm:col-span-2 lg:col-span-2
- BGM: sm:col-span-2 lg:col-span-2
- Stats: sm:col-span-2（4から変更） lg:col-span-4
- Todo: sm:col-span-6 lg:col-span-12

### Framer Motion最適化
- 全カードの`layout` propを`layout="position"`に変更
- アニメーション時間を0.5秒→0.2秒に短縮（fadeInUpVariantsのduration）
- 初期表示のfadeInUpアニメーションは維持

### タイマー余白調整
- TimerWidgetの`p-6`は維持（他カードとの統一感）
- モードタブ（Focus/Short Break/Long Break）の位置を`top-6 left-6`→`top-4 left-4`に変更
- TimerDisplay.tsx line 27を修正

### overflow統一
- main要素: `overflow-y-auto sm:overflow-hidden` → `min-h-0`のみに変更（scrollbar表示制御を削除）
- TodoList: `overflow-y-auto min-h-0`を追加
- StatsCard: `overflow-y-auto min-h-0`を追加
- グリッドコンテナ: `h-full`を維持（親の高さを継承）

### Claude's Discretion
- BgmPlayer, CurrentTaskCard にoverflowが必要かどうかは実装時に判断
- 具体的なアニメーションイージング関数は既存値を維持

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### レスポンシブ要件
- `.planning/REQUIREMENTS.md` §RESP-01～RESP-05 — レスポンシブ対応要件（要素重なし、overflow統一、ブレイクポイント、layout prop解消、余白調整）

### 既存コード
- `src/App.tsx` — グリッド定義（line 167）、Framer Motion layout prop（line 175, 197, 209, 221, 233）、main要素のoverflow（line 165）
- `src/components/timer/TimerDisplay.tsx` — モードタブの位置（line 27）
- `src/lib/animation.ts` — fadeInUpVariantsのduration（line 16）

### 関連ドキュメント
- `.planning/ROADMAP.md` §Phase 8 — 成功基準（RESP-01～RESP-05対応）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Framer Motion**: 既に導入済み、motion.divが使用されている
- **Tailwind CSS**: v4使用、responsive prefix (sm:, lg:) でブレイクポイント制御
- **Glassmorphism**: `.glass` クラスで既に統一されたカードスタイル

### Established Patterns
- **グリッドシステム**: `grid-cols-1 sm:grid-cols-6 lg:grid-cols-12` でレスポンシブ
- **Bento Grid**: 各カードが`col-span-*`と`row-span-*`で配置
- **アニメーション**: `fadeInUpVariants`で初期表示アニメーション

### Integration Points
- **App.tsx line 167**: グリッド定義の修正箇所
- **App.tsx line 165**: main要素のoverflow修正箇所
- **TimerDisplay.tsx line 27**: モードタブの位置修正箇所
- **animation.ts line 16**: fadeInUpVariantsのduration修正箇所

### 既知の問題
- smブレイクポイントでcol-span合計が16列（グリッド6列に対して）
- `layout` propによる複数カード同時のレイアウトシフト競合
- TimerWidgetのp-6 + TimerDisplayのtop-6/left-6で二重パディング
- main要素の`sm:overflow-hidden`で縦方向のコンテンツが見切れる

</code_context>

<specifics>
## Specific Ideas

- Bento Gridのデザインを維持しつつ、レスポンシブ対応を修正
- 「要素が重なる」問題は「意図しない折り返し」と「Timerの右側の空きスペース」として認識
- カード内スクロールはDashboard-styleアプリの標準的なアプローチとして採用
- `min-h-0`はFlexbox/Gridでoverflowを有効にするための重要なテクニック

</specifics>

<deferred>
## Deferred Ideas

なし — ディスカッションはフェーズ範囲内で完結

</deferred>

---

*Phase: 08-responsive-fix*
*Context gathered: 2026-03-22*
