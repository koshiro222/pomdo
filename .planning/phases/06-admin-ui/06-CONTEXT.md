# Phase 6: Admin UI - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

管理者がブラウザからBGMを管理できるUIを実装する。Headerに管理ボタンを追加し、Adminモーダルを通じてトラックの追加・編集・削除を行う。

tRPC mutations (`bgm.create`, `bgm.update`, `bgm.delete`) はPhase 4で実装済み。このフェーズはフロントエンドUIのみ。

</domain>

<decisions>
## Implementation Decisions

### UI形式

- **方式**: Adminモーダル（専用ページではない）
- **配置**: Headerの管理ボタンから開く
- **実装**: `LoginDialog.tsx`, `MigrateDialog.tsx` と同じパターンで実装
  - `createPortal` + `AnimatePresence` + `motion.div`
  - 背景クリックで閉じる、Escapeキーで閉じる

**理由**: 既存コードの再用性が高く、実装がシンプル。コンテキスト維持（Dashboardを見ながら管理できる）。

### トラック一覧表示

- **方式**: リスト形式（TodoListスタイル）
- **パターン**: `TodoList.tsx`, `TodoItem.tsx` と同じ構造
- **表示項目**: 曲名、アーティスト、色（プレビュー）、tier、編集/削除ボタン
- **ソート順**: 作成日昇順（古いトラックが上 / `createdAt ASC`）

**理由**: 既存コンポーネントの完全再利用、実装最シンプル。

### 編集UI

- **方式**: 編集モーダル（インライン編集ではない）
- **実装**: 既存Dialogパターンのform構造を再利用
- **編集可能項目**: title, artist, color, tier
- **編集不可項目**: id, filename, createdAt, updatedAt

**理由**: バリデーション、エラー表示、ローディング状態の実装が容易。

### ファイルアップロード

- **方式**: ボタンのみ（ドラッグ&ドロップなし）
- **実装**: `<input type="file" />` + FormData
- **バリデーション**: リアルタイムチェック（ファイル選択時に10MB超過を表示）

**理由**: 実装が確実でシンプル。

### 色選択UI

- **方式**: OS標準カラーピッカー（`<input type="color" />`）
- **実装**: hex形式（`#3b82f6`）で保存

**理由**: 実装最シンプル。

### tierフィールド

- **表示**: 一覧に表示
- **編集**: 可能（select/radioボタンで "free" | "premium" 切り替え）
- **デフォルト**: "free"

**理由**: 将来の有料プラン対応を見据えた実装。

### 削除確認

- **方式**: 確認ダイアログ（`MigrateDialog`のような二段階確認）
- **文言**: 「「{title}」を削除しますか？」
- **実装**: 削除ボタン → 確認ダイアログ → 実行

**理由**: 誤操作防止、既存パターンの再利用。

### 空状態

- **方式**: テキストのみ（「No tracks yet」的なシンプル表示）
- **配置**: リスト中央に表示

### 追加ボタン配置

- **場所**: Adminモーダル上部
- **実装**: 一覧リストのヘッダーエリアに配置

### エラーハンドリング

- **方式**: トースト通知（`useToastStore` 使用）
- **対象**: APIエラー、バリデーションエラー
- **form内のエラー表示**: なし（トーストのみ）

**理由**: 既存のtoastsシステム活用。

### ローディング状態

- **追加/編集時**: ボタンをdisabled + ローディングテキスト
- **削除時**: 確認ダイアログ内でローディング表示
- **一覧取得時**: `trpc.bgm.getAll.useQuery` のloading状態を利用

### Claude's Discretion

- 楽観的UI（optimistic updates）の有無
- ローディング中のスケルトン表示有無
- refetchタイミング（追加/編集/削除後の即時refetch）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### フロントエンド要件

- `.planning/REQUIREMENTS.md` §Frontend - Admin UI — UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07要件定義

### 認証

- `.planning/phases/02-authentication/02-CONTEXT.md` — adminロール、adminProcedureミドルウェア、クライアント側isAdmin判定
- `src/hooks/useAuth.ts` — `isAdmin` 関数実装済み

### API

- `.planning/phases/04-bgm-api-write/04-CONTEXT.md` — bgm.create/update/delete mutation仕様、エラーハンドリング
- `src/app/routers/bgm.ts` — mutations実装済み

### 既存実装

- `src/components/layout/Header.tsx` — 管理ボタン追加場所、glassスタイル、useAuthフック使用
- `src/components/dialogs/LoginDialog.tsx` — Dialogパターン、form入力パターン、エラー表示、ローディング状態
- `src/components/dialogs/MigrateDialog.tsx` — 確認ダイアログパターン
- `src/components/todos/TodoList.tsx` — リスト表示パターン、フィルターパターン、空状態表示
- `src/components/todos/TodoItem.tsx` — リストアイテムパターン、アニメーション、編集/削除ボタン
- `src/core/store/ui.ts` — useToastStore（トースト通知）

### プロジェクト設定

- `.planning/PROJECT.md` — Edge Runtime制約、既存BGM実装情報
- `src/lib/animation.ts` — Framer Motionアニメーション定義

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- **useAuth フック**: `src/hooks/useAuth.ts` に `isAdmin` 関数実装済み
  ```typescript
  const { user, isAdmin } = useAuth()
  // isAdmin: boolean — role === 'admin' の場合 true
  ```

- **tRPC mutations**: `src/app/routers/bgm.ts` に実装済み
  ```typescript
  create: adminProcedure.input(bgmCreateInputSchema).mutation(...)
  update: adminProcedure.input(bgmUpdateInputSchema).mutation(...)
  delete: adminProcedure.input(bgmDeleteInputSchema).mutation(...)
  ```

- **tRPC query**: `src/app/routers/bgm.ts` に `getAll` 実装済み
  ```typescript
  getAll: publicProcedure.input(bgmGetAllInputSchema).query(...)
  // 返却: { id, title, src, artist, color, tier, createdAt, updatedAt }
  ```

- **Dialog パターン**: `LoginDialog.tsx`, `MigrateDialog.tsx` が参考実装
  - `createPortal` で `document.body` にマウント
  - `AnimatePresence` + `motion.div` でアニメーション
  - 背景クリック、Escapeキーで閉じる
  - form入力パターン（`rounded-lg border border-cf-border bg-cf-surface px-3 py-2`）

- **List パターン**: `TodoList.tsx`, `TodoItem.tsx` が参考実装
  - `AnimatePresence mode="popLayout"` でアニメーション
  - Framer Motion の `slideInVariants`, `tapAnimation`, `hoverAnimation`
  - 空状態: `text-cf-subtext text-center py-8`

- **Framer Motion アニメーション**: `src/lib/animation.ts` に定義済み
  ```typescript
  export const tapAnimation = { scale: 0.95 }
  export const hoverAnimation = { scale: 1.02 }
  export const slideInVariants = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }
  ```

- **Lucide React アイコン**: 既存インストール済み
  - 管理ボタン用: `Settings`, `Music`, `ListMusic`, `Gauge`
  - 編集/削除用: `Edit2`, `Trash2`, `Plus`, `Upload`

- **Toast Store**: `src/core/store/ui.ts` に `useToastStore` 実装済み
  ```typescript
  const addToast = useToastStore(state => state.addToast)
  addToast({ message: 'エラー', type: 'error' })
  ```

### Established Patterns

- **フォーム入力**: Tailwind CSSクラス `rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary`
- **ボタン**: Framer Motionの `whileHover={{ scale: 1.02 }}` `whileTap={{ scale: 0.98 }}`
- **ローディング**: `disabled={loading}` + `opacity-50`
- **エラー表示**: LoginDialogの `text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2` パターン（ただし今回はトースト使用）

### Integration Points

- **Header.tsx**: 管理ボタン追加
  - 条件: `{isAdmin && (<AdminButton />)}`
  - Icon: `Settings` または `ListMusic`

- **新規コンポーネント**: `src/components/bgm/AdminModal.tsx`
  - AdminModalコンポーネント（メイン）
  - TrackListコンポーネント（リスト表示）
  - TrackItemコンポーネント（各アイテム）
  - AddTrackFormコンポーネント（追加フォーム）
  - EditTrackDialogコンポーネント（編集ダイアログ）
  - DeleteConfirmDialogコンポーネント（削除確認）

- **新規hook**: `src/hooks/useBgmAdmin.ts`（必要に応じて）
  - tRPC mutationsのラッパー
  - または `trpc.bgm.create.useMutation()` を直接使用

</code_context>

<specifics>
## Specific Ideas

- 管理ボタンはHeaderの右側（ユーザーアバターの近く）に配置
- Adminモーダルの幅は `max-w-2xl`（TodoListより広め、編集フォームを収めるため）
- 色プレビューは `div` で `backgroundColor` を表示、クリックで `<input type="color" />` をトリガー
- tier選択は `<select>` またはラジオボタン
- ファイルサイズチェック: `file.size > 10 * 1024 * 1024` でリアルタイム判定

</specifics>

<deferred>
## Deferred Ideas

- ドラッグ&ドロップによるファイルアップロード — UX向上が必要な時に追加
- バッチ削除（複数選択削除） — 単一削除で十分
- トラックのプレビュー再生 — 管理画面では不要
- ソート順のユーザー設定 — 作成日固定で十分

</deferred>

---

*Phase: 06-admin-ui*
*Context gathered: 2026-03-21*
