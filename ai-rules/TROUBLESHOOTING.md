# トラブルシューティング

## `npm create vite@latest` が TTY なしでキャンセルされる

`@clack/prompts` が非 TTY 環境（パイプ等）を検出してキャンセルする。

**回避策**: 一時ディレクトリで生成してからコピーする。

```bash
npm create vite@latest /tmp/pomdo-temp -- --template react-ts
cp -r /tmp/pomdo-temp/. .
```

## `wrangler pages dev` で API が 404 になる

`functions/api/[[route]].ts` の Hono は `basePath('/api')` が必要。
`/hello` ではなく `/api/hello` にリクエストする。

## shadcn/ui init が「import alias not found」で失敗する

shadcn はルートの `tsconfig.json` から paths を読む（`tsconfig.app.json` だけでは不足）。
`tsconfig.json` に `compilerOptions.paths` を追加する必要がある。

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## Edge Runtime で Node.js API エラー

`@hono/oauth-providers` など Node.js 依存パッケージを使うと
`Cannot find module 'node:crypto'` 等のエラーが出る。
Web Crypto API (`crypto.subtle`) に置き換える。

## Neon 接続エラー（TCP）

`drizzle-orm/neon-serverless` の TCP モードは Edge Runtime で使えない。
`drizzle-orm/neon-http` と `@neondatabase/serverless` の HTTP 接続を使う。
