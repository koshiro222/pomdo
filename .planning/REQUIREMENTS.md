# Requirements: Pomdo

**Defined:** 2026-03-21
**Core Value:** ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

## v1.2 Requirements

UI/UX改善のための要件。レスポンシブ対応、Stats機能実装、グリッドデザイン統一。

### レスポンシブ対応

- [ ] **RESP-01**: 全画面サイズで要素が重ならない
- [ ] **RESP-02**: 一貫したスクロール挙動（overflow設定統一）
- [ ] **RESP-03**: 適切なブレイクポイント設定
- [ ] **RESP-04**: Framer Motionのlayout propによるレイアウトシフトを解消
- [ ] **RESP-05**: タイマー部分の余白調整（二重パディング解消）

### Stats機能

- [ ] **STAT-01**: 今日の統計表示（集中時間・セッション数）
- [ ] **STAT-02**: 週次統計表示
- [ ] **STAT-03**: 月次統計表示
- [ ] **STAT-04**: 棒グラフ表示（日別セッション数）
- [ ] **STAT-05**: 折れ線グラフ表示（累積集中時間）
- [ ] **STAT-06**: ローディング状態の表示
- [ ] **STAT-07**: 空状態の表示（データがない場合）
- [ ] **STAT-08**: データ更新時の再描画（useEffect依存配列修正）

### グリッド統一

- [ ] **GRID-01**: 統一感のあるカードデザイン（BentoCard共通コンポーネント）
- [ ] **GRID-02**: 一貫したガターサイズ（gap-4: 16px）
- [ ] **GRID-03**: 一貫したスペーシング（spacing scale定義と適用）
- [ ] **GRID-04**: グリッドシステムの論理的不整合修正（col-span合計をグリッド列数に合わせる）

## v1.3+ Requirements

将来のリリース向け。現在はスコープ外。

### selectedTask UX改善

- **STASK-01**: 明確な選択フィードバック
- **STASK-02**: タスク選択フローの改善
- **STASK-03**: セッション完了後の自動完了提案

### Stats拡張

- **STAT-EXT-01**: リアルタイム更新（WebSocket等）
- **STAT-EXT-02**: CSVエクスポート
- **STAT-EXT-03**: プロジェクト別統計
- **STAT-EXT-04**: 年次レポート

### ゲーミフィケーション

- **GAME-01**: 木を育てる機能
- **GAME-02**: 実績システム
- **GAME-03**: ストリーク表示

## Out of Scope

| Feature | Reason |
|---------|--------|
| selectedTask UX改善 | v1.2では対象外、v1.3以降で検討 |
| StatsデータのDB永続化 | v1.2ではlocalStorageのみ、DB連携は別Issue |
| リアルタイム更新 | 技術的複雑さ高く、v1.2では対象外 |
| CSVエクスポート | データポータビリティは重要だがv1.2では対象外 |
| プロジェクト別統計 | タグ/カテゴリ機能実装後に検討 |
| 年次レポート | 長期ユーザー向けの価値、v1.3以降で検討 |
| ゲーミフィケーション機能 | 開発コスト高、コア機能優先 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RESP-01 | Phase 08 | Pending |
| RESP-02 | Phase 08 | Pending |
| RESP-03 | Phase 08 | Pending |
| RESP-04 | Phase 08 | Pending |
| RESP-05 | Phase 08 | Pending |
| STAT-01 | Phase 09 | Pending |
| STAT-02 | Phase 09 | Pending |
| STAT-03 | Phase 09 | Pending |
| STAT-04 | Phase 09 | Pending |
| STAT-05 | Phase 09 | Pending |
| STAT-06 | Phase 09 | Pending |
| STAT-07 | Phase 09 | Pending |
| STAT-08 | Phase 09 | Pending |
| GRID-01 | Phase 10 | Pending |
| GRID-02 | Phase 10 | Pending |
| GRID-03 | Phase 10 | Pending |
| GRID-04 | Phase 10 | Pending |

**Coverage:**
- v1.2 requirements: 17 total
- Mapped to phases: 0 ⚠️ (ロードマップ作成時に更新)
- Unmapped: 17 ⚠️

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after v1.2 requirements definition*
