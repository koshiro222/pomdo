# Phase 5: Player Migration - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

既存プレイヤーをDB連携に移行し、動作を維持する。`useBgm` フックを tRPC `bgm.getAll` からトラックを取得するように変更し、ハードコードされた `TRACKS` 定数を削除する。

音源ファイルは既存のR2バケット `pomdo-bgm` に保存済みで、DBにはトラック情報のみが保存されている。

</domain>

<decisions>
## Implementation Decisions

### データ取得の戦略

- **方式**: tRPC `useQuery` を使用した非同期データ取得
- **タイミング**: 常に即時実行（`enabled: true`）— useBgm フック呼び出し時に自動でAPIリクエスト開始
- **キャッシュ**: 長期キャッシュ（`staleTime: 60 * 60 * 1000` = 1時間）
  - 理由: BGMトラックは管理者しか更新しないため、頻繁な再取得は不要
  - 再フェッチは手動実行時のみ

**実装内容:**
```typescript
const bgmQuery = trpc.bgm.getAll.useQuery(undefined, {
  enabled: true,
  staleTime: 60 * 60 * 1000, // 1時間
})
```

### ローディング状態

- **ローディング中**: フォールバックトラック（Phase 1マイグレーションで投入された2トラック）を表示
- **実装**: `const tracks = isLoading && FALLBACK_ENABLED ? FALLBACK_TRACKS : (data ?? [])`

**理由**: ユーザー体験を維持 — ローディング中もBGMが使える状態

### エラーハンドリング

- **方式**: フォールバックトラック + 環境変数スイッチ
- **環境変数**: `VITE_BGM_FALLBACK` — `false` 以外の値でフォールバック有効
- **エラー時**: フォールバック有効時はフォールバックトラックを返し続ける

**実装内容:**
```typescript
const FALLBACK_ENABLED = import.meta.env.VITE_BGM_FALLBACK !== 'false'
const FALLBACK_TRACKS: Track[] = [
  { id: '1', title: 'Lo-Fi Study 01', src: '/api/bgm/lofi-01.mp3', artist: 'Chill Beats', color: '#3b82f6' },
  { id: '2', title: 'Lo-Fi Study 02', src: '/api/bgm/lofi-02.mp3', artist: 'Relax Sounds', color: '#8b5cf6' },
]
const tracks = (isLoading && FALLBACK_ENABLED) ? FALLBACK_TRACKS : (data ?? [])
```

**理由**:
- 本番環境ではフォールバックによりユーザー体験を維持
- 開発環境では `VITE_BGM_FALLBACK=false` で無効化し、DB状態を正しく確認可能

### 型定義と互換性

- **Phase 5**: 既存 `Track` 型にマッピング（追加フィールドは破棄）
- **Phase 6**: `ApiTrack` 型を定義し、Admin UI で使用

**Phase 5 実装:**
```typescript
// 既存Track型は変更せず
const tracks = data?.map(({ id, title, src, artist, color }) =>
  ({ id, title, src, artist, color })
) ?? []
```

**理由**:
- プレイヤーは `tier`, `createdAt`, `updatedAt` を使わない
- 既存コード（BgmPlayer.tsx）への影響がゼロ
- Phase 6 で Admin UI 実装時に型拡張

### 既存コードとの整合性

- **エラー状態**: 既存の `hasError` は `Audio` 要素の再生エラー用 — APIエラー用には新規追加せず
- **戻り値**: `useBgm` フックの戻り値型は拡張（`loading`, `error` 追加）

### Claude's Discretion

- `VITE_BGM_FALLBACK` のデフォルト値設定
- エラー時のトースト/通知の有無
- マッピング処理の詳細実装

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### フロントエンド要件

- `.planning/REQUIREMENTS.md` §Frontend - Player — FE-01, FE-02, FE-03, FE-04要件定義

### データベース

- `.planning/phases/01-database/01-CONTEXT.md` — bgm_tracksテーブル構造、既存トラック移行データ
- `functions/lib/schema.ts` — bgmTracksスキーマ定義

### API

- `.planning/phases/03-bgm-api-read/03-CONTEXT.md` — bgm.getAllクエリ仕様、srcフィールド生成
- `src/app/routers/bgm.ts` — getAllクエリ実装済み、返却フィールド（id, title, src, artist, color, tier, createdAt, updatedAt）

### 既存実装

- `src/hooks/useBgm.ts` — 既存Track型定義、ハードコードされたTRACKS配列、useBgmフック実装
- `src/components/bgm/BgmPlayer.tsx` — 既存エラー表示パターン（hasError時の「音源なし」表示）
- `src/hooks/useTodos.ts` — tRPC useQueryパターン参考

### プロジェクト設定

- `.planning/PROJECT.md` — Edge Runtime制約、既存BGM実装情報

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **bgmRouter**: `src/app/routers/bgm.ts` に `getAll` クエリ実装済み
  ```typescript
  getAll: publicProcedure.input(bgmGetAllInputSchema).query(...)
  ```
  - 返却フィールド: `{ id, title, src, artist, color, tier, createdAt, updatedAt }`
  - srcフィールドは `/api/bgm/filename` 形式で生成済み

- **tRPCクライアント**: `src/lib/trpc.ts` で `useQuery` 使用可能

- **既存Track型**: `src/hooks/useBgm.ts` で定義済み
  ```typescript
  export type Track = {
    id: string
    title: string
    src: string
    artist?: string
    color?: string
  }
  ```

- **BgmPlayer.tsx のエラー表示**: `hasError` 時に「音源なし」表示、ボタンは disabled

### Established Patterns

- **tRPC useQuery**: `useTodos.ts` が参考パターン
  ```typescript
  const todosQuery = trpc.todos.getAll.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
  })
  const todos = todosQuery.data ?? []
  const loading = todosQuery.isLoading
  ```

- **ゲストモード**: `publicProcedure` 使用で認証不要
- **Zustand store**: `useTodosStore` パターン（今回の移行では不使用）

### Integration Points

- `src/hooks/useBgm.ts` — 修正対象
  - TRACKS 定数を削除
  - tRPC `bgm.getAll` 使用に変更
  - フォールバックトラック定数を追加（条件付きで使用）

- `src/components/bgm/BgmPlayer.tsx` — 既存エラー表示パターン維持
  - `hasError` は `Audio` 要素の再生エラー用
  - APIエラー表示は追加しない（フォールバックありき）

</code_context>

<specifics>
## Specific Ideas

- フォールバックトラックは Phase 1 マイグレーションと同じ2トラック（Lo-Fi Study 01/02）
- 環境変数 `VITE_BGM_FALLBACK` はデフォルトで有効（開発で無効化したい場合のみ `false` 設定）
- staleTime は1時間 — 管理者がトラックを追加しても、最大1時間はキャッシュが効く
- Phase 6 で Admin UI 実装時に `ApiTrack` 型と変換関数を追加

</specifics>

<deferred>
## Deferred Ideas

- BGMの自動再取得機能（ポーリングやWebSocket）— 必要時に追加
- トラックのプリフェッチ（次のトラックを事前ロード）— 必要時に追加

</deferred>

---

*Phase: 05-player-migration*
*Context gathered: 2026-03-20*
