# Statsカードグラフ改善の落とし穴

**ドメイン:** 統計グラフ改善（既存アプリへの改良）
**調査日:** 2026-03-27
**全体の信頼度:** MEDIUM

## Executive Summary

Statsカードのグラフ改善における主要な落とし穴は、**レスポンシブデザインの破綻**、**アクセシビリティの不足**、**パフォーマンスの劣化**、**国際化対応の不備**の4つに分類される。既存実装（Recharts ComposedChart）の改良では、これらの問題が修正中に新たに発生する可能性が高い。

既存のResponsiveContainerを使用した実装は良い基盤だが、モバイルブレイクポイントでのレイアウト崩れ、色コントラスト不足、アニメーションの制御不在、データ追加時の再レンダリング負荷など、複数の改善領域が存在する。

## Critical Pitfalls

修正時に重大な問題を引き起こす落とし穴。

### Pitfall 1: レスポンシブコンテナの親要素サイズ不足

**何が問題になる:**
グラフがモバイルで潰れたり、はみ出たりする。

**なぜ起こる:**
- ResponsiveContainerは親要素の寸法に依存する
- 親の`flex-1`や`min-h-0`が正しく設定されていないと、高さが0になる
- 現在のコードでは`flex-1 flex flex-col min-h-0`で正しく回避されているが、修正時に削除しやすい

**結果:**
- モバイルでグラフが表示されない
- 横スクロールが発生する
- レイアウト崩れで他のコンテンツに重なる

**予防:**
```tsx
// 正しいパターン（維持必須）
<div className="flex-1 flex flex-col min-h-0">
  <div className="flex-1 min-h-0">
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={weeklyData}>
        {/* ... */}
      </ComposedChart>
    </ResponsiveContainer>
  </div>
</div>
```

- `flex-1` + `min-h-0`の組み合わせを維持
- グラフの高さを固定値（200など）で指定
- 決して`height="100%"`を使用しない（親の高さが不定の場合）

**検出:**
- モバイル（375px幅）でグラフが正しく表示されるか
- Chrome DevToolsでResponsiveContainerの寸法を確認

---

### Pitfall 2: アニメーションとprefers-reduced-motionの競合

**何が問題になる:**
光感受性のあるユーザーにアニメーションが強制され、めまいや不快感を引き起こす。

**なぜ起こる:**
- RechartsのLineやBarはデフォルトでアニメーション有効
- 現在のコードに`isAnimationActive={false}`の設定がない
- v1.6.1でBGMプレイヤーにアニメーション制御を追加したが、グラフには未適用

**結果:**
- アニメーション回避設定のユーザーにグラフ描画アニメーションが表示される
- 特に複合グラフ（Bar + Line）で2重のアニメーションが発生
- アクセシビリティ標準（WCAG 2.1, Success Criterion 2.3.3）違反

**予防:**
```tsx
// 検出と制御
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

<ComposedChart data={weeklyData}>
  <Bar
    yAxisId="left"
    dataKey="sessions"
    fill="#22c55e"
    name="セッション数"
    isAnimationActive={!prefersReducedMotion}
  />
  <Line
    yAxisId="right"
    type="monotone"
    dataKey="cumulativeMinutes"
    stroke="#22c55e"
    strokeWidth={2}
    name="累積時間(分)"
    isAnimationActive={!prefersReducedMotion}
  />
</ComposedChart>
```

- グローバルな`prefers-reduced-motion`フックを実装
- 全てのRechartsコンポーネントで`isAnimationActive`を制御
- デフォルトでアニメーション無効を検討

**検出:**
- Chrome DevToolsでprefers-reduced-motionをエミュレート
- グラフ描画時にアニメーションが無効化されているか確認

---

### Pitfall 3: 色コントラスト不足による視認性低下

**何が問題になる:**
背景色とグリーン（#22c55e）のコントラストが不足し、データが読めない。

**なぜ起こる:**
- 現在の実装では`fill="#22c55e"`と`stroke="#22c55e"`の固定色を使用
- カスタムテーマやダークモードで背景色が変わる場合にコントラスト比が低下
- グラフの背景色と前景色の組み合わせを検証していない

**結果:**
- 薄い背景色でバーとラインが見えない
- WCAG AA基準（3:1）を満たさない
- 視覚障害のあるユーザーがデータを解釈できない

**予防:**
```tsx
// テーマ対応の色を使用
const chartColor = 'var(--cf-primary)' // CSS変数経由でテーマ色を取得

<Bar fill={chartColor} />
<Line stroke={chartColor} />

// または明度調整
const getAccessibleColor = (baseColor: string) => {
  // 背景色に応じて明るさを調整
  return adjustBrightness(baseColor, backgroundBrightness)
}
```

- CSS変数経由で色を取得（テーマ対応）
- 複数の背景色パターンでコントラストを検証
- WebAIM Contrast Checkerなどのツールで確認

**検出:**
- 複数のテーマ/背景色でグラフを表示
- コントラスト比が3:1以上であることを確認

## Moderate Pitfalls

機能制限やUX低下を引き起こす落とし穴。

### Pitfall 4: 日付フォーマットの国際化非対応

**何が問題になる:**
英語圏ユーザーに "Today" や "Mon" がハードコードされ、ロケールに合わせて変更されない。

**なぜ起こる:**
- 現在のコードで`getDayLabel()`関数が英語の曜日名を返す
- `toLocaleDateString()`や`Intl.DateTimeFormat`を使用していない
- グローバルなロケール設定がない

**結果:**
- 日本語ユーザーに英語曜日が表示される
- ヨーロッパ形式（DD/MM/YYYY）のユーザーに混乱を引き起こす
- RTL言語（アラビア語など）でレイアウト崩れ

**予防:**
```tsx
// ロケール対応の曜日ラベル
function getDayLabel(dateStr: string, locale: string = 'ja'): string {
  const date = new Date(dateStr)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  if (isToday) {
    return locale === 'ja' ? '今日' : 'Today'
  }

  return date.toLocaleDateString(locale, { weekday: 'short' })
}
```

- ユーザーのロケール設定を取得
- `Intl.DateTimeFormat`でフォーマット
- RTLレイアウトを考慮（必要に応じてCSS `direction: rtl`）

**検出:**
- ブラウザ言語設定を変更して表示確認
- 日本語、英語、その他言語で曜日フォーマットを検証

---

### Pitfall 5: データ追加時の不要な再レンダリング

**何が問題になる:**
新しいセッションが追加されるたびに、週次データが再計算され、グラフ全体が再レンダリングされる。

**なぜ起こる:**
- 週次データ（`weeklyData`）がコンポーネントのレンダリングごとに再計算
- `sessions`が変更されるたびに全データを再集計
- `useMemo`でデータ計算をメモ化していない

**結果:**
- セッション追加時のレンダリングが遅延する
- デバイスのパフォーマンスによってはカクつきが発生
- 将来的にデータが増えた場合に顕著化

**予防:**
```tsx
// データ計算をメモ化
const weeklyData = useMemo(() => {
  const data: WeeklyData[] = []
  let cumulativeTotal = 0

  for (let i = 6; i >= 0; i--) {
    // ... 計算ロジック
  }

  return data
}, [sessions]) // sessionsが変更された時のみ再計算
```

- `useMemo`でデータ集計をメモ化
- 複雑な計算を分離し、依存配列を最適化
- 大量データの場合はデータのウィンドウイングを検討

**検出:**
- React DevTools Profilerでレンダリング回数を確認
- セッション追加時のレンダリング時間を計測

## Minor Pitfalls

軽微な問題やエッジケース。

### Pitfall 6: ツールチップのアクセシビリティ不足

**何が問題になる:**
スクリーンリーダーがツールチップの内容を読み上げない。

**なぜ起こる:**
- RechartsのデフォルトTooltipにARIA属性がない
- カスタムTooltipでアクセシビリティ対応が不足

**結果:**
- 視覚障害者がグラフのデータポイントを正確に把握できない
- キーボード操作でツールチップが表示されない

**予防:**
```tsx
const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload?.length) return null

  return (
    <div
      className="custom-tooltip"
      role="tooltip"
      aria-label={`データ: ${payload[0].value}`}
    >
      {/* ツールチップ内容 */}
    </div>
  )
}

<Tooltip content={<CustomTooltip />} />
```

- カスタムTooltipで`role="tooltip"`を追加
- `aria-label`でデータ内容を説明
- キーボードフォーカスでツールチップが表示されるように

**検出:**
- スクリーンリーダーでグラフにアクセス
- キーボードのみでデータポイントを操作

---

### Pitfall 7: 曜日順序のハードコーディング

**何が問題になる:**
日曜始まりに変更する際、配列インデックスの計算ミスで曜日がずれる。

**なぜ起こる:**
- 現在のコード：`const dayIndex = (date.getDay() + 6) % 7`（月曜始まり）
- 日曜始まりに変更時のインデックス計算が複雑
- 曜日配列の順序変更漏れ

**結果:**
- 日曜始まりに変更後、曜日が1日ずれる
- 週の境界が正しく表示されない
- ユーザーがデータを誤解する

**予防:**
```tsx
// 日曜始まりの実装
function getDayLabel(dateStr: string, locale: string = 'ja'): string {
  const date = new Date(dateStr)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  if (isToday) {
    return locale === 'ja' ? '今日' : 'Today'
  }

  // 日曜始まり：getDay()は日曜=0〜土曜=6を返す
  const days = locale === 'ja'
    ? ['日', '月', '火', '水', '木', '金', '土']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return days[date.getDay()]
}
```

- `getDay()`の戻り値を直接使用（日曜始まり）
- 曜日配列の順序を日曜から開始
- 複数のロケールでテスト

**検出:**
- 日曜日のデータを表示して曜日ラベルが"Sun"または"日"であることを確認
- 週の境界（土曜→日曜）でデータが正しく表示されることを確認

## Phase-Specific Warnings

| フェーズ | トピック | 想定される落とし穴 | 軽減策 |
|---------|---------|-------------------|--------|
| デザイン改善 | レスポンシブ対応 | モバイルでグラフが潰れる | Flexbox `min-h-0`パターン維持、複数ブレイクポイントでテスト |
| デザイン改善 | 色のコントラスト | テーマ変更で見えなくなる | CSS変数経由で色取得、コントラスト比検証 |
| アニメーション | reduced-motion | アニメーションが強制される | `isAnimationActive`プロパティで制御 |
| パフォーマンス | データ計算 | セッション追加時に遅延 | `useMemo`でメモ化、Profilerで検証 |
| 国際化 | 曜日フォーマット | 英語固定でロケール無視 | `Intl.DateTimeFormat`を使用、複数ロケールでテスト |

## Confidence Assessment

| 領域 | 信頼度 | 理由 |
|------|--------|------|
| レスポンシブデザイン | HIGH | 既存コードと一般的なFlexboxパターンに基づく |
| アクセシビリティ（アニメーション） | HIGH | WCAGガイドラインと既存のBGMプレイヤー実装に基づく |
| アクセシビリティ（色コントラスト） | MEDIUM | 一般的なWCAG基準に基づくが、具体的なテーマ色での検証が必要 |
| パフォーマンス | MEDIUM | 一般的なReact最適化パターンに基づくが、実際のデータ量での測定が必要 |
| 国際化 | MEDIUM | 一般的なロケール対応パターンに基づくが、RTL言語での検証が必要 |
| 曜日順序 | HIGH | JavaScript Date APIと既存コードに基づく |

## Sources

- [Recharts Documentation](https://recharts.org/) — 公式ドキュメント（HIGH confidence）
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) — アクセシビリティ基準（HIGH confidence）
- [MDN Web Docs - Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) — 国際化API（HIGH confidence）
- 既存コードベース: `src/components/stats/StatsCard.tsx` — 現在の実装（HIGH confidence）
- PROJECT.md — プロジェクトコンテキストとv1.6.1のアニメーション実装（HIGH confidence）

## Notes

- 検索エンジンのレート制限により、WebSearchからの情報取得が制限された
- 主に既存コードの分析と一般的なデータ可視化ベストプラクティスに基づいて作成
- 実装フェーズでは実際のデバイスとブラウザでの検証が必要
- 特に色コントラストと国際化はユーザーテストでの確認を推奨
