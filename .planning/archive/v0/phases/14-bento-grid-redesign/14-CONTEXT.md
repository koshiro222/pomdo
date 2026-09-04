# Phase 14: BentoGrid 3カラム再設計 - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

`App.tsx` の Bento Grid を 3 等分列（Timer | Todo | BGM+Stats）に再構成するレイアウト変更。
カード内部コンテンツには一切触れない。CurrentTaskCard の統合は Phase 15 のスコープ。

</domain>

<decisions>
## Implementation Decisions

### ブレイクポイント境界
- 3 カラムレイアウトは `lg`（1024px）以上のみ適用
- `lg` 未満（タブレット含む）はモバイル扱いで全縦積み（中間レイアウトなし）
- 現行の `sm:grid-cols-6` 中間レイアウトは削除する
- `sm:h-screen` → `lg:h-screen` に変更（モバイルはスクロール可能な長いページ、デスクトップは viewport 固定）

### グリッド実装方針
- `grid-cols-1 lg:grid-cols-3` に変更（12 列システムを廃止してシンプルに）
- グリッド自体の `h-full` は維持（main の `flex-1 min-h-0` 構成をそのまま使う）
- 各カードの `motion.div` アニメーション（fadeInUpVariants）はそのまま維持

### 右カラム（BGM+Stats）の配置
- BGM と Stats をラッパー `div`（plain div）で包む — グリッドは 1 セル、内部で `flex flex-col gap-4` で縦積み
- ラッパーには `.bento-card` も `motion.div` も付けない
- BGM（上）と Stats（下）をそれぞれ `flex-1` で均等 50% に高さ分割
- 各カードは引き続き `.bento-card` クラスを維持

### モバイルの縦積み順序
- Timer → Todo → BGM → Stats（HTML 上の DOM 順序でそのまま実現）
- BGM と Stats がラッパーで包まれているため、モバイルでは BGM → Stats が連続して表示される（仕様通り）

### Claude's Discretion
- Framer Motion の `custom` インデックス番号の振り直し
- ラッパー div の具体的なクラス構成（`h-full flex flex-col gap-4` 等）
- `lg:h-screen` 切り替えに伴うモバイル縦スクロールの細かな余白調整

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### レイアウト要件
- `.planning/REQUIREMENTS.md` — LAYOUT-01（3カラム均等）、LAYOUT-02（モバイル縦積み順序）
- `.planning/ROADMAP.md` §Phase 14 — Success Criteria（4 条件）

### 既存レイアウト実装
- `src/App.tsx` — 現行グリッド実装（変更対象）

### スタイルシステム
- `src/index.css` — `.bento-card` クラス定義（glassmorphism スタイル）

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.bento-card`（`src/index.css:288`）: glassmorphism スタイル — 全カードに適用済み、変更不要
- `fadeInUpVariants`（`src/lib/animation.ts`）: Framer Motion の入場アニメーション — 各 `motion.div` で使用中
- `TimerWidget`（`src/App.tsx`）: App.tsx 内定義のローカルコンポーネント — `h-full items-center` で内部レイアウト済み

### Established Patterns
- `layout="position"`: Framer Motion のレイアウトシフト対策（v1.2 決定）— 全 `motion.div` に適用する
- `flex-1 min-h-0`: Flexbox 内の overflow 制御に必須（v1.2 決定）— mainタグ側で設定済み
- `h-full` on grid: 親の flex-1 を受けてグリッドが画面を埋める構成 — 維持する

### Integration Points
- `src/App.tsx` `<main>` 内のグリッド div が変更対象
- `sm:h-screen` → `lg:h-screen` の変更は外側の flex コンテナ（`<div className="relative z-10 flex flex-col ...">` ）
- CurrentTaskCard は Phase 15 で削除予定 — Phase 14 では一時的に右カラムに残すか DOM から外すかはプランナー判断

</code_context>

<specifics>
## Specific Ideas

- グリッド変更後のコード想定:
  ```tsx
  <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
    <motion.div className="bento-card" ...>{/* Timer */}</motion.div>
    <motion.div className="bento-card" ...>{/* Todo */}</motion.div>
    <div className="flex flex-col gap-4 h-full">
      <motion.div className="bento-card flex-1" ...><BgmPlayer /></motion.div>
      <motion.div className="bento-card flex-1" ...><StatsCard /></motion.div>
    </div>
  </div>
  ```
- CurrentTaskCard の扱い: Phase 14 のスコープ外だが DOM から削除するかどうかはプランナーに委ねる（Phase 15 との境界判断）

</specifics>

<deferred>
## Deferred Ideas

- CurrentTaskCard の削除と TodoList への統合 — Phase 15 のスコープ
- タブレット向け 2 カラムレイアウト — 今回は不要、将来の Issue として

</deferred>

---

*Phase: 14-bento-grid-redesign*
*Context gathered: 2026-03-24*
