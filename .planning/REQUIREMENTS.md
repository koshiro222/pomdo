# Requirements: Pomdo

**Defined:** 2026-03-21
**Core Value:** ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

## v1.3 Requirements

UI/UXレビュー結果に基づくアクセシビリティと品質改善。

### A11Y (Accessibility)

- [x] **A11Y-01**: ユーザーはWCAG AA基準（4.5:1）を満たすカラーコントラストでテキストを読める
- [x] **A11Y-02**: ユーザーはキーボード操作時に明確なfocusスタイルを確認できる
- [x] **A11Y-03**: ユーザーはドラッグハンドルをキーボードなしで認識できる（常時表示）
- [x] **A11Y-04**: ユーザーは適切なサイズのアイコンボタンを操作できる（ARIAラベル最適化）

### TOUCH

- [ ] **TOUCH-01**: ユーザーは44px以上のタッチターゲットで操作できる
- [ ] **TOUCH-02**: ユーザーは全ての対話要素にカーソルポインターを確認できる

### RESP (Responsive)

- [ ] **RESP-06**: ユーザーはモバイルでオーバーフローなしにコンテンツを閲覧できる
- [ ] **RESP-07**: ユーザーは小さい画面で圧迫感なくアルバムアートを表示できる

### ANIM (Animation)

- [ ] **ANIM-01**: ユーザーは設定した場合にアニメーションを抑制できる（prefers-reduced-motion）
- [ ] **ANIM-02**: ユーザーは滑らかな60fpsアニメーションを体験できる（reflow回避）

### CONS (Consistency)

- [ ] **CONS-01**: ユーザーは全てのボタンで統一されたスタイルを確認できる
- [ ] **CONS-02**: ユーザーは全ての対話要素で統一されたホバー効果を確認できる

---

## v1.2 Requirements (Shipped)

UI/UX改善のための要件。レスポンシブ対応、Stats機能実装、グリッドデザイン統一。

### レスポンシブ対応

- [x] **RESP-01**: 全画面サイズで要素が重ならない
- [x] **RESP-02**: 一貫したスクロール挙動（overflow設定統一）
- [x] **RESP-03**: 適切なブレイクポイント設定
- [x] **RESP-04**: Framer Motionのlayout propによるレイアウトシフトを解消
- [x] **RESP-05**: タイマー部分の余白調整（二重パディング解消）

### Stats機能

- [x] **STAT-01**: 今日の統計表示（集中時間・セッション数）
- [x] **STAT-02**: 週次統計表示
- [x] **STAT-03**: 月次統計表示
- [x] **STAT-04**: 棒グラフ表示（日別セッション数）
- [x] **STAT-05**: 折れ線グラフ表示（累積集中時間）
- [x] **STAT-06**: ローディング状態の表示
- [x] **STAT-07**: 空状態の表示（データがない場合）
- [x] **STAT-08**: データ更新時の再描画（useEffect依存配列修正）

### グリッド統一

- [x] **GRID-01**: 統一感のあるカードデザイン（BentoCard共通コンポーネント）
- [x] **GRID-02**: 一貫したガターサイズ（gap-4: 16px）
- [x] **GRID-03**: 一貫したスペーシング（spacing scale定義と適用）
- [x] **GRID-04**: グリッドシステムの論理的不整合修正（col-span合計をグリッド列数に合わせる）

## v1.4+ Requirements

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

### v1.3 Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| A11Y-01 | Phase 11 | Complete |
| A11Y-02 | Phase 11 | Complete |
| A11Y-03 | Phase 11 | Complete |
| A11Y-04 | Phase 11 | Complete |
| TOUCH-01 | Phase 12 | Pending |
| TOUCH-02 | Phase 12 | Pending |
| RESP-06 | Phase 12 | Pending |
| RESP-07 | Phase 12 | Pending |
| ANIM-01 | Phase 13 | Pending |
| ANIM-02 | Phase 13 | Pending |
| CONS-01 | Phase 13 | Pending |
| CONS-02 | Phase 13 | Pending |

**Coverage (v1.3):**
- v1.3 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

### v1.2 Traceability (Complete)

| Requirement | Phase | Status |
|-------------|-------|--------|
| RESP-01 | Phase 08 | Complete |
| RESP-02 | Phase 08 | Complete |
| RESP-03 | Phase 08 | Complete |
| RESP-04 | Phase 08 | Complete |
| RESP-05 | Phase 08 | Complete |
| STAT-01 | Phase 09 | Complete |
| STAT-02 | Phase 09 | Complete |
| STAT-03 | Phase 09 | Complete |
| STAT-04 | Phase 09 | Complete |
| STAT-05 | Phase 09 | Complete |
| STAT-06 | Phase 09 | Complete |
| STAT-07 | Phase 09 | Complete |
| STAT-08 | Phase 09 | Complete |
| GRID-01 | Phase 10 | Complete |
| GRID-02 | Phase 10 | Complete |
| GRID-03 | Phase 10 | Complete |
| GRID-04 | Phase 10 | Complete |

**Coverage (v1.2):**
- v1.2 requirements: 17 total
- Mapped to phases: 17 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-23 after v1.3 roadmap creation*
