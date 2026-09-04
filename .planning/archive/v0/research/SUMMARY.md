# Project Research Summary

**Project:** Pomdo v1.6.2 Statsカードデザイン改善
**Domain:** 統計グラフ改善（既存アプリへの改良）
**Researched:** 2026-03-27
**Confidence:** HIGH

## Executive Summary

PomdoのStatsカードグラフ改善は、既存のRecharts 3.8.0を使用した改良プロジェクトです。追加ライブラリは不要で、Rechartsの標準機能でサイズ調整、余白、ラベル、色のカスタマイズが可能です。専門家はデータ可視化において「シンプルさ」と「正確性」を重視し、過度な装飾や3D効果は避けるべきであるとしています。

推奨されるアプローチは、3段階のフェーズで改善を行うことです。まず曜日表示を日曜始まりに変更（データロジック修正）、次にグラフ設定の改善（余白、軸スタイル、ツールチップ）、最後にレスポンシブ対応を強化します。主要なリスクは、レスポンシブデザインの破綻（モバイルでグラフが潰れる）、アクセシビリティ不足（アニメーションと色コントラスト）、国際化対応の不備です。これらは`prefers-reduced-motion`の制御、CSS変数によるテーマ対応、`Intl.DateTimeFormat`の使用で軽減可能です。

## Key Findings

### Recommended Stack

追加ライブラリは不要です。既存のRecharts 3.8.0で全機能が実現可能です。

**Core technologies:**
- **Recharts 3.8.0**: グラフ描画 — Reactネイティブで軽量、宣言的API。既に導入済みでv3.8+は高度なカスタマイズ機能を備える
- **React 19.2.0**: UIフレームワーク — 既存コードベース
- **TypeScript 5.9.3**: 型安全 — 既存コードベース
- **Tailwind CSS 4.2.1**: スタイリング — 既存コードベース

Recharts 3.8.0の標準機能で実現可能な改善点：
- グラフサイズ調整：`ResponsiveContainer`の`width`/`height`/`minHeight`
- 余白調整：`ComposedChart`の`margin`プロパティ
- 軸ラベル改善：`XAxis`/`YAxis`の`tick`/`tickMargin`/`fontSize`
- 色のカスタマイズ：`Bar`/`Line`の`fill`/`stroke`プロパティ
- 日曜始まり表示：データ配列の順序調整（ロジック側で対応）

### Expected Features

**Must have (table stakes):**
- **曜日ラベルの表示** — グラフの軸が何を表しているか理解するために必要
- **余白とパディングの適切さ** — グラフ要素が窮屈だと読みにくい
- **カラーコントラスト** — データが視認できないと意味がない
- **ホバー時のツールチップ** — 正確な数値を確認するために必要
- **レスポンシブ対応** — モバイルとデスクトップ両方で見る必要がある

**Should have (competitive):**
- **日曜始まりの曜日表示** — 日本のカレンダー文化（日曜始まり）に合わせる
- **複合チャート（Bar + Line）** — 1つのグラフで2つの指標を同時に把握できる（既に実装済み）
- **タブ切り替え（Today/Week/Month）** — 異なる時間軸で同じデータを素早く確認できる（既に実装済み）
- **空状態のデザイン** — データがない時も混乱させない親切なUI（既に実装済み）

**Defer (v2+):**
- **3Dグラフ** — データの歪み、可読性低下、パフォーマンス悪化の原因
- **過度なアニメーション** — 気分の悪さ、データの追跡困難、アクセシビリティ低下
- **多数のデータ系列** — 情報過多、主要なインサイトが見えなくなる
- **複雑なツールチップ** — ホバー時の認知負荷増加

### Architecture Approach

Statsカードの改善は既存の`StatsCard.tsx`単一ファイル内で完結します。新規ファイルは不要です。データフローは`usePomodoro` → `sessions` → `weeklyData`で変更ありません。

**Major components:**
1. **StatsCard.tsx** — 統計UIのレンダリング、タブ管理、データ集計
2. **usePomodoro Hook** — セッションデータの取得・保存・同期
3. **getDayLabel()** — 曜日ラベルの生成（日曜始まり対応）
4. **ComposedChart** — 週間統計のグラフ描画

改善パターンは3段階です。まず`getDayLabel`関数を修正（曜日配列を日曜始まりに変更、計算ロジック簡素化）。次に`ComposedChart`のpropsを追加（margin, axisLine, tickLine等）で見た目を改善。最後に`ResponsiveContainer`の高さを`100%`に変更し、親コンテナに`flex-1 min-h-[200px]`を追加してレスポンシブ対応を強化します。

### Critical Pitfalls

1. **レスポンシブコンテナの親要素サイズ不足** — モバイルでグラフが潰れるのを防ぐため、`flex-1` + `min-h-0`の組み合わせを維持し、グラフの高さを固定値（200など）で指定する
2. **アニメーションとprefers-reduced-motionの競合** — `isAnimationActive={!prefersReducedMotion}`で制御し、光感受性ユーザーに配慮する
3. **色コントラスト不足による視認性低下** — CSS変数経由で色を取得（テーマ対応）し、複数の背景色パターンでコントラストを検証する
4. **日付フォーマットの国際化非対応** — `Intl.DateTimeFormat`でフォーマットし、ユーザーのロケール設定を取得する
5. **データ追加時の不要な再レンダリング** — `useMemo`でデータ集計をメモ化し、セッション変更時のみ再計算する

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: 曜日表示修正（日曜始まり対応）
**Rationale:** データ変更はUI変更よりも影響範囲が大きいため、最初に検証する必要がある
**Delivers:** 日曜始まりの曜日ラベル表示
**Addresses:** 日本のカレンダー文化に合わせる（Table Stakes）
**Avoids:** 曜日順序のハードコーディングによるインデックス計算ミス

### Phase 2: グラフ設定改善
**Rationale:** データが正しい状態であれば、UI調整は安全に反復可能
**Delivers:** 余白調整、軸スタイリング、ツールチップ改善、グリッドライン追加
**Uses:** Recharts ComposedChartのmargin, XAxis/YAxisスタイル, Tooltipカスタマイズ
**Implements:** 視覚的な読みやすさ向上（Table Stakes + Differentiators）

### Phase 3: レスポンシブ対応強化
**Rationale:** 最後にレスポンシブ挙動を調整することで、他の変更に影響されない
**Delivers:** モバイルとデスクトップ両方での最適表示
**Addresses:** レスポンシブ対応（Table Stakes）
**Avoids:** 親要素サイズ不足によるレイアウト崩れ

### Phase 4: アクセシビリティ対応
**Rationale:** アニメーション制御と色コントラストは、基本機能完成後の品質向上フェーズで実装
**Delivers:** prefers-reduced-motion対応、テーマ対応の色設定
**Uses:** CSS変数、メディアクエリ
**Avoids:** アニメーションによるアクセシビリティ低下、色コントラスト不足

### Phase Ordering Rationale

- 曜日表示を最初に修正する理由：データロジックの変更が最も影響範囲が大きく、UI変更前の正確性を担保する必要があるため
- グラフ設定を次に行う理由：データが正しい状態であれば、視覚的な調整は安全に反復可能で、フィードバックループを回しやすい
- レスポンシブ対応を後に行う理由：他の変更による影響を受けず、最終的なレイアウト確認ができる
- アクセシビリティ対応を最後に行う理由：基本機能完成後の品質向上として、追加の複雑さを導入しない

この順序で行うことで、アーキテクチャパターン（データ→UI→レスポンシブ→品質）に従い、各段階での落とし穴を回避できます。

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4（アクセシビリティ対応）:** 複雑な統合、CSS変数のテーマ対応でのコントラスト検証が必要

Phases with standard patterns (skip research-phase):
- **Phase 1（曜日表示修正）:** よく文書化されたDate APIパターン、既存コードでの実装経験あり
- **Phase 2（グラフ設定改善）:** Recharts公式ドキュメントで完全にサポートされている標準機能
- **Phase 3（レスポンシブ対応強化）:** FlexboxとResponsiveContainerの確立されたパターン

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | 型定義ファイルから直接検証。Recharts 3.8.0の全機能を確認 |
| Features | MEDIUM | 一般的なデータ可視化ベストプラクティスに基づくが、ウェブ検索はレートリミットにより実行不可 |
| Architecture | HIGH | 既存コードベースとRechartsパターンに基づく |
| Pitfalls | MEDIUM | 既存コード分析と一般的な落とし穴に基づくが、実際のデバイスでの検証が必要 |

**Overall confidence:** HIGH

### Gaps to Address

- **曜日フォーマットの国際化:** 現在は英語略称（Sun/Mon...）で固定。将来的には`Intl.DateTimeFormat`でのロケール対応が必要だが、v1.6.2では日本向けに固定で問題なし
- **色コントラストの具体的な検証:** CSS変数`var(--cf-primary)`が全テーマでWCAG AA基準（3:1）を満たすか、実際のテーマでの検証が必要
- **モバイル環境での最適なグラフ高さ:** 現在は`height={200}`を推奨しているが、様々なデバイスでの検証が必要

## Sources

### Primary (HIGH confidence)
- Recharts公式ドキュメント: https://recharts.org — ComposedChart, XAxis, YAxis, Bar, Line, Tooltip, ResponsiveContainer
- Recharts Type Definitions (node_modules/recharts/types/) — v3.8.0のローカル型定義ファイル
- 既存コードベース: src/components/stats/StatsCard.tsx — 現在の実装
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/ — アクセシビリティ基準

### Secondary (MEDIUM confidence)
- ISO 8601標準: https://www.iso.org/standard/70907.html — 週の始まりに関する国際標準
- MDN Web Docs - Date.getDay(): https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDay — 曜日インデックスの取得
- MDN Web Docs - Intl.DateTimeFormat: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat — 国際化API

### Tertiary (LOW confidence)
- 日本のカレンダーにおける日曜始まりの割合 — 推定では80%以上だが、具体的な統計データの検証が必要
- モバイル環境での最適なグラフ高さ — デバイスごとの検証が必要

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
