# Pomdo — Pomodoro + ToDo アプリ

## What This Is

Pomodoro + ToDo アプリ。集中作業のためのタイマー機能とタスクリスト管理を提供し、BGMで集中力を高めることができる。

## Core Value

ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

---

## Current Milestone: v1.6 TodoカードUI/UX改善

**Goal:** Todoカードのレイアウト整理・アニメーション改善・ドラッグ&ドロップ並び替えを実装し、タスク操作体験を向上させる

**Target features:**
- レイアウト: 仕切り線の位置変更 + 「Add a new task」をリスト下部へ移動
- アニメーション: タスク追加時のスムーズな展開アニメーション
- ドラッグ&ドロップ: タスク並び替え + 順序の永続化（DB/localStorage）

## Current State

**Latest Milestone:** v1.6 TodoカードUI/UX改善 (completed 2026-03-25)

**Shipped v1.6:**
- Phase 17: レイアウト&アニメーション改善 — Validated in Phase 17
  - expandInVariantsによる新タスクの展開アニメーション（高さ展開+フェードイン）
  - TodoItemにlayout prop追加、既存タスクのスムーズなスライド
  - TodoListに仕切り線追加（Current Taskセクションとフィルタータブの間）
  - TodoInputをリスト最下部のスクロールエリア内に移動
- Phase 18: ドラッグ&ドロップ並び替え — Validated in Phase 18
  - @dnd-kit/core, @dnd-kit/sortableライブラリ導入
  - TodoItemにドラッグハンドル（GripVertical icon）追加
  - TodoListにDndContextとSortableContext統合
  - DBにorderカラム追加、tRPC reorder mutation実装
  - オプティミスティックアップデートでパフォーマンス最適化
  - ゲストモード（localStorage）とログインモード（DB）両対応

**Shipped v1.5:**
- Phase 16: カードヘッダー統一
  - TimerWidgetに統一スタイルの「Pomodoro」ヘッダーテキスト追加
  - BgmPlayerのヘッダーレイアウトを「BGM|Listボタン」に再配置
  - TodoListのヘッダーからアイコン削除し、統一スタイル適用
  - 全カードで `text-xs uppercase tracking-widest font-bold` スタイル統一

**Previous Milestone:** v1.4 Bento Grid再設計 & Todo統合 (shipped 2026-03-24)

**Shipped v1.4:**
- Phase 14: BentoGrid 3カラム再設計
  - 3カラム均等グリッド（grid-cols-1 lg:grid-cols-3）
  - デスクトップ横3列、モバイル縦積みスクロール
  - CurrentTaskCard DOM削除（TodoList統合準備完了）
- Phase 15: TodoList統合UI
  - CurrentTaskCardの機能をTodoListに統合
  - ハイライトセクション（Current Taskラベル、タスク名、完了数）
  - アクションボタン（Complete、Next）
  - TodoItem選択中スタイル（左ボーダーのみ）
  - E2Eテスト完了（30テスト全パス）
  - ユーザー検証完了

**Previous Milestones:**
- v1.3 アクセシビリティ&品質改善 — shipped 2026-03-24
- v1.2 UI/UX改善 — shipped 2026-03-22
- v1.1 favicon追加 — shipped 2026-03-21
- v1.0 BGM管理機能追加 — shipped 2026-03-20

**Codebase:** 6770 LOC TypeScript

## Requirements

### Validated

- ✓ Google OAuth認証 — 既存
- ✓ Todo管理（CRUD）— 既存
- ✓ Pomodoroタイマー — 既存
- ✓ BGM再生・停止・選択 — 既存
- ✓ ゲストモード（localStorage）— 既存
- ✓ 管理者認証機能 — v1.0で実装
  - ✓ Better Auth Admin Plugin有効化
  - ✓ usersテーブルにroleカラム追加
  - ✓ adminProcedureミドルウェア実装
  - ✓ クライアント側isAdmin判定実装
- ✓ DBスキーマ変更 — v1.0で実装
  - ✓ bgm_tracks テーブル作成
  - ✓ tier フィールド（free/premium）
- ✓ BGMトラック管理機能 — v1.0で実装
  - ✓ Read API — tRPCで全トラック取得、tierフィルタ対応
  - ✓ Write API — 管理者のみBGM追加・削除・編集可能
  - ✓ トラック情報（曲名・アーティスト・色・ファイル）をDBで管理
- ✓ 管理者UI — v1.0で実装
  - ✓ Headerに管理ボタン（adminロールのみ表示）
  - ✓ BGM追加（ファイルアップロード）
  - ✓ BGM削除（確認ダイアログ付き）
  - ✓ 曲名・アーティスト・色編集
- ✓ favicon機能 — v1.1で実装
- ✓ レスポンシブ対応の改善 — v1.2 Phase 08で実装
- ✓ グリッドデザイン統一 — v1.2 Phase 08で実装
- ✓ タイマー余白調整 — v1.2 Phase 08で実装
- ✓ overflow設定の統一 — v1.2 Phase 08で実装
- ✓ Stats機能実装 — v1.2 Phase 09で実装
- ✓ カードデザイン統一 — v1.2 Phase 10で実装
- ✓ デザインシステム文書化 — v1.2 Phase 10で実装
- ✓ タッチターゲットサイズ確保 — v1.3 Phase 12で実装
- ✓ カーソルポインター統一 — v1.3 Phase 12で実装
- ✓ モバイルオーバーフロー修正 — v1.3 Phase 12で実装
- ✓ 固定サイズ問題解消 — v1.3 Phase 12で実装
- ✓ ボタンスタイル統一 — v1.3 Phase 13で実装
- ✓ カラーコントラスト改善 — v1.3 Phase 11で実装
- ✓ キーボードナビゲーション — v1.3 Phase 11で実装
- ✓ ドラッグハンドル常時表示 — v1.3で実装
- ✓ Bento Grid 3カラム均等分割レイアウト — v1.4 Phase 14で実装
- ✓ TodoList統合UI — v1.4 Phase 15で実装
  - ✓ TodoListカード内のCurrent Taskハイライトセクション
  - ✓ Complete/Nextアクションボタンによるタスク操作
  - ✓ TodoItem選択中スタイル（左ボーダーのみ）
- ✓ カードヘッダー統一 — v1.5 Phase 16で実装
  - ✓ TimerWidgetに「Pomodoro」ヘッダーテキスト（統一スタイル）
  - ✓ BgmPlayerのヘッダー左上・Listボタン右上配置
  - ✓ TodoListのヘッダースタイル統一（text-xs uppercase tracking-widest font-bold）
- ✓ レイアウト&アニメーション改善 — v1.6 Phase 17で実装
  - ✓ expandInVariantsによる新タスクの展開アニメーション
  - ✓ TodoItemのlayout propによるスムーズなスライド
  - ✓ TodoListの仕切り線（Current Task下、フィルタータブ上）
  - ✓ TodoInputのリスト最下部配置（スクロールエリア内）
- ✓ ドラッグ&ドロップ並び替え — v1.6 Phase 18で実装
  - ✓ @dnd-kitによるドラッグハンドルと並び替えUI
  - ✓ DB orderカラムとtRPC reorder mutation
  - ✓ ゲストモード（localStorage）とログインモード（DB）の両対応
  - ✓ オプティミスティックアップデートによるパフォーマンス最適化

### Active

- [ ] prefers-reduced-motion対応（v1.3キャリーオーバー）
- [ ] prefers-reduced-motion対応（v1.3キャリーオーバー）
- [ ] tRPCルーター単体テスト（TEST-01〜TEST-04）

### Out of Scope

- 有料プランの実装 — tierフィールドのみ用意、課金ロジックは別Issue
- ユーザー別BGM — 全員共通のライブラリ
- BGMの自動生成 — 手動アップロードのみ
- アニメーション付きfavicon — 静的SVGのみ
- 統計データの永続化 — v1.2ではlocalStorageのみ、DB連携は別Issue

## Context

**技術環境:**
- Edge Runtime（Cloudflare Workers）— Node.js API不可
- Better Auth — adminロール使用
- Drizzle ORM + PostgreSQL
- R2 for object storage
- **UIライブラリ**: lucide-react（アイコン）
- **カラースキーム**: Deep Forest（プライマリー #22c55e）
- **CSS**: Tailwind CSS

## Constraints

- **Edge Runtime**: Node.js API（crypto, fs, net）使用不可 → Web Crypto API / R2 HTTP API 使用
- **favicon形式**: SVG推奨（スケーラブル、サイズ変更容易）
- **アイコン**: lucide-reactのTimerアイコンをベースにする
- **Statsデータ**: v1.2ではlocalStorageのみ使用（DB連携は別Issue）

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 管理者権限はadminロールで判定 | Better Auth既存機能活用、将来的な管理者追加に対応 | ✓ Good — v1.0で実装完了 |
| 全員がBGMを共有 | ゲストも含めて同じ集中音楽を提供、DBで一元管理 | ✓ Good — publicProcedureで実現 |
| tierフィールド用意のみ | 有料プラン実装は別Issue、スキーマ設計で対応可能に | — Pending — v1.2以降で対応予定 |
| Base64ファイルアップロード | Edge RuntimeでFormData処理が制限されるため | ✓ Good — create mutationで実装 |
| adminProcedure独立定義 | protectedProcedureとは別に管理者専用プロシージャを定義 | ✓ Good — v1.0 Phase 02で実装 |
| faviconはlucide-reactのTimer | アプリの用途を直感的に伝え、既存のアイコンライブラリと統一 | ✓ Good — v1.1で実装完了 |
| Framer Motion layout="position" | サイズ変更アニメーションを無効化し、レイアウトシフト競合を解消 | ✓ Good — v1.2で実装完了 |
| Flexbox min-h-0パターン | Flexbox内でoverflowを正しく動作させるために必須 | ✓ Good — v1.2で実装完了 |
| Recharts採用 | Reactネイティブ、軽量、宣言的API | ✓ Good — v1.2で実装完了 |
| .bento-cardクラス統一 | glassmorphism効果、border-radius、overflow、transition、hoverを一元管理 | ✓ Good — v1.2で実装完了 |
| spacing scale（4px基数） | Tailwind CSS v4ベース、一貫性のあるスペーシング | ✓ Good — v1.2で実装完了 |
| 3カラム均等グリッドシステム | 12列複雑システムの簡素化、保守性向上 | ✓ Good — v1.4で実装完了 |
| CurrentTaskCardをTodoListに統合 | DOM構造簡素化、UXの一元化 | ✓ Good — v1.4で実装完了 |
| padding統一（p-6→p-4） | TimerWidgetの視覚的バランス調整 | ✓ Good — v1.5で実装完了 |
| flex justify-betweenヘッダー | スペーサー削除、自然な左右配置 | ✓ Good — v1.5で実装完了 |
| アイコン削除で統一 | TodoListのCheckSquareアイコン削除、テキストオンリーで統一 | ✓ Good — v1.5で実装完了 |

---
*Last updated: 2026-03-25 after Phase 18 completion (v1.6 milestone complete)*
