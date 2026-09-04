---
phase: 14
slug: bento-grid-redesign
status: draft
shadcn_initialized: true
preset: "style: new-york / baseColor: neutral / cssVariables: true"
created: "2026-03-24"
---

# Phase 14 — UI デザインコントラクト

> BentoGrid 3カラム再設計のビジュアル・インタラクションコントラクト。
> gsd-ui-researcher が生成し、gsd-ui-checker が検証する。

---

## デザインシステム

| プロパティ | 値 | ソース |
|-----------|---|--------|
| Tool | shadcn | components.json 検出済み |
| Preset | style: new-york / baseColor: neutral / cssVariables: true | components.json |
| Component library | Radix UI（shadcn経由） | components.json |
| Icon library | lucide-react | components.json `"iconLibrary": "lucide"` |
| Font | Manrope（--font-family-display） | src/index.css L12 |

---

## スペーシングスケール

Phase 14 はレイアウト構造変更のみ。グリッド間隔は既存の `gap-4`（16px）を継続使用。

| トークン | 値 | 用途 |
|---------|---|------|
| xs | 4px | アイコン間隔、インラインパディング |
| sm | 8px | コンパクト要素の間隔 |
| md | 16px | グリッド gap（gap-4）、デフォルト要素間隔 |
| lg | 24px | セクションパディング |
| xl | 32px | レイアウトギャップ |
| 2xl | 48px | 主要セクション区切り |
| 3xl | 64px | ページレベルスペーシング |

例外:
- グリッド gap: 16px（`gap-4`）— CONTEXT.md 決定によりそのまま維持
- main padding: 16px（`p-4`）— 変更なし

---

## タイポグラフィ

Phase 14 はカード内部コンテンツを変更しない。以下は既存プロジェクトのタイポグラフィ定義を記録したもの（変更対象外）。

| ロール | サイズ | ウェイト | 行高 | ソース |
|-------|--------|---------|------|--------|
| Body | 14px | 400（regular） | 1.5 | プロジェクト標準（Tailwind デフォルト） |
| Label | 12px | 500（medium） | 1.4 | カード内ラベル（既存実装） |
| Heading | 20px | 600（semibold） | 1.2 | カードタイトル（既存実装） |
| Display | 48px | 700（bold） | 1.1 | タイマー数字（TimerDisplay） |

フォントファミリー: `font-display`（= Manrope, sans-serif）

---

## カラー

Deep Forest カラースキームを使用。Phase 14 では新色の追加なし。

| ロール | 値 | 用途 |
|-------|---|------|
| Dominant (60%) | `--df-bg-surface: #121814` | アプリ背景、ページサーフェス |
| Secondary (30%) | `--df-bg-elevated: #1a211c` | `.bento-card` 背景（color-mix 40% transparent） |
| Accent (10%) | `--df-accent-primary: #22c55e` | 完了状態、フォーカスインジケーター、プライマリボタン |
| Destructive | `--df-accent-danger: #ef4444` | 削除アクションのみ |

アクセント予約要素（グリーン `#22c55e` のみに使用）:
- タスク完了チェックマーク
- タイマー動作中のリングカラー
- プライマリ CTA ボタン背景

補助セマンティックカラー:
- フォーカスリング: `--df-accent-focus: #3b82f6`（青）— `*:focus-visible` に適用済み
- 休憩インジケーター: `--df-accent-break: #f59e0b`（アンバー）— タイマーセッション種別表示

`.bento-card` スタイル（変更不要）:
```css
background: color-mix(in srgb, var(--df-bg-elevated), transparent 40%);
backdrop-filter: blur(12px);
border: 1px solid var(--df-border-subtle); /* rgba(255,255,255,0.06) */
border-radius: 1.5rem;
```

ホバー時ボーダー: `rgba(255,255,255,0.15)`

---

## レイアウトコントラクト

Phase 14 の主要な変更内容を規定する。

### グリッド構造

```
AppMain（div.font-display.bg-cf-background）
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

### ブレイクポイント境界

| ブレイクポイント | 幅 | レイアウト |
|---------------|---|----------|
| デフォルト（モバイル） | < 1024px | 1カラム縦積み（grid-cols-1） |
| lg以上（デスクトップ） | >= 1024px | 3カラム均等（lg:grid-cols-3） |

中間ブレイクポイント（sm: 768px）: 廃止。`sm:grid-cols-6` および関連 `col-span` 指定を全て削除。

### カラム幅

`grid-cols-3` = `grid-template-columns: repeat(3, minmax(0, 1fr))`
各カラム厳密に 1/3 幅。明示的な `col-span` 指定不要。

### モバイル縦積み順序

Timer → Todo → BGM → Stats（DOM順序そのまま）

BGMとStatsはラッパーdivで包まれているが `grid-cols-1` 時は通常ブロックとして展開されるため、BGM→Statsの連続表示となる（仕様通り）。

### 高さ制御

- デスクトップ（lg以上）: `lg:h-screen` でviewport固定
- モバイル（lg未満）: `min-h-screen` のみ（スクロール可能）
- `overflow-hidden` を `lg:overflow-hidden` に変更し、モバイルスクロールを有効化

### Framer Motion アニメーション

`fadeInUpVariants` + `layout="position"` は全 `motion.div` で維持。
`custom` インデックス再割り当て:

| カード | custom値 |
|-------|---------|
| Timer | 0 |
| Todo | 1 |
| BGMPlayer | 2 |
| StatsCard | 3 |

CurrentTaskCard は Phase 14 では DOM から削除（または非表示）。Phase 15 で TodoList へ統合予定。

---

## コピーライティングコントラクト

Phase 14 はレイアウト再構成のみ。新規 UI テキスト・CTA・空状態コピーの追加はない。

| 要素 | コピー | 備考 |
|-----|-------|------|
| Primary CTA | なし | Phase 14 スコープ外 |
| 空状態ヘッダー | なし | カード内部変更なし |
| 空状態本文 | なし | カード内部変更なし |
| エラー状態 | なし | レイアウト変更のみ |
| 破壊的操作確認 | なし | Phase 14 に破壊的操作なし |

---

## レジストリセーフティ

| レジストリ | 使用ブロック | セーフティゲート |
|-----------|-----------|----------------|
| shadcn official | checkbox（既存） | 不要 |
| サードパーティ | なし | 該当なし |

`components.json` の `"registries": {}` によりサードパーティレジストリは未登録。

---

## インタラクションコントラクト

Phase 14 で変更されるインタラクション:

| インタラクション | 変更前 | 変更後 |
|---------------|-------|-------|
| 画面サイズ変更時のレイアウト | sm(768px)とlg(1024px)の2段階 | lg(1024px)のみの1段階 |
| モバイルスクロール | sm以上でviewport固定（スクロール不可） | lg未満でスクロール可能 |
| カード入場アニメーション | custom 0-4（CurrentTaskCard含む） | custom 0-3（CurrentTaskCard削除後） |

変更なしのインタラクション:
- 各カード内部のすべてのインタラクション
- タイマー操作（開始・一時停止・リセット・スキップ）
- BGMプレーヤー操作
- TodoList のタスク追加・完了・削除
- Stats の表示

---

## チェッカーサインオフ

- [ ] ディメンション1 コピーライティング: PASS
- [ ] ディメンション2 ビジュアル: PASS
- [ ] ディメンション3 カラー: PASS
- [ ] ディメンション4 タイポグラフィ: PASS
- [ ] ディメンション5 スペーシング: PASS
- [ ] ディメンション6 レジストリセーフティ: PASS

**承認:** pending
