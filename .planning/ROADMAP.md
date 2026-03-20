# Pomdo — BGM管理機能追加 ロードマップ

**Defined:** 2026-03-20
**Granularity:** Standard (5-8 phases)

## Phases

- [x] **Phase 1: Database** — BGMトラック管理のためのデータベース基盤構築 (completed 2026-03-19)
- [ ] **Phase 2: Authentication** — 管理者権限判定の実装
- [ ] **Phase 3: BGM API - Read** — BGMトラック取得API（既存プレイヤー移行用）
- [ ] **Phase 4: BGM API - Write** — BGM追加・削除・更新API（R2操作含む）
- [ ] **Phase 5: Player Migration** — 既存プレイヤーをDB連携へ移行
- [ ] **Phase 6: Admin UI** — 管理者用BGM管理画面

## Phase Details

### Phase 1: Database

**Goal:** BGMトラック管理に必要なデータベース基盤を構築する

**Depends on:** Nothing

**Requirements:** DB-01, DB-02, DB-03

**Success Criteria** (what must be TRUE):
1. `bgm_tracks` テーブルが本番環境に作成されている
2. Drizzle Studioでテーブル構造を確認できる
3. マイグレーションファイルがGitにコミットされている

**Plans:** 2/2 plans complete

- [x] 01-01-PLAN.md — スキーマ定義とマイグレーション生成
- [x] 01-02-PLAN.md — マイグレーション適用と検証

### Phase 2: Authentication

**Goal:** 管理者権限を判定し、APIの保護を可能にする

**Depends on:** Phase 1

**Requirements:** AUTH-01, AUTH-02, AUTH-03, API-08

**Success Criteria** (what must be TRUE):
1. Better Authでadminロールが定義されている
2. 管理者ユーザーがadminロールを持っている
3. 非管理者が管理APIにアクセスした際、403エラーが返される
4. ミドルウェアが正しく管理者判定できている

**Plans:** 3 plans

- [ ] 02-01-PLAN.md — サーバー側設定（schema拡張 + auth plugin + adminProcedure）
- [ ] 02-02-PLAN.md — クライアント側設定（AuthUser型拡張 + useAuth isAdmin）
- [ ] 02-03-PLAN.md — マイグレーション適用と検証

### Phase 3: BGM API - Read

**Goal:** BGMトラック取得APIを実装し、既存プレイヤーの移行準備を整える

**Depends on:** Phase 1, Phase 2

**Requirements:** API-01, API-02

**Success Criteria** (what must be TRUE):
1. `bgm.getAll` クエリで全トラックが取得できる
2. tierフィルタでトラックを絞り込める
3. tRPCルーターが正しく定義されている
4. 既存のハードコードされたトラックをDBに移行できる

**Plans:** 1 plan

- [ ] 03-01-PLAN.md — tRPCルーターbgmとgetAllクエリの実装

### Phase 4: BGM API - Write

**Goal:** 管理者がBGMを追加・削除・更新できるAPIを実装する

**Depends on:** Phase 2, Phase 3

**Requirements:** API-03, API-04, API-05, API-06, API-07

**Success Criteria** (what must be TRUE):
1. 管理者がMP3ファイルをアップロードするとR2に保存される
2. トラック情報（曲名・アーティスト・色）をDBに登録できる
3. トラック情報を更新できる
4. トラックを削除するとR2からもファイルが削除される
5. 非管理者が書き込みAPIを呼ぶと403エラーになる

**Plans:** 4 plans (Wave 0含む)

- [ ] 04-00-PLAN.md — テストインフラ構築（Wave 0）
- [ ] 04-01-PLAN.md — create mutation実装（API-03, API-06）
- [ ] 04-02-PLAN.md — update mutation実装（API-04）
- [ ] 04-03-PLAN.md — delete mutation実装（API-05, API-07）

### Phase 5: Player Migration

**Goal:** 既存プレイヤーをDB連携に移行し、動作を維持する

**Depends on:** Phase 3

**Requirements:** FE-01, FE-02, FE-03, FE-04

**Success Criteria** (what must be TRUE):
1. プレイヤーがDBからトラックを取得して再生できる
2. ハードコードされた `TRACKS` 定数が削除されている
3. BGM取得失敗時にエラーメッセージが表示される
4. 既存のBGM再生機能が問題なく動作している

**Plans:** 1 plan

- [ ] 05-01-PLAN.md — useBgmフックのtRPC連携とTRACKS定数削除

### Phase 6: Admin UI

**Goal:** 管理者がブラウザからBGMを管理できるUIを実装する

**Depends on:** Phase 4, Phase 5

**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07

**Success Criteria** (what must be TRUE):
1. 管理者のみHeaderに管理ボタンが表示される
2. 管理画面でトラック一覧がリスト形式で表示される
3. ボタンクリックでファイルをアップロードできる
4. トラック情報（曲名・アーティスト・色）を編集できる
5. 削除時に確認ダイアログが表示される
6. ローディング・エラー状態が適切に表示される

**Plans:** 4 plans

- [ ] 06-00-PLAN.md — テストファイル作成（Wave 0）
- [ ] 06-01-PLAN.md — Headerへの管理ボタン追加とAdminModal基本構造（UI-01, UI-02）
- [ ] 06-02-PLAN.md — TrackList/TrackItem/AddTrackForm実装（UI-03, UI-04, UI-07）
- [ ] 06-03-PLAN.md — EditTrackDialog/DeleteConfirmDialog実装（UI-05, UI-06）
- [ ] 06-04-PLAN.md — TrackItemへのダイアログ接続（Gap Closure）

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database | 2/2 | Complete   | 2026-03-19 |
| 2. Authentication | 0/3 | Planning | - |
| 3. BGM API - Read | 0/1 | Planning | - |
| 4. BGM API - Write | 0/4 | Planning | - |
| 5. Player Migration | 0/1 | Planning | - |
| 6. Admin UI | 3/4 | In Progress|  |

## Testing Strategy

各フェーズの成功基準には以下を含む:
- 単体テスト（tRPCルーター、ミドルウェア）
- E2Eテスト（BGM追加・削除・編集フロー）
- 管理者権限テスト

Testing要件（TEST-01〜TEST-04）は各フェーズの実装に組み込まれる。

---
*Roadmap created: 2026-03-20*
*Phase 1 plans added: 2026-03-20*
*Phase 2 plans added: 2026-03-20*
*Phase 3 plans added: 2026-03-20*
*Phase 4 plans added: 2026-03-20*
*Phase 5 plans added: 2026-03-20*
*Phase 6 plans added: 2026-03-21*
*Phase 6 gap closure plan added: 2026-03-21*
