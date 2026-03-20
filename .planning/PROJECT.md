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
- ✓ 管理者認証機能 — Phase 02で実装
  - ✓ Better Auth Admin Plugin有効化
  - ✓ usersテーブルにroleカラム追加
  - ✓ adminProcedureミドルウェア実装
  - ✓ クライアント側isAdmin判定実装
- ✓ DBスキーマ変更 — Phase 01で実装
  - ✓ bgm_tracks テーブル作成
  - ✓ tier フィールド（free/premium）

### Active

- [ ] BGMトラック管理機能
  - [x] Read API — tRPCで全トラック取得、tierフィルタ対応 (Phase 03)
  - [x] Write API — 管理者のみBGM追加・削除・編集可能 (Phase 04)
  - [x] トラック情報（曲名・アーティスト・色・ファイル）をDBで管理
  - [ ] 全ユーザーが同じBGMを共有
  - [ ] 将来の有料プラン対応（tierフィールド）

- [ ] 管理者UI
  - [ ] Headerに管理ボタン（adminロールのみ表示）
  - [ ] BGM追加（ファイルアップロード）
  - [ ] BGM削除
  - [ ] 曲名・アーティスト・色編集

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

Phase 02 (Authentication) 完了 — Better Auth Admin Pluginが有効化され、usersテーブルにroleカラムが追加された。adminProcedureミドルウェアで管理者権限チェックが可能。初期管理者（ko546222@gmail.com）が登録済み。

Phase 03 (BGM API Read) 完了 — tRPC `bgmRouter.getAll` で全BGMトラックを取得できる。認証不要で、tierフィルタ(free/premium)による絞り込みが可能。

Phase 04 (BGM API Write) 完了 — 管理者向けのBGM追加・更新・削除APIが実装された。`bgm.create` でMP3ファイルをR2にアップロードし、`bgm.update` でメタデータ更新、`bgm.delete` でDB・R2両方から削除。adminProcedureで保護されている。

## Constraints

- **Edge Runtime**: Node.js API（crypto, fs, net）使用不可 → Web Crypto API / R2 HTTP API 使用
- **R2バケット**: `pomdo-bgm` を既存として使用
- **ファイル形式**: MP3のみ（現在のバリデーション維持）
- **認証**: Better Authのadminロールで管理者判定

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 管理者権限はadminロールで判定 | Better Auth既存機能活用、将来的な管理者追加に対応 | — Pending |
| 全員がBGMを共有 | ゲストも含めて同じ集中音楽を提供、DBで一元管理 | — Pending |
| tierフィールド用意のみ | 有料プラン実装は別Issue、スキーマ設計で対応可能に | — Pending |

---
*Last updated: 2026-03-20 after Phase 04 completion*
