# Phase 7: Faviconの実装 - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

ブラウザタブにアプリらしいアイコンを表示してブランド認知を高める。lucide-reactのTimerアイコンをベースにしたSVG faviconを作成し、プライマリーカラーでスタイリングする。

</domain>

<decisions>
## Implementation Decisions

### SVGスタイル詳細
- **円の塗りつぶし**: プライマリーカラー（#22c55e）で塗りつぶし
- **線の色**: 白（#ffffff）
- **線の太さ**: stroke-width: 2（標準）
- **背景**: 透明背景（ダークモード対応）

### ファイル配置
- **ファイル名**: `public/favicon.svg`
- **既存ファイル**: `public/vite.svg` は削除

### サイズ設定
- **viewBox**: `0 0 24 24`（lucide-react標準）
- **width/height**: `32`（favicon標準サイズを明示的に指定）

### Timerアイコン構造
lucide-react v0.575.0のTimerアイコン構造:
- 上部バー: `<line x1="10" x2="14" y1="2" y2="2" />`
- 針: `<line x1="12" x2="15" y1="14" y2="11" />`
- 円: `<circle cx="12" cy="14" r="8" />`

### Claude's Discretion
なし - 全ての詳細が決定済み

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Favicon仕様
- REQUIREMENTS.md §FAV-01〜FAV-04 — Favicon要件（Timerアイコン、プライマリーカラー、SVG形式）
- PROJECT.md — プライマリーカラー定義（#22c55e）、lucide-react使用

### 既存コード
- `index.html` — 現在のfavicon参照（`/vite.svg`）
- `public/vite.svg` — 削除対象の既存favicon
- `node_modules/lucide-react/dist/esm/icons/timer.js` — TimerアイコンSVG構造参照

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **lucide-react**: プロジェクトで既に使用中、Timerアイコン構造が確認済み
- **プライマリーカラー**: #22c55e（Deep Forestテーマ）で既に統一

### Established Patterns
- **SVG配置**: public/ ディレクトリに静的アセットを配置
- **HTML参照**: index.htmlの `<link rel="icon">` でfaviconを参照

### Integration Points
- **index.html**: favicon参照先を `/vite.svg` から `/favicon.svg` に変更
- **public/ ディレクトリ**: favicon.svg の配置先

</code_context>

<specifics>
## Specific Ideas

lucide-reactのTimerアイコンをそのままSVGとして抽出し、プライマリーカラーと白でスタイリングする。シンプルで認識しやすいデザイン。

</specifics>

<deferred>
## Deferred Ideas

なし — ディスカッションはフェーズ範囲内で完結

</deferred>

---

*Phase: 07-favicon*
*Context gathered: 2026-03-21*
