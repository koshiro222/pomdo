# Pomdo v1 開発ルール

Pomdo v1 は ADHD の特性がある人を中心に、時間の外在化・次の一手の縮小・責めない振り返りを提供する。実装の正は `design-docs-for-ai/issue148-adhd-focused-pomodoro-todo-v1-rebuild-implementation-plan.md` と Issue #148 である。

## 境界

- Cloudflare Pages/Functions の Edge runtime を使い、Node 専用 API を Functions bundle に持ち込まない。
- 匿名 Better Auth ユーザーを初回 `/app` で作る。公開ログインは Google OAuth のみ。
- Task/Focus の API は tRPC の router → service → repository の三層に置く。
- 実行中 Focus は Zustand persist、永続データは Neon PostgreSQL。Focus 開始時に DB insert しない。
- BGM、R2、管理者 UI、メール/パスワード、pause、自動開始は v1 に存在しない。

## 品質管理

上から順番に実行し、前の失敗を隠して進めない。

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm test -- --run`
5. `npm run test:coverage`
6. `npm run build`
7. `npm run test:e2e -- --project=chromium`
8. Playwright CLI で実画面を操作する
9. light/dark/system、mobile/desktop、keyboard、reduced-motion/transparency、ネットワーク断を確認する
10. `rtk git diff --check`、旧参照検索、secret 混入確認をする

例: 25 分 Focus は `endsAt` と `Date.now()` の差から残りを再計算し、`page.clock.fastForward` で終了境界を確認する。
