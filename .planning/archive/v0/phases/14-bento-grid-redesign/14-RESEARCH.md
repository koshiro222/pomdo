# Phase 14: BentoGrid 3カラム再設計 - Research

**Researched:** 2026-03-24
**Domain:** Tailwind CSS グリッドレイアウト / Framer Motion レイアウト
**Confidence:** HIGH

---

<user_constraints>
## User Constraints（CONTEXT.md より転記）

### Locked Decisions

**ブレイクポイント境界**
- 3カラムレイアウトは `lg`（1024px）以上のみ適用
- `lg` 未満（タブレット含む）はモバイル扱いで全縦積み（中間レイアウトなし）
- 現行の `sm:grid-cols-6` 中間レイアウトは削除する
- `sm:h-screen` → `lg:h-screen` に変更（モバイルはスクロール可能な長いページ、デスクトップは viewport 固定）

**グリッド実装方針**
- `grid-cols-1 lg:grid-cols-3` に変更（12列システムを廃止してシンプルに）
- グリッド自体の `h-full` は維持（main の `flex-1 min-h-0` 構成をそのまま使う）
- 各カードの `motion.div` アニメーション（fadeInUpVariants）はそのまま維持

**右カラム（BGM+Stats）の配置**
- BGMとStatsをラッパー `div`（plain div）で包む — グリッドは1セル、内部で `flex flex-col gap-4` で縦積み
- ラッパーには `.bento-card` も `motion.div` も付けない
- BGM（上）とStats（下）をそれぞれ `flex-1` で均等50%に高さ分割
- 各カードは引き続き `.bento-card` クラスを維持

**モバイルの縦積み順序**
- Timer → Todo → BGM → Stats（HTML上のDOM順序でそのまま実現）
- BGMとStatsがラッパーで包まれているため、モバイルではBGM → Statsが連続して表示される（仕様通り）

### Claude's Discretion
- Framer Motion の `custom` インデックス番号の振り直し
- ラッパー div の具体的なクラス構成（`h-full flex flex-col gap-4` 等）
- `lg:h-screen` 切り替えに伴うモバイル縦スクロールの細かな余白調整

### Deferred Ideas（スコープ外）
- CurrentTaskCard の削除と TodoList への統合 — Phase 15 のスコープ
- タブレット向け2カラムレイアウト — 今回は不要、将来の Issue として
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LAYOUT-01 | ユーザーはデスクトップでTimer・Todo・BGM+Statsの3カラム均等分割レイアウトを確認できる | `grid-cols-1 lg:grid-cols-3` で均等3列実現。BGM+Statsは plain div ラッパーで1グリッドセルに収める |
| LAYOUT-02 | ユーザーはモバイルでTimer→Todo→BGM→Statsの縦積み順序を確認できる | DOM順序: Timer → Todo → ラッパー(BGM+Stats) で自然に実現。`grid-cols-1` デフォルトで縦積み |
</phase_requirements>

---

## Summary

Phase 14 は `src/App.tsx` のBento Gridを12列システムから3カラム均等システムに切り替えるレイアウト変更のみのフェーズ。カード内部コンテンツへの変更は一切ない。

現行実装は `grid-cols-1 sm:grid-cols-6 lg:grid-cols-12` の3段階ブレイクポイントと複雑なcolumn/row span指定を使用している。これを `grid-cols-1 lg:grid-cols-3` のシンプルな2段階に切り替える。右カラムのBGM+StatsはCSS Gridの1セルに収めつつ、内部で `flex flex-col` で縦積みにする。

変更対象は `src/App.tsx` 内のグリッドdivと外側コンテナの `sm:h-screen`→`lg:h-screen` の2箇所。`src/index.css` の `.bento-card` クラスは変更不要。

**Primary recommendation:** `grid-cols-1 lg:grid-cols-3 h-full gap-4` でグリッドを再定義し、各カラムにTimer・Todo・BGM+Statsラッパーを配置する。

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS | 4.2.x（@tailwindcss/vite） | グリッド・レスポンシブ実装 | プロジェクト標準。`grid-cols-*` ユーティリティで宣言的に記述 |
| Framer Motion | 12.35.x | レイアウトアニメーション | `layout="position"` でレイアウトシフト防止済み（v1.2確定） |

### 変更対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/App.tsx` | グリッドclassname変更・BGM+Statsラッパー追加・`sm:h-screen`→`lg:h-screen` |
| `src/index.css` | **変更なし** — `.bento-card` はそのまま再利用 |
| `src/lib/animation.ts` | **変更なし** — `fadeInUpVariants` はそのまま |

**Installation:** 追加インストール不要。

---

## Architecture Patterns

### 変更後のグリッド構造

```
AppMain
└── div.relative.z-10.flex.flex-col.min-h-screen.lg:h-screen  ← sm: → lg: に変更
    ├── Header
    ├── main.flex-1.p-4.min-h-0
    │   └── div.h-full.grid.grid-cols-1.lg:grid-cols-3.gap-4  ← グリッド再定義
    │       ├── motion.div.bento-card            [カラム1: Timer]
    │       ├── motion.div.bento-card            [カラム2: Todo]
    │       └── div.h-full.flex.flex-col.gap-4  [カラム3: BGM+Statsラッパー]
    │           ├── motion.div.bento-card.flex-1  [BGMPlayer]
    │           └── motion.div.bento-card.flex-1  [StatsCard]
    └── Footer
```

### Pattern 1: 3カラム均等グリッド

**What:** Tailwind の `grid-cols-3` はデフォルトで均等幅（各 1/3）。explicit な `col-span` 指定が不要になり、シンプルになる。
**When to use:** 全カラム均等幅の場合。

```tsx
// CONTEXT.md の Specific Ideas より
<div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
  <motion.div className="bento-card" ...>{/* Timer */}</motion.div>
  <motion.div className="bento-card" ...>{/* Todo */}</motion.div>
  <div className="flex flex-col gap-4 h-full">
    <motion.div className="bento-card flex-1" ...><BgmPlayer /></motion.div>
    <motion.div className="bento-card flex-1" ...><StatsCard /></motion.div>
  </div>
</div>
```

### Pattern 2: Framer Motion custom インデックス振り直し

**What:** `fadeInUpVariants` の `custom` prop はスタガードアニメーションの遅延インデックス（`i * 0.1`秒）。DOM順序に合わせて振り直す。
**推奨インデックス:**
- Timer: `custom={0}`
- Todo: `custom={1}`
- BGM（ラッパー内）: `custom={2}`
- Stats（ラッパー内）: `custom={3}`

CurrentTaskCard は Phase 15 で削除予定のため、Phase 14 では現行の `custom={1}` を維持しつつDOM順序を後ろに移すか削除するかはプランナーが判断する。

### Pattern 3: モバイルスクロール対応

**What:** `sm:h-screen` を `lg:h-screen` に変更することで、`lg` 未満ではコンテナが `min-h-screen` のみになりスクロール可能になる。
**注意:** `overflow-hidden` が外側 `div.font-display.bg-cf-background` に付いていないことを確認（App.tsx 151行目: `overflow-hidden` はある）。モバイルでスクロールが必要な場合は `overflow-hidden` の影響範囲を確認すること。

### Anti-Patterns to Avoid

- **12列 column/row span の残存:** `sm:col-span-*` `lg:col-span-*` `lg:row-span-*` の指定は全て削除する。3カラム均等では不要。
- **ラッパー div に `.bento-card` を付ける:** ラッパーはグリッドコンテナのみ。glassmorphism スタイルはラッパー自体には不要。
- **ラッパー div に `motion.div` を使う:** ラッパーはプレーン div。アニメーションは内包するBGM/Statsの各カードに適用。

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| レスポンシブグリッド | カスタム CSS Grid | Tailwind `grid-cols-1 lg:grid-cols-3` | ブレイクポイント一貫性、purge対応済み |
| レイアウトアニメーション | CSS transition 手書き | Framer Motion `layout="position"` | グリッド変更時のシフト防止。v1.2 で確立済みパターン |
| 高さ均等分割 | calc() 手書き | `flex-1` | Flexbox が自動で均等分割 |

**Key insight:** Tailwind の `grid-cols-3` はデフォルトで `grid-template-columns: repeat(3, minmax(0, 1fr))` を生成する。明示的な幅指定は不要。

---

## Common Pitfalls

### Pitfall 1: `overflow-hidden` によるモバイルスクロール不可

**What goes wrong:** 外側コンテナ（`div.font-display`、App.tsx 151行目）に `overflow-hidden` がある。`lg:h-screen` → `min-h-screen` のみになった場合でも overflow-hidden が縦スクロールを遮断する可能性。
**Why it happens:** デスクトップ用の背景固定レイアウトと overflow 設定が共存している。
**How to avoid:** `overflow-hidden` を外側コンテナから外すか、`overflow-y-auto` に変更。または `lg:overflow-hidden` に限定する。
**Warning signs:** モバイルでページ下部（Stats部分）が見切れてスクロールできない。

### Pitfall 2: `h-full` がグリッドコンテナに伝搬しない

**What goes wrong:** `main` の `flex-1 min-h-0` を外したり変更すると、グリッドの `h-full` が機能しない（親の高さが未定義になるため）。
**Why it happens:** CSS の height: 100% は親要素に明示的な高さが必要。flex-1 + min-h-0 は Flexbox 内での高さ伝搬に必須。
**How to avoid:** `<main className="flex-1 p-4 min-h-0">` の `min-h-0` を削除しない。
**Warning signs:** デスクトップでグリッドが viewport 全体を埋めない。

### Pitfall 3: CurrentTaskCard の扱い

**What goes wrong:** Phase 14 では CurrentTaskCard の配置が決まっていない。12列システムでは独立したセルだったが、3カラムシステムでどのカラムに置くかによってレイアウトが崩れる。
**Why it happens:** Phase 15 で削除予定のカードが Phase 14 のスコープに隣接している。
**How to avoid:** CONTEXT.md の Specifics 参照 — CurrentTaskCard は Phase 14 では DOM から外す（非表示）か、TodoカラムかBGM+Statsラッパー内に一時的に収容する。プランナーが判断する。
**Warning signs:** グリッドに4番目のセルが発生してレイアウトが崩れる。

### Pitfall 4: モバイルでのカード高さ不足

**What goes wrong:** デスクトップでは `h-full` でカードが画面いっぱいに広がるが、モバイルでは高さが content-driven になる。カード内の `h-full` スタイルがモバイルで機能しない可能性。
**Why it happens:** グリッドが `grid-cols-1` の場合、各セルの高さはコンテンツに依存する。
**How to avoid:** モバイルではカードに明示的な最小高さ（`min-h-64` 等）を設定するか、コンテンツが十分な高さを持つことを確認する。
**Warning signs:** TimerウィジェットやTodoListがモバイルで潰れて見える。

---

## Code Examples

### 変更後の最終形（CONTEXT.md Specific Ideas より）

```tsx
// src/App.tsx — main 内のグリッド部分
// 変更前: <div className="h-full grid grid-cols-1 sm:grid-cols-6 lg:grid-cols-12 gap-4">
// 変更後:
<div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
  {/* カラム1: Timer */}
  <motion.div
    className="bento-card"
    variants={fadeInUpVariants}
    initial="hidden"
    animate="visible"
    custom={0}
    layout="position"
  >
    <TimerWidget ... />
  </motion.div>

  {/* カラム2: Todo */}
  <motion.div
    className="bento-card"
    variants={fadeInUpVariants}
    initial="hidden"
    animate="visible"
    custom={1}
    layout="position"
  >
    <TodoList />
  </motion.div>

  {/* カラム3: BGM + Stats ラッパー（plain div） */}
  <div className="h-full flex flex-col gap-4">
    <motion.div
      className="bento-card flex-1"
      variants={fadeInUpVariants}
      initial="hidden"
      animate="visible"
      custom={2}
      layout="position"
    >
      <BgmPlayer />
    </motion.div>
    <motion.div
      className="bento-card flex-1"
      variants={fadeInUpVariants}
      initial="hidden"
      animate="visible"
      custom={3}
      layout="position"
    >
      <StatsCard />
    </motion.div>
  </div>
</div>
```

### 外側コンテナの変更

```tsx
// 変更前: className="relative z-10 flex flex-col min-h-screen sm:h-screen"
// 変更後:
<div className="relative z-10 flex flex-col min-h-screen lg:h-screen">
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 12列grid + col-span指定 | 3カラム均等grid | Phase 14 | 管理コードが大幅に削減される |
| sm:h-screen（768px以上でviewport固定） | lg:h-screen（1024px以上でviewport固定） | Phase 14 | タブレットでもスクロール可能になる |
| 中間ブレイクポイント（sm/lg 2段階） | 1ブレイクポイント（lg のみ） | Phase 14 | レスポンシブ挙動がシンプルになる |

---

## Open Questions

1. **CurrentTaskCard の扱い**
   - What we know: Phase 15 で削除予定。現行では `bento-card sm:col-span-2 lg:col-span-2 lg:row-span-1` で独立したセル。
   - What's unclear: Phase 14 で DOM から削除すべきか、どのカラムに一時収容するか。CONTEXT.md には「プランナー判断」と記載。
   - Recommendation: Phase 14 でDOM削除するのが最も安全（Phase 15 との境界を明確にする）。ただし Phase 15 の実装前に削除すると CurrentTask 機能が失われる。Todoカラムの `motion.div` 内に配置する案が最も侵襲が少ない。

2. **モバイルでの `overflow-hidden` の影響**
   - What we know: `div.font-display` に `overflow-hidden` がある（App.tsx 151行目）。
   - What's unclear: `lg:h-screen` 変更後にモバイルでスクロールができるか。
   - Recommendation: `overflow-hidden` を `lg:overflow-hidden` に変更するか、縦スクロールのみ許可する `overflow-x-hidden` に変更する。実装後のビジュアル確認が必須。

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.x + Testing Library 16.x |
| Config file | vite.config.ts（vitestの設定内包）|
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LAYOUT-01 | デスクトップで3カラム均等表示 | visual/e2e | `npm run test:e2e` | ❌ Wave 0 |
| LAYOUT-02 | モバイルで縦積み順序（Timer→Todo→BGM→Stats） | visual/e2e | `npm run test:e2e` | ❌ Wave 0 |

**注意:** LAYOUT-01、LAYOUT-02 はCSSレイアウトの視覚的検証が必要なため、Vitest ユニットテストでは検証不可能。PlaywrightによるE2Eテストが適切。

既存ユニットテストへの影響確認:
- `src/components/stats/StatsCard.test.tsx` — StatsCard コンポーネント内部テスト。App.tsx 変更の影響なし。
- `src/components/todos/TodoItem.test.tsx` — TodoItem 内部テスト。影響なし。
- `src/components/layout/Header.test.tsx` — Header 内部テスト。影響なし。

### Sampling Rate

- **Per task commit:** `npm test -- --run`（既存ユニットテストが壊れていないか確認）
- **Per wave merge:** `npm test -- --run`（全ユニットテスト）
- **Phase gate:** E2Eで3カラム・縦積み両方の視覚確認後、`/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/e2e/layout.spec.ts` — LAYOUT-01 のデスクトップ3カラム表示確認（Playwright viewport: 1280x800）
- [ ] `tests/e2e/layout.spec.ts` — LAYOUT-02 のモバイル縦積み順序確認（Playwright viewport: 375x667）

既存テストインフラ（Playwright, vitest, vite.config.ts）は整備済みのためフレームワーク追加は不要。

---

## Sources

### Primary（HIGH confidence）

- `src/App.tsx`（直接コード確認）— 現行グリッド実装、変更対象の特定
- `src/index.css` L287-296（直接コード確認）— `.bento-card` クラス定義
- `src/lib/animation.ts`（直接コード確認）— `fadeInUpVariants` の `custom` 動作
- `.planning/phases/14-bento-grid-redesign/14-CONTEXT.md`（直接確認）— ロック済み決定事項

### Secondary（MEDIUM confidence）

- Tailwind CSS v4 公式仕様（`grid-cols-3` = `repeat(3, minmax(0, 1fr))`）— 均等幅の確認
- Framer Motion `layout="position"` — v1.2 で確立済みパターンとして STATE.md に記録

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Tailwind/Framer Motion はプロジェクト標準として確認済み
- Architecture: HIGH — 変更箇所が明確。CONTEXT.md に最終コード形も記載済み
- Pitfalls: MEDIUM — `overflow-hidden` の挙動は実装後確認が必要

**Research date:** 2026-03-24
**Valid until:** 2026-04-24（Tailwind/Framer Motion は安定版のため30日有効）
