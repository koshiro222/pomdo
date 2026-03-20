# Requirements: Pomdo

**Defined:** 2026-03-21
**Core Value:** ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

## v1.1 Requirements

faviconを追加してブラウザタブでのブランド認知を高める。

### Favicon

- [ ] **FAV-01**: lucide-reactのTimerアイコンをベースにしたSVG faviconを作成する
- [ ] **FAV-02**: プライマリーカラー（#22c55e）でfaviconをスタイリングする
- [ ] **FAV-03**: index.htmlでfaviconを参照する
- [ ] **FAV-04**: SVG形式でスケーラブルに対応する

## v1.0 Requirements (Complete)

- [x] 管理者認証機能 — Better Auth Admin Plugin、users.roleカラム、adminProcedure
- [x] DBスキーマ変更 — bgm_tracksテーブル、tierフィールド
- [x] BGMトラック管理機能 — tRPC API（Read/Write）、R2連携
- [x] 管理者UI — 追加・削除・編集ダイアログ

## Future Requirements

実装予定だが今は対象外。

- 有料プラン対応（tierフィルタリング）
- テスト実装（TEST-01〜TEST-04）

## Out of Scope

明示的に除外。

| Feature | Reason |
|---------|--------|
| アニメーション付きfavicon | v1.1では静的SVGのみ。将来の拡張として検討可能 |
| 複数フォーマット（ico, png） | SVGで十分にスケーラブル |
| Apple touch icon | v1.1ではブラウザタブのみ対象 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FAV-01 | Phase 1 | Pending |
| FAV-02 | Phase 1 | Pending |
| FAV-03 | Phase 1 | Pending |
| FAV-04 | Phase 1 | Pending |

**Coverage:**
- v1.1 requirements: 4 total
- Mapped to phases: 0
- Unmapped: 4 ⚠️

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after v1.1 milestone started*
