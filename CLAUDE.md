# Pomdo — Pomodoro + ToDo アプリ

## コマンド

```bash
npm run dev        # vite (5173) + wrangler pages dev (8788) 同時起動
npm run dev:vite   # vite のみ
npm run build      # tsc + vite build → dist/
```

ローカルAPI確認: `http://localhost:8788/api/*`（wrangler 経由）

## ワークフロー

(厳守)issue作成or確認 → `feature/xxx` ブランチ → PR。詳細: `ai-rules/COMMIT_AND_PR_GUIDELINES.md`

## ⚠️ 非自明な制約（ここを見落とすとバグになる）

### Edge Runtime 制約（Cloudflare Workers）

- **Node.js API 使用禁止**: `crypto`, `fs`, `net` など Node.js 組み込みモジュールは使えない
- **Web Crypto API を使う**: JWT署名は `crypto.subtle`（Web Crypto API）で実装
- **TCP ソケット不可**: Neon は `drizzle-orm/neon-http` を使う（`neon-serverless` の TCP接続は不可）
- **禁止パッケージ**: `@hono/oauth-providers`（Edge Runtime で Node.js 依存あり）

### ゲストモード（必須仕様）

未ログインでも全機能が使える。localStorage に保存し、ログイン時にマイグレーションダイアログを表示。

### API ルーティング

Hono のエントリポイントは `functions/api/[[route]].ts`。basePath は `/api`。

## テスト

実装後は必ず `ai-rules/TESTING.md` を参照。

## ガイドライン

| 目的 | ファイル |
|------|---------|
| Issue作成 | `ai-rules/ISSUE_GUIDELINES.md` |
| コミット・PR | `ai-rules/COMMIT_AND_PR_GUIDELINES.md` |
| テスト | `ai-rules/TESTING.md` |
| アーキテクチャ詳細 | `ai-rules/ARCHITECTURE.md` |
| トラブルシューティング | `ai-rules/TROUBLESHOOTING.md` |
