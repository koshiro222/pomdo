# CONCERNS.md — Technical Debt & Known Issues

## 未実装機能

### メール送信（Issue #120）
- **場所**: `functions/lib/auth.ts` 行40, 46
- **問題**: `sendResetPassword`, `sendVerificationEmail` が `console.log` のみ
- **影響**: パスワードリセット・メール検証が実質機能しない
- **対応**: Issue #120 でメール送信サービス（Resend等）の統合が必要

## ロジック上の懸念

### sessionCompletePending のクリアタイミング不明確
- **場所**: `src/hooks/useTimer.ts` 付近
- **コード内コメント**:
  ```typescript
  // sessionCompletePendingはstart()の中で自動的にクリアされる想定
  // ただし、現在の実装では自動クリアされないので別の方法を検討
  ```
- **影響**: 連続セッション時の自動開始が期待通りに動作しない可能性
- **現状**: ユニットテスト（`useTimer.test.ts`）では自動開始は確認済み

## 未使用コード

### REST Todo/Pomodoro API（デッドコード）
- **場所**: `functions/api/todos.ts`, `functions/api/pomodoro.ts`
- **問題**: REST APIとして実装されているが、実際はtRPCが使われており未使用
- **影響**: コード量の肥大化・混乱の元
- **対応**: 削除を検討（または意図的に残している場合はコメントで明示）

## エラーハンドリングの不統一

### エラーメッセージ言語の不統一
- **問題**: UIは日本語だがエラーメッセージは英語
  ```typescript
  // useTodos.ts
  const msg = e instanceof Error ? e.message : 'Failed to add todo'
  // usePomodoro.ts
  const msg = e instanceof Error ? e.message : 'Failed to migrate todos'
  ```
- **影響**: ユーザー向けエラーが英語で表示される場合がある

### フロントエンドのエラー状態表示
- `useTodosStore` の `error` 状態がどこでユーザーに表示されるか不明確

## テストカバレッジの不足

### ユニットテスト不足
- **現状**: `src/hooks/useTimer.test.ts` のみ
- **不足している対象**:
  - `useTodos.ts` — ゲスト/ログイン分岐ロジック
  - `usePomodoro.ts` — セッション管理
  - `useBgm.ts` — BGM制御
  - `src/app/routers/todos.ts` — tRPC ルーター
  - `src/app/routers/pomodoro.ts` — tRPC ルーター
  - `src/lib/storage.ts` — localStorage ラッパー

### E2Eテストの実行環境依存
- BGM テストは R2 バケットへのアクセスが必要（CI環境で失敗する可能性）
- `public/audio/README.md` によるとBGMファイルはgitignoreで除外

## Edge Runtime 制約リスク

### Better Auth のEdge Runtime互換性
- Better Auth 1.5.4 の全機能がCloudflare Workers で動作するか未検証部分がある
- 特にメール関連機能（未実装のため顕在化していないが実装時に問題が出る可能性）

### Node.js API の誤用リスク
- `nodejs_compat` フラグで一部のNode.js APIが使えてしまうため、Edge Runtime非対応のコードが混入するリスクがある

## セキュリティ上の注意点

### JWT_SECRET の存在
- `.dev.vars` に `JWT_SECRET` が存在するが、Better Auth 移行後のレガシーか新規で必要かが不明
- 現在の実装で実際に使用されているか確認が必要

### CORS設定
- `FRONTEND_URL` 環境変数でCORSを制御しているが、設定漏れのリスク

## パフォーマンス懸念

### tRPC バッチリクエスト
- `httpBatchLink` を使用しているため複数のtRPCコールがバッチ化される
- 意図しないバッチ遅延が生じる場合がある

### Zustand persist のhydration
- `getInitialState()` でlocalStorageから復元するため、初回レンダリング時にちらつきが発生する可能性

## アーキテクチャ上の技術的負債

### authStore の実装不完全
- `src/core/store/auth.ts` は型定義のみで実際の実装がない
- 認証状態は `useAuth()` フックと `authClient` で管理しており、Zustand との役割分担が不明確

### Cloudflare R2 の本番環境依存
- BGM機能はCloudflare R2に依存しており、ローカル開発環境では動作確認が困難
- `public/audio/` にフォールバックがあるか確認が必要

## 依存関係の懸念

### React 19の採用
- React 19.2.0（比較的新しいバージョン）— サードパーティライブラリの互換性に注意
- `@testing-library/react` 16.3.2 が React 19 に完全対応しているか確認が必要

### Vitest 4.0.18 と Vite 7.3.1
- 最新バージョンを採用しているためエコシステムの追従が必要な場合がある
