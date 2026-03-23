# Phase 12: 物理的インタラクション改善 - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

ユーザーはタッチ・マウス操作で快適にアプリを使える（44pxターゲット、適切なカーソル、オーバーフローなし）。

新機能追加ではなく、既存UIの物理的インタラクション改善が範囲。
</domain>

<decisions>
## Implementation Decisions

### タッチターゲットサイズ
- 全ての小さなアイコンボタンに`p-3`（12pxパディング）を追加して44px以上のタッチターゲットを確保
- 対象: BgmPlayerの次/前ボタン、プレイリストボタン、TodoItemの削除ボタン、TrackItemの編集削除ボタン等
- ホバー時の視覚的フィードバック: `hover:bg-white/10`で薄い背景色を表示
- 音量スライダーのつまみ（16px）は除外（特別なUIパターンとして）
- 実装例: `className="p-3 text-cf-subtext hover:bg-white/10 transition-colors"`

### カーソルポインター統一
- `index.css`の`@layer base`で`button { cursor: pointer; }`をグローバル定義
- ドラッグハンドルの`cursor-grab active:cursor-grabbing`はTailwindクラスで上書き（優先順位問題なし）
- Phase 11のfocusスタイルと同様のグローバル定義アプローチを採用

### モバイルオーバーフロー
- 各カードルート（TodoList、CurrentTaskCard、BgmPlayer等）の`overflow-hidden`は削除
- アニメーション用の`overflow-hidden`（Framer Motion等）は維持
- App.tsxのルート要素（`min-h-screen`）の`overflow-hidden`は全画面レイアウト用として維持

### アルバムアート表示
- BgmPlayerのアルバムアートサイズを96pxで固定（`w-24 h-24`）
- レスポンシブ縮小（`sm:w-32 sm:h-32`）は削除
- 一貫性とレイアウト安定性を優先

### Claude's Discretion
- 各ボタンの具体的なパディング値（p-3で問題なければ調整不要）
- ホバー時の背景色の濃度（white/10で問題なければ調整不要）

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — v1.3要件（TOUCH-01, TOUCH-02, RESP-06, RESP-07）

### Phase Definition
- `.planning/ROADMAP.md` — Phase 12の成功基準（4項目）

### Design System
- `.planning/DESIGN.md` — Spacing Scale（4px基数）、Animation、Component Examples
- `src/index.css` — `@layer base`にグローバルcursor定義を追加

### Target Components
- `src/components/bgm/BgmPlayer.tsx` — 次/前ボタン、プレイリストボタン、音量スライダー、overflow-hidden
- `src/components/todos/TodoItem.tsx` — 削除ボタン、ドラッグハンドル
- `src/components/bgm/TrackItem.tsx` — 編集削除ボタン
- `src/components/timer/TimerControls.tsx` — 既に適切なサイズ（size-14）の参考例
- `src/components/todos/TodoList.tsx` — overflow-hidden削除対象
- `src/components/tasks/CurrentTaskCard.tsx` — overflow-hidden削除対象
- `src/App.tsx` — ルート要素のoverflow-hidden維持確認

### Codebase Maps
- `.planning/codebase/CONVENTIONS.md` — コンポーネントパターン
- `.planning/codebase/STRUCTURE.md` — コンポーネント構造

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **lucide-react** — GripVertical（ドラッグ）, Trash2（削除）, Edit（編集）, SkipBack/SkipForward（スキップ）, List（プレイリスト）等のアイコン
- **framer-motion** — motion.button等のアニメーションコンポーネント
- **Tailwind CSS v4** — @theme, @custom-variant, @layer機能

### Established Patterns
- **大きなタッチターゲット**: TimerControlsの`size-14`（56px）、BgmPlayer再生ボタンの`w-14 h-14`（56px）
- **カーソルスタイル**: ドラッグハンドルに`cursor-grab active:cursor-grabbing`（Phase 11で決定）
- **Focusスタイル**: `*:focus-visible`で青色2px枠（Phase 11で実装）

### Integration Points
- **index.css @layer base**: `button { cursor: pointer; }`のグローバルスタイル追加
- **各カードコンポーネント**: `overflow-hidden`の削除

### Current Issues
- 小さなアイコンボタン（w-5 h-5、size={16}等）が44pxタッチターゲット要件を満たしていない
- 一部の対話要素に`cursor-pointer`が付与されていない
- 各カードの`overflow-hidden`でモバイルでコンテンツが切り取られる可能性

</code_context>

<specifics>
## Specific Ideas

- パディング追加は既存の視覚的デザインを維持しつつ、ホバー時に背景色が付くことでクリッカブル範囲が分かるようにする
- グローバルCSSでのcursor-pointer定義は、Phase 11のfocusスタイル実装と同様のアプローチ
- アルバムアートは固定サイズにすることで、デザインシステムの一貫性を維持

</specifics>

<deferred>
## Deferred Ideas

- **音量スライダーのつまみ拡大** — スライダーは特別なUIパターンとして除外
- **ボタンスタイル統一** — Phase 13（CONS-01, CONS-02）で対応

</deferred>

---

*Phase: 12-physical-interaction*
*Context gathered: 2026-03-24*
