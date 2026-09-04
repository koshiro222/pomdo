# テスト

純粋関数は境界値を含む Vitest、DB は PGlite + Drizzle、画面は Testing Library、主要フローは Chromium Playwright で確認する。Focus の `59,999ms` は破棄、`60,000ms` は Interrupted、終了後 `60,000ms` は確認対象である。

E2E は `/api/test/auth` を使い、`E2E_TEST_MODE=true` のときだけ利用できる。時間仕様は実時間待機せず、`page.clock` を使う。
