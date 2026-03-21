# Pomdo — Pomodoro + ToDo アプリ

## What This Is

Pomodoro + ToDo アプリ。集中作業のためのタイマー機能とタスクリスト管理を提供し、BGMで集中力を高めることができる。

## Core Value

ユーザーが集中して作業を完了できるようにする。タイマー、タスク、BGMがシームレスに連携する。

## Current Milestone: v1.2 UI/UX改善

**Goal:** レスポンシブ対応の完了、デザインの一貫性向上、Stats機能の実装

**Target features:**
- レスポンシブ対応の修正（要素の重なり解消）
- グリッドデザインの統一
- タイマー部分の余白調整
- selectedTask UXの改善または削除
- Stats機能の実装（カウント、グラフ表示）

**Last Milestone:** v1.1 favicon追加 — shipped 2026-03-21

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
  - ✓ TimerアイコンベースのSVG favicon作成
  - ✓ プライマリーカラー（#22c55e）でスタイリング
  - ✓ index.htmlでfavicon.svgを参照
- ✓ レスポンシブ対応の改善 — v1.2 Phase 08で実装
  - ✓ Bento Gridのlayout propをposition指定に変更
  - ✓ main要素のoverflow設定を統一（min-h-0）
  - ✓ Framer Motionのレイアウトシフトを解消
  - ✓ 全画面サイズで要素が重ならないことを保証
- ✓ グリッドデザイン統一 — v1.2 Phase 08で実装
  - ✓ 冗長なrow-span指定を削除
  - ✓ 一貫したブレイクポイント設定
- ✓ タイマー余白調整 — v1.2 Phase 08で実装
  - ✓ モードタブの二重パディングを解消（top-6→top-4, left-6→left-4）
  - ✓ 視覚的な余白を48pxから40pxに最適化
- ✓ overflow設定の統一 — v1.2 Phase 08で実装
  - ✓ TodoListとStatsCardにoverflow-y-auto min-h-0を追加
  - ✓ 一貫したスクロール挙動を実現
- ✓ Stats機能実装 — v1.2 Phase 09で実装
  - ✓ Rechartsによるグラフ表示（棒グラフ・折れ線グラフ・複合グラフ）
  - ✓ 今日・週次・月次統計のタブ切り替え
  - ✓ ローディング状態と空状態のUI
  - ✓ セッション完了後の自動更新

### Active

- [ ] selectedTask UX改善 — 要否検討と改善または削除

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

**既存UI/UX課題:**
- レスポンシブ対応が不完全 — 要素が重なり、ボタンがクリックできない
- 各グリッドに統一感がない
- タイマー部分の余白が大きすぎる
- selectedTaskがUX的に微妙
- Statsが機能していない — カウントもグラフも表示されない

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

---
---
*Last updated: 2026-03-22 after Phase 09 (stats) completion*
