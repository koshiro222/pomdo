# Cloudflare Pages / Edge ランタイムを継続する

作り直しにあたり Node ランタイムのサーバレス（Vercel 等）への移行を検討したが、Cloudflare Pages / Workers（Edge ランタイム）を継続する。理由は運用コスト（無料枠が潤沢、既に構成済み）と、BGM 機能を v1 スコープから外したことで R2 依存が消え Edge に留まる障壁が下がったこと。

## トレードオフ

- **失うもの**: Node.js API（`crypto` / `fs` / `net`）が使えない。TCP ソケット不可のため Neon は `drizzle-orm/neon-http` 固定。`@hono/oauth-providers` など Node 依存パッケージが使えない。`nodejs_compat` フラグで一部 Node API が「動いてしまう」ため Edge 非対応コードが混入するリスクが残る。
- **許容できる理由**: v1 の認証は Google OAuth 単一（[[0003-auth-google-oauth-only]]）でメール送信が一切ない。メール（Magic Link / 週次サマリ）が必要になる時点で、Resend など HTTP API ベースの手段、または本 ADR の見直しを行う。

## 見直しのトリガー

- Better Auth など主要ライブラリが Cloudflare Workers 上で機能不全を起こす
- メール送信・バックグラウンドジョブなど Edge で困難な要件が複数積み上がる
