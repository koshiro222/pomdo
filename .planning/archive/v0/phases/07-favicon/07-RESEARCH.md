# Phase 7: Faviconの実装 - Research

**Researched:** 2026-03-21
**Domain:** Frontend / SVG Assets / Vite
**Confidence:** HIGH

## Summary

Phase 7はlucide-reactのTimerアイコンをベースにしたSVG faviconを実装するシンプルなフェーズです。CONTEXT.mdですべての実装詳細が決定済みであり、特別なライブラリや複雑な処理は不要です。Viteの標準的な静的アセット処理機能を利用し、publicディレクトリにSVGファイルを配置するだけですぐに実装可能です。

**Primary recommendation:** CONTEXT.mdの決定内容に従い、lucide-reactのTimerアイコン構造をそのままSVGとして抽出し、プライマリーカラーでスタイリングしてpublic/favicon.svgに配置する。

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **SVGスタイル詳細**: 円の塗りつぶしはプライマリーカラー（#22c55e）、線の色は白（#ffffff）、線の太さはstroke-width: 2、背景は透明
- **ファイル配置**: ファイル名は`public/favicon.svg`、既存の`public/vite.svg`は削除
- **サイズ設定**: viewBoxは`0 0 24 24`（lucide-react標準）、width/heightは`32`（favicon標準サイズ）
- **Timerアイコン構造**: lucide-react v0.575.0のTimerアイコン（上部バー、針、円の3要素）

### Claude's Discretion
なし - 全ての詳細が決定済み

### Deferred Ideas (OUT of SCOPE)
なし - ディスカッションはフェーズ範囲内で完結
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FAV-01 | lucide-reactのTimerアイコンをベースにしたSVG faviconを作成する | lucide-react v0.575.0のTimerアイコン構造が確認済み（line×2、circle×1） |
| FAV-02 | プライマリーカラー（#22c55e）でfaviconをスタイリングする | CONTEXT.mdで色指定が決定済み。SVGのfill/stroke属性で実装可能 |
| FAV-03 | index.htmlでfaviconを参照する | 現在は`/vite.svg`を参照。これを`/favicon.svg`に変更するだけ |
| FAV-04 | SVG形式でスケーラブルに対応する | SVGはベクターフォーマットのため本質的にスケーラブル。viewBox設定で対応済み |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| なし | - | - | Viteの標準機能で十分 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| なし | - | - | - |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SVGのみ | ICO, PNGフォーマット | SVGはスケーラブルでファイルサイズが小さく、モダンブラウザで広くサポートされている。ICO/PNGはフォールバックとして検討可能だが、v1.1ではSVGのみで十分 |

**Installation:**
```bash
# 追加インストールは不要
```

**Version verification:** 追加パッケージなし

## Architecture Patterns

### Recommended Project Structure
```
public/
├── favicon.svg      # 新規作成（TimerアイコンベースのSVG）
├── vite.svg         # 削除対象
└── audio/           # 既存BGMファイル
index.html           # favicon参照先を変更
```

### Pattern 1: SVG Favicon作成
**What:** lucide-reactのTimerアイコン構造をスタンドアロンSVGとして作成
**When to use:** アプリのブランドアイコンとしてブラウザタブに表示する場合
**Example:**
```svg
<!-- public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <!-- 上部バー -->
  <line x1="10" x2="14" y1="2" y2="2" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <!-- 針 -->
  <line x1="12" x2="15" y1="14" y2="11" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <!-- 円 -->
  <circle cx="12" cy="14" r="8" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
</svg>
```
**Source:** CONTEXT.md §Timerアイコン構造（lucide-react v0.575.0）

### Pattern 2: HTMLでのfavicon参照
**What:** index.htmlでSVG faviconを参照
**When to use:** Viteプロジェクトで静的アセットを参照する場合
**Example:**
```html
<!-- index.html -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```
**Source:** Vite公式ドキュメント - Static Asset Handling §The public Directory

### Anti-Patterns to Avoid
- **相对路径を使用しない**: publicディレクトリのアセットは常にルート絶対パス（`/favicon.svg`）で参照する
- **SVGを最適化しすぎない**: シンプルなアイコンならそのままで十分。SVGO等のツールは不要
- **複雑なアニメーションを避ける**: faviconは静的SVGで実装。アニメーションはv1.1のスコープ外

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| faviconの自動生成 | スクリプトで動的に生成 | 手動でSVGを作成 | faviconは一度作成すればほとんど変更ない。動的生成は過剰 |
| 複数フォーマット変換 | ICO/PNG変換ツール | SVGのみ | モダンブラウザはSVG faviconをサポート。フォールバックはv1.1では不要 |

**Key insight:** シンプルな静的SVGファイルで十分。自動化ツールやビルドプロセスの複雑化は避ける。

## Common Pitfalls

### Pitfall 1: ブラウザキャッシュによるfavicon更新の遅れ
**What goes wrong:** faviconを変更してもブラウザタブに反映されない
**Why it happens:** ブラウザがfaviconを積極的にキャッシュするため
**How to avoid:** 開発中はハードリフレッシュ（Cmd+Shift+R）でキャッシュをクリア
**Warning signs:** SVGを更新してもタブのアイコンが変わらない場合

### Pitfall 2: viewBoxの設定ミス
**What goes wrong:** faviconが正しく表示されない、または一部が切れる
**Why it happens:** viewBoxの設定が不正、またはwidth/heightが指定されていない
**How to avoid:** 必ず`viewBox="0 0 24 24"`と`width="32" height="32"`を指定する
**Warning signs:** faviconが見切れている、または空白で表示される

### Pitfall 3: 色の指定ミス
**What goes wrong:** プライマリーカラーが正しく反映されない
**Why it happens:** fill属性とstroke属性の使い分けを間違える
**How to avoid:** 円は`fill="#22c55e"`、線は`stroke="#ffffff"`を指定する
**Warning signs:** 色が期待と異なる、または一部が黒で表示される

## Code Examples

Verified patterns from official sources:

### SVG Favicon基本構造
```svg
<!-- Source: CONTEXT.md §Timerアイコン構造 -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
  <line x1="10" x2="14" y1="2" y2="2" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <line x1="12" x2="15" y1="14" y2="11" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="14" r="8" fill="#22c55e" stroke="#ffffff" stroke-width="2"/>
</svg>
```

### index.htmlでの参照
```html
<!-- index.html: 現在の設定 -->
<link rel="icon" type="image/svg+xml" href="/vite.svg" />

<!-- 変更後 -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```
**Source:** Vite公式ドキュメント - Static Asset Handling

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ICOフォーマット（複数サイズ埋め込み） | SVG（スケーラブル） | 2020年代前半 | モダンブラウザはSVG faviconをネイティブサポート |
| PNGフォールバック | SVGのみ | 2020年代 | ほぼ全てのブラウザがSVGをサポート |

**Deprecated/outdated:**
- favicon.ico（マルチサイズ埋め込み）: SVGで十分にスケーラブル
- favicon-generatorツール: シンプルなSVGなら手動作成で十分

## Open Questions

なし - CONTEXT.mdですべての決定事項が明確化されている

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + Playwright 1.58.2 |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FAV-01 | TimerアイコンベースのSVG faviconが存在する | manual-only | - | ❌ Wave 0 |
| FAV-02 | プライマリーカラー（#22c55e）でスタイリングされている | manual-only | - | ❌ Wave 0 |
| FAV-03 | index.htmlでfaviconが参照されている | manual-only | - | ❌ Wave 0 |
| FAV-04 | SVG形式でスケーラブル | manual-only | - | ❌ Wave 0 |

**Note:** Favicon実装は視覚的検証が主となるため、自動テストは適さない。手動テスト（Wave 0）で対応。

### Sampling Rate
- **Per task commit:** 手動検証（ブラウザタブでfaviconを確認）
- **Per wave merge:** `npm run build && npm run preview` で本番ビルド後のfavicon表示を確認
- **Phase gate:** ブラウザタブでfaviconが正しく表示されていることを目視確認

### Wave 0 Gaps
- [ ] `tests/e2e/favicon.spec.ts` — ブラウザタブでのfavicon表示確認（手動テスト手順書）
- [ ] Playwright設定にfavicon検証用ヘルパー関数の追加（オプション）

*(Faviconは主に視覚的な要素であり、自動テストでの検証は困難。手動テスト手順書を作成し、Wave 0で対応)*

## Sources

### Primary (HIGH confidence)
- [Vite公式ドキュメント - Static Asset Handling](https://vite.dev/guide/assets.html) — publicディレクトリの使い方、静的アセットの参照方法
- CONTEXT.md — Timerアイコン構造、色指定、ファイル配置の決定事項
- REQUIREMENTS.md — FAV-01〜FAV-04の要件定義
- `node_modules/lucide-react/dist/esm/icons/timer.js` — TimerアイコンのSVG構造確認

### Secondary (MEDIUM confidence)
- なし - WebSearchが不安定だったため、一次ソースのみを使用

### Tertiary (LOW confidence)
- なし - WebSearchが機能しなかったため、未使用

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - 追加ライブラリ不要。Vite標準機能で十分。
- Architecture: HIGH - CONTEXT.mdの決定事項に基づき、実装パスが明確。
- Pitfalls: MEDIUM - ブラウザキャッシュの問題は一般的だが、解決策も標準的。

**Research date:** 2026-03-21
**Valid until:** 2026-04-21（30日 - Viteの静的アセット処理は安定しているため）
