# Pomdo — BGM管理機能追加

## What This Is

Pomodoro + ToDo アプリのBGM機能に、管理者向けの管理画面を追加する。管理者がBGMを追加・削除・編集でき、全ユーザー（ゲスト含む）が同じBGMを共有できるようにする。

## Core Value

管理者がBGMライブラリを簡単に管理でき、全ユーザーが集中作業に適した音楽を利用できること。

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

### Active

- [ ] 全ユーザーが同じBGMを共有 — useBgm.tsのハードコードをtRPC APIに置き換え
- [ ] 将来の有料プラン対応（tierフィールド）

### Out of Scope

- 有料プランの実装 — tierフィールドのみ用意、課金ロジックは別Issue
- ユーザー別BGM — 全員共通のライブラリ
- BGMの自動生成 — 手動アップロードのみ

## Context

**現在のBGM実装:**
- トラックリストは `src/hooks/useBgm.ts` にハードコード
- 音源は Cloudflare R2 バケット `pomdo-bgm` に保存
- API: `functions/api/bgm.ts` でR2からストリーミング

**技術環境:**
- Edge Runtime（Cloudflare Workers）— Node.js API不可
- Better Auth — adminロール使用
- Drizzle ORM + PostgreSQL
- R2 for object storage

## Current State

**v1.0 マイルストーン完了** (2026-03-21)

BGM管理機能が完全に実装されました:
- 管理者がブラウザからBGMの追加・削除・編集が可能
- 全ユーザー（ゲスト含む）が同じBGMライブラリを共有
- tRPC APIでDB連携されたトラック管理
- R2へのファイルアップロード・削除機能

**技術的負債:**
- TEST-01〜TEST-04: 単体テスト・E2Eテストがプレースホルダー状態
- Phase 01, 05: VERIFICATION.md不在（実装完了済み）

## Next Milestone Goals

- テスト実装（TEST-01〜TEST-04）
- 有料プラン対応（tierフィルタリング）

## Constraints

- **Edge Runtime**: Node.js API（crypto, fs, net）使用不可 → Web Crypto API / R2 HTTP API 使用
- **R2バケット**: `pomdo-bgm` を既存として使用
- **ファイル形式**: MP3のみ（現在のバリデーション維持）
- **認証**: Better Authのadminロールで管理者判定

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 管理者権限はadminロールで判定 | Better Auth既存機能活用、将来的な管理者追加に対応 | ✓ Good — v1.0で実装完了 |
| 全員がBGMを共有 | ゲストも含めて同じ集中音楽を提供、DBで一元管理 | ✓ Good — publicProcedureで実現 |
| tierフィールド用意のみ | 有料プラン実装は別Issue、スキーマ設計で対応可能に | — Pending — v1.1で対応予定 |
| Base64ファイルアップロード | Edge RuntimeでFormData処理が制限されるため | ✓ Good — create mutationで実装 |
| adminProcedure独立定義 | protectedProcedureとは別に管理者専用プロシージャを定義 | ✓ Good — Phase 02で実装 |

---
*Last updated: 2026-03-21 after v1.0 milestone*
