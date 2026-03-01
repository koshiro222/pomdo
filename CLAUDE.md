# Pomdo — Pomodoro + ToDo アプリ

## コマンド

```bash
npm run dev        # vite (5173) + wrangler pages dev (8788) 同時起動
npm run dev:vite   # vite のみ
npm run build      # tsc + vite build → dist/
npm test           # vitest（ユニットテスト）
npm run test:e2e   # Playwright E2E テスト
npm run db:generate  # Drizzle マイグレーションファイル生成
npm run db:migrate   # マイグレーション適用
```

ローカルAPI確認: `http://localhost:8788/api/*`

## ワークフロー

(厳守)issue作成or確認 → `feature/xxx` ブランチ → 実装・動作確認パスしたらコミット → PR
詳細: `ai-rules/WORK_FLOW.md`

## テスト

実装後は必ず `ai-rules/TESTING.md` を参照。

## ⚠️ 非自明な制約

### Edge Runtime（Cloudflare Workers）
- **Node.js API 使用禁止**: `crypto`, `fs`, `net` は使えない
- **Web Crypto API 使用**: JWT署名は `crypto.subtle` で実装
- **TCP ソケット不可**: Neon は `drizzle-orm/neon-http` を使う（`neon-serverless` は不可）
- **禁止パッケージ**: `@hono/oauth-providers`（Node.js 依存あり）

### API ルーティング（2系統）
- **REST**: `functions/api/[[route]].ts`（Hono, basePath `/api`）— 認証・ヘルスチェック等
- **tRPC**: `functions/api/trpc/[[route]].ts`（endpoint `/api/trpc`）— Todo・Pomodoro・auth.me
- tRPC ルーター定義は `src/app/routers/` に配置

### ゲストモード
未ログインでも全機能が使える。localStorage に保存し、ログイン時にマイグレーションダイアログを表示。

### tRPC エラーハンドリング
`new Error()` をそのまま throw すると `INTERNAL_SERVER_ERROR(500)` になる。必ず `TRPCError` を使うこと。

## ドキュメント

| 目的 | ファイル |
|------|---------|
| Issue作成 | `ai-rules/ISSUE_GUIDELINES.md` |
| コミット・PR | `ai-rules/COMMIT_AND_PR_GUIDELINES.md` |
| ワークフロー | `ai-rules/WORK_FLOW.md` |
| テスト | `ai-rules/TESTING.md` |
| アーキテクチャ | `ai-rules/ARCHITECTURE.md` |
| トラブルシューティング | `ai-rules/TROUBLESHOOTING.md` |
