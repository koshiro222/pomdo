# Milestones

## v1.6 TodoカードUI/UX改善 (Shipped: 2026-03-25)

**Phases completed:** 2 phases, 7 plans, 0 tasks

**Key accomplishments:**

- (none recorded)

---

## v1.5 カードヘッダー統一 (Shipped: 2026-03-24)

**Phases completed:** 1 phases, 2 plans

**Key accomplishments:**

- TimerWidgetに統一スタイルの「Pomodoro」ヘッダーテキストを追加
- BgmPlayerのヘッダーレイアウトを「BGM|Listボタン」に再配置
- TodoListのヘッダーからアイコンを削除し、統一スタイルを適用
- 全カードで `text-xs uppercase tracking-widest font-bold` スタイル統一
- テストスケルトンをTDD形式で作成

**Stats:**

- Timeline: 1 day (2026-03-24)
- Files changed: 6 files (+68/-9 LOC)
- Git commits: 6 commits

---

## v1.4 Bento Grid再設計 & Todo統合 (Shipped: 2026-03-24)

**Phases completed:** 2 phases, 4 plans

**Key accomplishments:**

- BentoGridを12列複雑システムから3カラム均等システムに簡素化
- デスクトップ横3列・モバイル縦積みのレスポンシブレイアウトを実現
- TodoListにCurrentTaskハイライトセクションとComplete/Nextボタンを統合
- E2Eテスト30テスト全パス（Chromium/Firefox/WebKit各10テスト）

**Stats:**

- Timeline: 2 days (2026-03-23 → 2026-03-24)
- Files changed: 3
- Git commits: 2 feat commits

---

## v1.3 アクセシビリティ&品質改善 (Shipped: 2026-03-23)

**Phases completed:** 3 phases, 8 plans, 4 tasks

**Key accomplishments:**

- (none recorded)

---

## v1.2 UI/UX改善 (Shipped: 2026-03-21)

**Phases completed:** 3 phases, 10 plans, 2 tasks

**Key accomplishments:**

- (none recorded)

---

## v1.1 favicon追加 (Shipped: 2026-03-21)

**Phases completed:** 1 phase, 1 plan, 2 tasks

**Key accomplishments:**

- lucide-reactのTimerアイコン構造をベースにしたSVG faviconを作成
- プライマリーカラー（#22c55e）で円を塗りつぶし、白（#ffffff）の線でスタイリング
- index.htmlでfavicon.svgを参照するよう更新
- 旧Viteデフォルトfavicon（vite.svg）を削除

**Stats:**

- Timeline: 1 day (2026-03-21)
- Files changed: 2
- Git commits: 2 feat commits

---

## v1.0 BGM管理機能追加 (Shipped: 2026-03-20)

**Phases completed:** 6 phases, 16 plans

**Key accomplishments:**

- bgm_tracksテーブルとtierフィールド enum制約、マイグレーションシステム
- Better Auth Admin Plugin有効化、adminProcedureミドルウェア実装
- tRPCでBGM取得・追加・更新・削除API（R2連携、Base64アップロード）
- useBgmフックのtRPC連携、ハードコードトラック削除
- 管理者用BGM管理UI（AdminModal、TrackList、AddTrackForm、Edit/Delete Dialogs）

**Stats:**

- Timeline: 22 days (2026-02-28 → 2026-03-21)
- TypeScript LOC: ~25,000
- Git commits: 20+ feat commits

---
