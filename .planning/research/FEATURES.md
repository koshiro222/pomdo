# Feature Research

**Domain:** Pomodoro + ToDo アプリ
**Researched:** 2026-03-21
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 基本タイマー機能（25分作業/5分休憩） | Pomodoroテクニックの標準 | LOW | 既存実装済み |
| タスク管理（CRUD） | ToDoアプリの基本機能 | LOW | 既存実装済み |
| タスクとタイマーの連携 | タスクを選択してタイマー実行 | MEDIUM | selectedTaskで既存実装だがUX改善が必要 |
| 今日の統計（集中時間・完了セッション数） | ユーザーが進捗を確認するため | MEDIUM | v1.2で実装予定 |
| 週次・月次統計表示 | 長期傾向の把握に必要 | MEDIUM | v1.2で実装予定 |
| 基本的なグラフ表示（棒グラフ・折れ線グラフ） | データの視覚的把握 | MEDIUM | Chart.jsやRechartsを使用 |
| BGM再生機能 | 集中力向上のための定番機能 | LOW | 既存実装済み |
| レスポンシブデザイン | モバイル/デスクトップ両対応 | HIGH | v1.2で改善予定 |
| カスタムタイマー設定 | ユーザーによって最適時間は異なる | LOW | 既存実装済み |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| ゲストモード（localStorage） | 登録なしで即座に利用開始 | MEDIUM | 既存実装済み、競合では rare |
| BGMとタイマーの統合UI | 切替不要なシームレスな体験 | MEDIUM | 既存実装済み |
| 年次レポート・長期統計 | 1年間の傾向把握、達成感 | HIGH | ForestやPomofocusが提供 |
| CSVエクスポート | データの所有権、外部分析 | MEDIUM | Pomofocusが実装 |
| ゲーミフィケーション（木を育てるなど） | モチベーション維持 | HIGH | Forestの独自性 |
| Webhook連携 | 他サービスとの統合 | HIGH | Pomofocusが実装 |
| プロジェクト別統計 | 作業分野ごとの時間配分分析 | MEDIUM | Todoist・Pomofocusが実装 |
| 年間カレンダーヒートマップ | GitHub Contribution風の可視化 | MEDIUM | Flowna等で実装例 |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| リアルタイムチーム機能 | チーム作業の進捗把握 | WebSocket等のコスト増、Edge Runtimeで複雑 | 非リアルタイムの共有統計 |
| 過度な通知機能 | 作業合図を知らせたい | 通知疲れ、集中力阻害 | 必最低限の通知のみ |
| 複雑な目標設定機能 | SMART目標管理等 | 設定コスト高、実際には使われない | シンプルな完了タスク数 |
| 多数のグラフ種類 | データを多角的に見たい | 開発コストに見合わず、混乱の元 | 基本的な2-3種類のみ |
| ソーシャル機能（フォロー等） | 競争してモチベーション | プライバシー懸念、スコープ増大 | 個人統計に集中 |

## Feature Dependencies

```
[基本タイマー機能]
    └──requires──> [タスク管理機能]
                       └──enhances──> [タスクとタイマーの連携（selectedTask）]
                                          └──requires──> [統計データ収集]

[統計データ収集]
    └──requires──> [ローカルストレージまたはDB永続化]
                       └──enables──> [今日の統計]
                                      └──requires──> [グラフ表示ライブラリ]
                                                     └──enhances──> [週次・月次統計]

[BGM再生機能]
    ──independent──> [他の全機能]

[ゲストモード]
    └──requires──> [localStorage実装]
                       └──requires──> [ログイン時データマイグレーション]

[プロジェクト別統計]
    └──requires──> [タスクのプロジェクト/カテゴリ分類]
                       └──requires──> [統計データのフィルタリング]
```

### Dependency Notes

- **基本タイマー機能 requires タスク管理機能**: タイマー単体では価値が低く、タスクと紐づけることで意味がある
- **タスクとタイマーの連携 enhances 基本機能**: 現在のselectedTaskはUX改善が必要だが、概念自体は競合でも標準
- **統計データ収集 requires 永続化**: v1.2ではlocalStorageのみ、将来はDB連携予定
- **グラフ表示ライブラリ requires 統計データ**: RechartsやChart.js導入で可視化
- **プロジェクト別統計 requires タスク分類**: タグやカテゴリ機能が前提

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **基本タイマー機能** — 25分作業/5分休憩の標準Pomodoro
- [x] **タスク管理（CRUD）** — シンプルなToDoリスト
- [x] **BGM再生機能** — 集中音楽の提供
- [x] **ゲストモード** — 登録なしで利用開始
- [x] **Google OAuth認証** — データ永続化のため

### Add After Validation (v1.x)

Features to add once core is working.

- [x] **管理者機能** — BGMトラック管理、ユーザー管理（v1.0）
- [x] **favicon** — ブランドアイコン（v1.1）
- [ ] **Stats機能** — 今日/週/月の統計、グラフ表示（v1.2）
- [ ] **レスポンシブ対応改善** — 要素重なり解消（v1.2）
- [ ] **selectedTask UX改善** — タスク選択体験の向上（v1.2）
- [ ] **タイマー余白調整** — レイアウト最適化（v1.2）

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **プロジェクト別統計** — タグ/カテゴリ機能実装後
- [ ] **年次レポート** — 長期ユーザー向けの価値
- [ ] **CSVエクスポート** — データポータビリティ
- [ ] **Webhook連携** — 他サービス統合
- [ ] **有料プラン（Premium BGM）** — tierフィールド活用

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Stats機能（基本統計） | HIGH | MEDIUM | P1 |
| レスポンシブ対応改善 | HIGH | HIGH | P1 |
| selectedTask UX改善 | MEDIUM | MEDIUM | P1 |
| タイマー余白調整 | MEDIUM | LOW | P2 |
| グラフ表示（複数種類） | MEDIUM | MEDIUM | P2 |
| プロジェクト別統計 | MEDIUM | HIGH | P3 |
| 年次レポート | LOW | HIGH | P3 |
| CSVエクスポート | LOW | MEDIUM | P3 |
| Webhook連携 | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.2
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Todoist | Forest | Pomofocus | Our Approach |
|---------|---------|---------|-----------|--------------|
| 基本タイマー | ✓ | ✓ | ✓ | ✓ 既存 |
| タスク管理 | ✓（高機能） | △（シンプル） | ✓ | ✓ 既存 |
| 統計表示 | ✓（エスト機能） | ✓（木の成長） | ✓（日/週/月/年） | 🔄 v1.2で実装 |
| グラフ種類 | 棒グラフ | 視覚的森林 | 棒・折れ線 | 基本的な2種類予定 |
| タスク連携 | 見積もり機能 | 自動記録 | 選択可能 | 🔄 selectedTask改善予定 |
| エクスポート | CSV | 有料版のみ | CSV | 将来検討 |
| ゲストモード | ✗ | ✗ | ✗ | ✓ 差別化ポイント |
| BGM統合 | ✗ | ✗ | ✗ | ✓ 差別化ポイント |
| レスポンシブ | ✓ | ✓ | ✓ | 🔄 v1.2で改善 |
| カスタムタイマー | ✓ | ✓ | ✓ | ✓ 既存 |

## v1.2 Focus: Stats & UX改善

### Stats機能必要項目

**必須（Table Stakes）:**
- 今日の統計（集中時間・完了セッション数）
- 週次統計（過去7日間の推移）
- 月次統計（過去30日間の推移）
- 基本的なグラフ表示（棒グラフ：日別比較、折れ線グラフ：推移）

**実装方法:**
- データ永続化：localStorage（v1.2制約）
- グラフライブラリ：Recharts（React・Tailwindとの親和性高）
- 記録内容：セッション完了時の時間・日時・関連タスク

**競合調査に基づく推奨事項:**
- Pomofocus：日/週/月/年の4つの期間ビュー
- Forest：視覚的な木の成長で達成感
- Todoist：エスト機能と実績の比較

**v1.2実装範囲:**
- 日次・週次・月次ビュー
- 棒グラフ（日別セッション数）
- 折れ線グラフ（累積集中時間）
- 簡易的な数値表示（今日の完了数・累積時間）

### selectedTask UX改善

**現状の課題:**
- UX的に微妙（PROJECT.mdより）
- タスク選択のフローが不明確

**競合のパターン（Pomofocus参考）:**
- タスクリストから直接選択可能
- 選択中のタスクがハイライト
- タイマー横に現在のタスク表示
- セッション完了時に次のタスクを提案

**改善案:**
1. タスクリストの各行に「このタスクで作業」ボタン
2. 選択中のタスクを目立つスタイルで表示
3. タイマー近接に選択タスクを表示（現在のセッション対象）
4. セッション完了後に完了確認ダイアログ

**削除も検討すべき理由:**
- Forestのように自動記録のアプローチも有効
- 手動選択がユーザー負担になっている場合

### タイマー余白調整

**現状の課題:**
- タイマー部分の余白が大きすぎる（PROJECT.mdより）
- 両サイドの無駄な余白

**競合のレイアウトパターン:**
- Pomofocus：タイマーを中央に配置、左右にバランスよく配置
- Forest：タイマーを大きく表示、周囲に適度な余白
- Todoist：タイマーをコンパクトに、機能性重視

**推奨アプローチ:**
- Tailwindのspacing utilitiesで余白最適化
- タイマー幅のmax-width設定
- モバイルでは余白削減、デスクトップでは適度な余白
- グリッドデザイン統一に合わせて調整

### グリッドデザイン統一

**現状の課題:**
- 各グリッドに統一感がない（PROJECT.mdより）

**推奨アプローチ:**
- Tailwindのgrid system使用
- 一貫したgapサイズ（例：gap-4）
- レスポンシブなgrid-cols（1列→2列→3列）
- カードコンポーネントで統一感あるデザイン

## Sources

### 競合製品分析
- **Todoist**: https://todoist.com/ja/productivity-methods/pomodoro - Pomodoroテクニックと統合機能
- **Forest**: https://www.forestapp.cc/ - ゲーミフィケーションアプローチ
- **Pomofocus**: https://pomofocus.io/app - 統計機能（日/週/月/年）、CSVエクスポート、Webhook連携
- **Flowna**: https://flowna.com - ドメイン販売ページ（参考にならず）

### コンフィデンスレベル
- **Stats機能**: HIGH - 複数競合で共通して実装
- **selectedTask UX**: MEDIUM - Pomofocusのパターンは参考になるが、削除案も検討が必要
- **タイマー余白**: MEDIUM - 競合のレイアウト調査に基づく推奨
- **グラフライブラリ**: HIGH - RechartsはReact・Next.jsエコシステムで標準的

### 調査の制約
- Web Search APIが利用できなかったため、webReaderで直接競合サイトを確認
- 一部サイト（TickTick、Notion）でネットワークエラーにより取得不可
- BRAVE_API_KEYが未設定のためBrave Searchは未使用

---
*Feature research for: Pomodoro + ToDo*
*Researched: 2026-03-21*
