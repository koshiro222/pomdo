# プロジェクト研究要約

**プロジェクト:** Pomdo v1.2 UI/UX改善
**ドメイン:** Pomodoro + ToDo アプリのUI/UX改善
**研究日:** 2026-03-21
**信頼度:** HIGH

## エグゼクティブサマリー

Pomdo v1.2はレスポンシブ対応の改善、Stats機能の実装、グリッドデザインの統一を目的としている。研究の結果、以下の推奨アプローチが明らかになった。

**技術スタック:** React 19 + Tailwind CSS v4 + Recharts の組み合わせが最適。Tailwind CSS v4は既に導入済みで、Container Queriesと自動コンテンツ検出を活用できる。RechartsはReactネイティブで宣言的API、Tree-shinking対応、軽量（圧縮時〜40KB）なグラフライブラリであり、Stats機能に最適。

**アーキテクチャ:** 既存のBento Gridレイアウトを維持しつつ、グリッドシステムの論理的不整合を修正。Custom Hookパターンでデータ永続化（localStorage/tRPCハイブリッド）を管理し、Framer Motionのlayout prop使用を最小限に抑える。

**主要なリスク:** レスポンシブ対応の不備（Framer Motionのlayout propによるレイアウトシフト、overflow設定のブレークポイント不一致）、Statsのデータ取得タイミング（useEffect依存配列の不備）、グリッドシステムのcol-span合計がグリッド列数を超える問題。これらはコード分析で特定された具体的な問題点であり、実装時に必ず対処が必要。

## 主要な発見

### 推奨スタック

既存のReact + TypeScript + Vite + Tailwind CSS v4を継続し、Stats機能のためにRechartsを追加する。

**コア技術:**
- **React 19.2** — UIフレームワーク — 既存採用、最新版で安定
- **Tailwind CSS v4** — レスポンシブ対応 — **既存導入済み、Container Queries対応、自動コンテンツ検出**
- **Recharts 2.15** — Statsグラフ表示 — **Reactネイティブ、宣言的API、Tree-shaking対応、軽量（〜40KB）**
- **Framer Motion 12** — アニメーション — 既存使用中だがlayout propの使用を見直す必要あり

**主要なバージョン要件:**
- 特になし。Rechartsの依存関係（React 16.8+/17/18/19）は既存環境と互換性あり。

### 期待される機能

**必須機能（Table Stakes）:**
- 基本タイマー機能（25分作業/5分休憩） — 既存実装済み
- タスク管理（CRUD） — 既存実装済み
- タスクとタイマーの連携 — 既存実装（selectedTask）だがUX改善が必要
- **今日の統計（集中時間・完了セッション数）** — v1.2で実装
- **週次・月次統計表示** — v1.2で実装
- **基本的なグラフ表示（棒グラフ・折れ線グラフ）** — v1.2で実装
- レスポンシブデザイン — v1.2で改善
- BGM再生機能 — 既存実装済み

**競争力のある機能（Differentiators）:**
- ゲストモード（localStorage） — 既存実装済み、競合ではレア
- BGMとタイマーの統合UI — 既存実装済み
- 年次レポート・長期統計 — v2+で検討
- CSVエクスポート — v2+で検討
- プロジェクト別統計 — v2+で検討

**延期（v2+）:**
- プロジェクト別統計 — タグ/カテゴリ機能実装後
- 年次レポート — 長期ユーザー向けの価値
- CSVエクスポート — データポータビリティ
- Webhook連携 — 他サービス統合
- ゲーミフィケーション（木を育てる等） — 開発コスト高

### アーキテクチャアプローチ

Bento Gridレイアウト（12列グリッドシステム）をベースに、Custom Hookパターンで状態管理とデータ永続化を分離する。プレゼンテーションレイヤー（TimerWidget、TodoList、StatsCard、BgmPlayer）→ Custom Hooks（useTimer、useTodos、usePomodoro）→ データレイヤー（localStorage/tRPC）の3層構造。

**主要コンポーネント:**
1. **App.tsx** — Bento Gridレイアウト、ブレイクポイント管理
2. **TimerWidget** — タイマー表示、コントロール
3. **StatsCard** — 週次統計、グラフ表示
4. **TodoList** — タスク一覧、フィルター
5. **BgmPlayer** — 音楽再生、プレイリスト
6. **usePomodoro** — セッション管理、localStorage/DB切り替え
7. **useLocalStorage** — ローカルデータ永続化

### 重要な落とし穴

1. **Framer Motionのlayout propによるレイアウトシフト** — layout propを全要素で使用すると、レスポンシブ変更時に複数の要素が同時にアニメーションし、競合が発生。解決策：`layout="position"`のみ使用、アニメーション時間を短縮（0.2秒）。

2. **overflowプロパティの不適切な設定** — `main`タグに`overflow-y-auto`、`sm:overflow-hidden`が設定されているため、画面サイズによってスクロール挙動が変わる。解決策：`overflow-y-auto`を統一、`min-h-0`を追加。

3. **Statsのデータ取得タイミングとuseEffect依存配列** — `usePomodoro`フックは非同期でデータを取得するが、初回レンダリング時点では`sessions`が空配列。解決策：`sessions`を依存配列に含める、ローディング状態を表示。

4. **グリッドシステムの論理的不整合** — `sm:grid-cols-6`定義だが、カードのcol-span合計が8列でオーバー。解決策：各ブレイクポイントで合計を計算し、グリッド定義に合わせる。

5. **タイマー部分の余白過多** — TimerDisplayとTimerWidgetで二重にパディングが適用され、タイマーカード内に過剰な余白が発生。解決策：パディングを一箇所に集約。

## ロードマップへの影響

研究に基づき、推奨フェーズ構造：

### Phase 1: レスポンシブ対応修正
**根拠:** 既存UI崩壊を防ぐ最優先事項。レスポンシブ対応が不完全だと、どの画面サイズでも正しく動作確認できない。
**成果:** すべての画面サイズで要素が重ならない、一貫したスクロール挙動
**対応機能:** レスポンシブデザイン（全コンポーネント）
**回避すべき落とし穴:** Framer Motionのlayout propによるレイアウトシフト、overflow設定のブレークポイント不一致

**具体的な作業:**
- App.tsxのグリッド定義を修正（col-span合計をグリッド列数に合わせる）
- Framer Motionのlayout propを`layout="position"`に変更、アニメーション時間を0.2秒に短縮
- overflow設定を統一（`overflow-y-auto`、`min-h-0`追加）
- タイマーの余白調整（二重パディングの解消）

### Phase 2: Stats機能実装
**根拠:** データ取得ロジックの修正が必要。Statsは既存のusePomodoroフックに依存しているため、データ取得と表示ロジックを先に修正。
**成果:** 今日/週次/月次統計、グラフ表示、データ更新時の再描画
**使用スタック:** Recharts（グラフライブラリ）、既存usePomodoroフック
**実装:** StatsCardコンポーネントの拡張、データ集計ロジックの強化

**具体的な作業:**
- Rechartsのインストール（`npm install recharts`）
- StatsCard.tsxで今日/週次/月次統計を集計
- Rechartsで棒グラフ（日別セッション数）、折れ線グラフ（累積集中時間）を実装
- sessionsをuseEffect依存配列に含め、データ更新時に再計算
- ローディング状態と空状態を明示的に実装

### Phase 3: グリッド統一
**根拠:** 視覚的な改善なので、機能修正後に実施。全体的なデザイン一貫性を向上。
**成果:** 統一感のあるBento Gridデザイン、一貫したガターサイズ
**使用スタック:** Tailwind CSS v4、既存コンポーネント
**実装:** BentoCard共通コンポーネントの作成、全カードコンポーネントで統一使用

**具体的な作業:**
- src/components/ui/BentoCard.tsxを作成（共通カードラッパー）
- 全カードコンポーネントでBentoCardを使用
- ガターサイズをgap-4（16px）に統一
- spacing scaleを定義し、全コンポーネントで適用

### Phase 4: selectedTask UX改善
**根拠:** ユーザー体験の向上。機能は実装済みだが、UXが微妙とのフィードバックあり。
**成果:** タスク選択フローの改善、視覚的フィードバックの強化
**実装:** CurrentTaskCard、TodoListのUX改善

**具体的な作業:**
- タスクリストの各行に「このタスクで作業」ボタンを追加
- 選択中のタスクを目立つスタイルで表示
- タイマー近接に選択タスクを表示（現在のセッション対象）
- セッション完了後に完了確認ダイアログを表示
- 選択時にアニメーションでフィードバック

### フェーズ順序の根拠

- **Phase 1（レスポンシブ対応）を最初に:** どの画面サイズでも正しく動作確認するための基盤。これが不完全だと、Phase 2-4の実装で予期せぬUI崩壊が発生。
- **Phase 2（Stats）を次に:** データ取得と表示ロジックの修正は、他の機能に依存していない独立した機能。また、ユーザー価値が高い（今日の統計、週次統計）。
- **Phase 3（グリッド統一）をその次に:** 視覚的な改善なので、機能修正後に実施。また、統一感のあるデザインはUXの向上に寄与。
- **Phase 4（selectedTask UX）を最後に:** 機能は実装済みだが、UX改善は他の改善が完了してからの方が全体像を見渡せる。

### 研究フラグ

計画時に深い研究が必要なフェーズ:
- **Phase 1:** なし — 既存コード分析で具体的な問題点を特定済み、修正パターンも明確
- **Phase 2:** なし — Rechartsの公式ドキュメントが充実、既存usePomodoroフックの問題点も特定済み
- **Phase 3:** なし — Tailwind CSS v4の公式ドキュメントが充実、ベストプラクティスも確立
- **Phase 4:** あり — selectedTaskの有用性をユーザー調査で確認必要。削除案も検討すべき（Forestのように自動記録のアプローチも有効）

標準パターンのフェーズ（研究フェーズをスキップ）:
- **Phase 1:** レスポンシブ対応は確立されたパターンあり
- **Phase 2:** RechartsはReact・Next.jsエコシステムで標準的
- **Phase 3:** Tailwind CSS v4は公式ドキュメントが充実

## 信頼性評価

| 領域 | 信頼度 | 理由 |
|------|--------|------|
| スタック | HIGH | Recharts・Tailwind CSS v4の公式ドキュメントを確認、既存コードベースも分析 |
| 機能 | HIGH | 複数競合（Todoist、Forest、Pomofocus）を分析、共通機能を特定 |
| アーキテクチャ | HIGH | 既存コードベースを詳細分析、具体的な問題点を特定 |
| 落とし穴 | HIGH | 既存コード分析から具体的な問題点を特定、修正パターンも明確 |

**全体の信頼度:** HIGH

### 対処すべきギャップ

- **selectedTaskの有用性:** ユーザー調査で機能の有用性を確認。使われていない場合は削除を検討。保留する場合は、UIで明確に説明を追加。
- **Framer Motionのlayout propの最適な使用パターン:** 公式ドキュメントの詳細な確認が必要（WebFetchの制限により完全な情報取得が困難だったため）
- **Stats表示のパフォーマンス最適化:** 大容量データ時のパフォーマンスについて、より具体的な調査が必要

## 情報源

### 主要（HIGH信頼度）
- Recharts公式ドキュメント — https://recharts.org
- Tailwind CSS v4ドキュメント — https://tailwindcss.com/docs/responsive-design
- 既存コードベースの分析 — `/Users/koshiro/develop/pomdo/src/App.tsx`、`src/components/stats/StatsCard.tsx`、`src/components/timer/TimerDisplay.tsx`

### 二次（MEDIUM信頼度）
- 競合製品分析
  - Todoist — https://todoist.com/ja/productivity-methods/pomodoro
  - Forest — https://www.forestapp.cc/
  - Pomofocus — https://pomofocus.io/app
- Framer Motion — https://www.framer.com/motion/
- Tailwind CSS v4リリースノート — https://tailwindcss.com/blog

### 三次（LOW信頼度）
- 一般的なベストプラクティス — WebSearchがレート制限により結果なし、webReaderで直接競合サイトを確認

---
*研究完了日: 2026-03-21*
*ロードマップ準備完了: はい*
