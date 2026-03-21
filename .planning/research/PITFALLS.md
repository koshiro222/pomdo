# UI/UX改善の落とし穴

**ドメイン:** レスポンシブ対応・Stats実装・グリッド統一
**調査日:** 2026-03-21
**全体の信頼度:** MEDIUM

## 要約

UI/UX改善プロジェクトで最も一般的で破壊的な失敗パターンを調査。レスポンシブ対応の不備、Stats実装のアンチパターン、グリッドデザインの一貫性欠如が主な課題。既存コードの分析から、Framer Motionのlayout prop使用によるレイアウトシフト、fixed/absolute配置による要素重なり、Statsのデータ取得ロジックの問題が判明。

## 重要な発見

**レスポンシブ対応:** Tailwindのブレークポイント設計ミスとoverflow処理の不備が要素重なりを引き起こす
**Stats実装:** 初回レンダリング時のデータ未取得状態と、useEffect依存配列の不備が表示バグの原因
**グリッド統一:** col-span/row-spanの論理的一貫性欠如と、ガターサイズの不統一

## ロードマップへの影響

フェーズ分割の推奨:
1. **レスポンシブ対応修正** — 既存UI崩壊を防ぐ最優先事項
2. **Stats機能実装** — データ取得と表示ロジックの修正
3. **グリッド統一** — 全体的なデザイン一貫性向上

**フェーズ順序の根拠:**
- レスポンシブ対応が不完全だと、どの画面サイズでも正しく動作確認できない
- Statsは既存のフック（usePomodoro）に依存しているため、データ取得ロジックを先に修正
- グリッド統一は視覚的な改善なので、機能修正後に実施

## 信頼性評価

| 領域 | 信頼度 | 理由 |
|------|--------|------|
| レスポンシブ対応 | HIGH | 既存コード分析から具体的な問題点を特定 |
| Stats実装 | HIGH | 既存コードのバグを特定 |
| グリッド統一 | MEDIUM | 一般的なベストプラクティスに基づく推奨 |

---

## クリティカルな落とし穴

重大な障害や書き直しを必要とするミス。

### 落とし穴 1: Framer Motionのlayout propによるレイアウトシフト

**何が問題か:**
Framer Motionの`layout` propを使用している要素（`App.tsx`のmotion.div）が、画面サイズ変更やデータ更新時にレイアウトアニメーションを発生させ、一時的に要素が重なるまたは位置がずれる。

**なぜ起こるか:**
- `layout` propは要素のサイズ・位置変化を自動アニメーションする
- レスポンシブ変更時に複数の要素が同時にアニメーションすると、競合が発生
- `AnimatePresence`などの他のアニメーションと組み合わせると挙動が予測不可能

**影響:**
- ユーザーが操作中にボタンやカードが突然動き、誤操作を引き起こす
- 要素が一時的に重なり、コンテンツが見えなくなる
- 特にモバイル画面で顕著

**予防:**
```typescript
// 悪い例: layout propで全てにアニメーション
<motion.div layout className="...">
  {/* コンテンツ */}
</motion.div>

// 良い例: 必要な要素のみlayoutを使用
<motion.div
  layout="position"  // サイズ変更ではなく位置のみアニメーション
  transition={{ layout: { duration: 0.2 } }}  // アニメーション時間を短く
  className="..."
>
  {/* コンテンツ */}
</motion.div>
```

**検出:**
- 画面サイズを素早く変更したときに要素がガタつく
- デバイスの回転時にレイアウトが崩れる

### 落とし穴 2: overflowプロパティの不適切な設定

**何が問題か:**
`main`タグに`overflow-y-auto`、`sm:overflow-hidden`が設定されているため、画面サイズによってスクロール挙動が変わる。スマホではスクロール可能だが、タブレット以上では固定される。

**なぜ起こるか:**
- `h-screen`（100vh）が親要素に設定されている
- 子要素の合計高さが100vhを超えると、overflow設定が不十分だと要素がはみ出る
- タブレット（sm）以上で`overflow-hidden`にすると、コンテンツが見切れる

**影響:**
- コンテンツが画面外に見えなくなる
- タブレットユーザーがスクロールできず、機能にアクセスできない
- 特にTodoリストの項目が増えたときに顕著

**予防:**
```css
/* 悪い例: ブレークポイントでoverflow挙動が変わる */
main {
  @apply overflow-y-auto sm:overflow-hidden;
}

/* 良い例: 一貫したoverflow挙動 */
main {
  @apply overflow-y-auto;
  /* またはmin-h-0を追加してflexboxのサイズ制約を解決 */
  @apply min-h-0;
}
```

**検出:**
- 異なる画面サイズでDevToolsの要素検証を行い、overflow設定を確認
- 実機でタブレットサイズ（768px-1024px）をテスト

### 落とし穴 3: Statsのデータ取得タイミングとuseEffect依存配列

**何が問題か:**
`StatsCard.tsx`で`usePomodoro()`フックからセッションデータを取得しているが、初回レンダリング時はデータが空の可能性がある。また、`useEffect`でセッションデータの変更を監視していない。

**なぜ起こるか:**
- `usePomodoro`フックは非同期でデータを取得
- 初回レンダリング時点では`sessions`が空配列
- 統計計算が空配列に対して行われ、常に0を表示
- `sessions`を依存配列に含むuseEffectがないため、データ更新時に再計算されない

**影響:**
- ページ読み込み時にStatsが常に0を表示
- ポモドーロ完了後に統計が更新されない
- ユーザーが「機能していない」と誤解

**予防:**
```typescript
// 悪い例: 依存配列がない
const { sessions } = usePomodoro()
const stats = calculateStats(sessions)

// 良い例: セッション変更時に再計算
const { sessions } = usePomodoro()
const [stats, setStats] = useState(null)

useEffect(() => {
  setStats(calculateStats(sessions))
}, [sessions])  // sessionsを依存配列に含める
```

**検出:**
- ポモドーロ完了後にStatsの数字が変わらない
- ログイン・ログアウト時にStatsがリセットされない

## 中程度の落とし穴

### 落とし穴 1: グリッドシステムの論理的不整合

**何が問題か:**
`App.tsx`のグリッドシステムで、`sm:grid-cols-6 lg:grid-cols-12`と定義されているが、各カードのcol-span指定が論理的に矛盾している。

**具体例:**
- タイマーカード: `sm:col-span-4`（6列中4列）、`lg:col-span-8`（12列中8列）
- Current Task: `sm:col-span-2`（6列中2列）、`lg:col-span-2`（12列中2列）
- BGM: `sm:col-span-2`（6列中2列）、`lg:col-span-2`（12列中2列）

問題:
- タブレット（sm）で4+2+2=8列だが、グリッドは6列定義
- カードが予期せず折り返され、レイアウト崩壊

**影響:**
- タブレット画面でカードが重なる
- グリッドが崩れてカードが画面外に押し出される

**予防:**
```typescript
// 悪い例: 合計がグリッド列数を超える
<div className="grid grid-cols-1 sm:grid-cols-6">
  <div className="sm:col-span-4" />  {/* 4列 */}
  <div className="sm:col-span-2" />  {/* 2列 */}
  {/* 合計6列 - OK */}
  <div className="sm:col-span-2" />  {/* 追加で2列 - 合計8列でオーバー */}
</div>

// 良い例: 合計がグリッド列数以下
<div className="grid grid-cols-1 sm:grid-cols-6">
  <div className="sm:col-span-3" />  {/* 3列 */}
  <div className="sm:col-span-3" />  {/* 3列 */}
  {/* 合計6列 - 完璧 */}
</div>
```

**検出:**
- タブレットサイズ（768px-1024px）でテスト
- DevToolsでグリッドの列数とcol-spanの合計を確認

### 落とし穴 2: タイマー部分の余白過多

**何が問題か:**
`TimerDisplay.tsx`の`padding: p-6`（24px）と`TimerWidget`の`padding: p-6`が二重に適用され、タイマーカード内に過剰な余白が発生。

**影響:**
- タイマー表示が小さくなり、視認性が低下
- 特にモバイル画面でタイマー文字が読みづらい
- タイマーサイズ（280px）が固定で、小さな画面でははみ出る

**予防:**
```typescript
// 悪い例: 二重パディング
function TimerWidget() {
  return (
    <div className="p-6">  {/* 外側パディング */}
      <TimerDisplay />
    </div>
  )
}

function TimerDisplay() {
  return (
    <div className="p-6">  {/* 内側パディング */}
      {/* タイマー */}
    </div>
  )
}

// 良い例: 一箇所に集約
function TimerWidget() {
  return <TimerDisplay />  // パディングなし
}

function TimerDisplay() {
  return (
    <div className="p-6">  {/* ここで一元管理 */}
      {/* タイマー */}
    </div>
  )
}
```

**検出:**
- DevToolsでパディングが二重に適用されていないか確認
- 異なる画面サイズでタイマーのサイズ感をテスト

### 落とし穴 3: selectedTask UXの不透明さ

**何が問題か:**
`CurrentTaskCard`コンポーネントで「現在選択中のタスク」を表示しているが、ユーザーがこの機能の存在を認知していない可能性が高い。

**影響:**
- タスクを選択しても何が変わるかわからない
- ユーザーがこの機能を使わない
- 実装とメンテナンスコストに見合わない

**予防:**
- ユーザー調査で機能の有用性を確認
- 使われていない場合は削除を検討
- 保留する場合は、UIで明確に説明を追加

**検出:**
- ユーザーテストでタスク選択フローを観察
- アナリティクスで機能の使用頻度を確認

## 軽微な落とし穴

### 落とし穴 1: ガターサイズの不統一

**何が問題か:**
グリッドのgapが`gap-4`（16px）で統一されているが、内部コンポーネントのmarginが統一されていない。

**影響:**
- 全体的なデザインに統一感がない
- 視覚的なノイズが増える

**予防:**
- Tailwindのspacing scaleに従ってmargin/paddingを統一
- 基本単位（4px、8px、16px、24px、32px）を決めておく

### 落とし穴 2: 固定サイズによるレスポンシブ対応の不備

**何が問題か:**
`TimerRing`のサイズが`size={280}`で固定されており、小さな画面でははみ出る可能性がある。

**影響:**
- モバイル画面でタイマーが見切れる
- 小さなデバイスで操作性が低下

**予防:**
```typescript
// 悪い例: 固定サイズ
<TimerRing size={280} />

// 良い例: レスポンシブサイズ
<TimerRing size={isMobile ? 200 : 280} />
// またはCSSで制御
<TimerRing size="100%" style={{ maxWidth: 280 }} />
```

## フェーズ別の警告

| フェーズ | トピック | 想定される落とし穴 | 軽減策 |
|----------|----------|-------------------|--------|
| **Phase 01** | レスポンシブ対応 | Framer Motionのlayout propによるレイアウトシフト | layout="position"のみ使用、アニメーション時間を短縮 |
| **Phase 01** | レスポンシブ対応 | overflow設定のブレークポイント不一致 | overflow-y-autoを統一、min-h-0を追加 |
| **Phase 02** | Stats実装 | データ取得タイミングとuseEffect依存配列 | sessionsを依存配列に含める、ローディング状態を表示 |
| **Phase 02** | Stats実装 | グラフの最大値計算バグ（0除算） | Math.max(..., 1)でデフォルト値を設定済みだが、0件時の表示を改善 |
| **Phase 03** | グリッド統一 | col-span合計がグリッド列数を超える | 各ブレークポイントで合計を計算し、グリッド定義に合わせる |
| **Phase 03** | グリッド統一 | ガターサイズの不統一 | spacing scaleを定義し、全コンポーネントで適用 |

## 情報源

**既存コード分析:**
- `/Users/koshiro/develop/pomdo/src/App.tsx` — グリッドシステム、Framer Motion使用状況
- `/Users/koshiro/develop/pomdo/src/components/stats/StatsCard.tsx` — Statsデータ取得ロジック
- `/Users/koshiro/develop/pomdo/src/components/timer/TimerDisplay.tsx` — タイマーパディング
- `/Users/koshiro/develop/pomdo/ai-rules/ARCHITECTURE.md` — 技術スタック

**公式ドキュメント:**
- Framer Motion — https://www.framer.com/motion/（LOW confidence: WebFetchが完全なドキュメントを取得できず）
- Tailwind CSS Grid — https://tailwindcss.com/docs/grid（MEDIUM confidence: WebFetchがメタデータのみを取得）

**情報源の信頼性:**
- 既存コード分析: HIGH confidence（直接コードを確認）
- 公式ドキュメント: MEDIUM confidence（WebFetchの制限により完全な情報取得が困難）
- 一般的なベストプラクティス: MEDIUM confidence（WebSearchがレート制限により結果なし）

## ギャップ

- Framer Motionのlayout propの最適な使用パターンについて、公式ドキュメントの詳細な確認が必要
- Tailwind CSS Gridのレスポンシブ設計ベストプラクティスについて、より具体的なガイダンスが必要
- Stats表示のパフォーマンス最適化（大容量データ時）についての調査が必要
