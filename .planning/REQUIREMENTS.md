# Requirements: Pomdo — BGM管理機能追加

**Defined:** 2026-03-20
**Core Value:** 管理者がBGMライブラリを簡単に管理でき、全ユーザーが集中作業に適した音楽を利用できること

## v1 Requirements

BGM管理機能の実装に必要な要件。

### Database

- [x] **DB-01**: bgm_tracks テーブルを作成（id, title, artist, color, filename, tier, createdAt, updatedAt）
- [x] **DB-02**: Drizzleスキーマ定義を作成
- [x] **DB-03**: マイグレーションファイル生成と適用

### Backend API

- [x] **API-01**: tRPC ルーター `bgm` を作成
- [x] **API-02**: `getAll` クエリ — 全トラック取得（tierでフィルタ可能）
- [x] **API-03**: `create` ミューテーション — 管理者のみ、トラック追加
- [ ] **API-04**: `update` ミューテーション — 管理者のみ、トラック更新
- [x] **API-05**: `delete` ミューテーション — 管理者のみ、トラック削除
- [x] **API-06**: R2へのファイルアップロード API
- [x] **API-07**: R2からのファイル削除 API
- [ ] **API-08**: admin ロール判定ミドルウェア

### Frontend - Player

- [ ] **FE-01**: `useBgm` フックをDBから取得するように変更
- [ ] **FE-02**: ハードコードされた `TRACKS` 定数を削除
- [ ] **FE-03**: tRPC `bgm.getAll` でトラック取得
- [ ] **FE-04**: エラーハンドリング（BGM取得失敗時）

### Frontend - Admin UI

- [x] **UI-01**: Headerに管理ボタン（adminロールのみ表示）
- [x] **UI-02**: BGM管理モーダル/ページ
- [ ] **UI-03**: トラック一覧表示（テーブル）
- [ ] **UI-04**: ファイルアップロード機能（ドラッグ＆ドロップ対応）
- [x] **UI-05**: 曲名・アーティスト・色編集フォーム
- [x] **UI-06**: 削除確認ダイアログ
- [ ] **UI-07**: ローディング・エラー状態表示

### Authentication

- [ ] **AUTH-01**: Better Auth で admin ロール設定方法確認
- [x] **AUTH-02**: 管理者判定ロジック実装
- [ ] **AUTH-03**: 非管理者の管理APIアクセスを拒否（TRPCError）

### Testing

- [ ] **TEST-01**: tRPC ルーター単体テスト
- [ ] **TEST-02**: 管理者権限テスト
- [ ] **TEST-03**: R2操作テスト（モック）
- [ ] **TEST-04**: E2E: BGM追加・削除・編集フロー

## v2 Requirements

有料プラン実装時に追加。

- [ ] **TIER-01**: tier フィールドによるフィルタリング
- [ ] **TIER-02**: 有料プラン判定ロジック
- [ ] **TIER-03**: 有料ユーザーのみのBGM表示

## Out of Scope

| Feature | Reason |
|---------|--------|
| 有料プランの実装 | tierフィールドのみ用意、課金ロジックは別Issue |
| ユーザー別BGM | 全員共通のライブラリ |
| BGMの自動生成 | 手動アップロードのみ |
| 音楽のストリーミング配信 | ファイル単位の再生のみ |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01, DB-02, DB-03 | Phase 1 | Pending |
| AUTH-01, AUTH-02, AUTH-03, API-08 | Phase 2 | Pending |
| API-01, API-02 | Phase 3 | Pending |
| API-03, API-04, API-05, API-06, API-07 | Phase 4 | Pending |
| FE-01, FE-02, FE-03, FE-04 | Phase 5 | Pending |
| UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07 | Phase 6 | Pending |
| TEST-01, TEST-02, TEST-03, TEST-04 | 各フェーズ | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after roadmap creation*
