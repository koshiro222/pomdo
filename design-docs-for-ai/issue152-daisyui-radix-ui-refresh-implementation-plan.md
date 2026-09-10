# Issue #152: UI実装基盤を daisyUI + Radix-ui に刷新する — 実装計画

対象 Issue: https://github.com/koshiro222/pomdo/issues/152
対象 ADR: `docs/adr/0010-daisyui-radix-ui-refresh.md`（全文はこの計画の§1に転記済み。実装エージェントは ADR を別途読む必要はない）
スコープ: Issue 全体（PR分割なし）

このファイルは、本Issueの文脈を持たない実装エージェントがそのまま着手できるよう、必要な事実確認・設計判断をすべて完了させた状態で書かれている。判断の根拠は§11「決定事項ログ」にまとめてあるので、疑問が生じたら先にそこを見ること。

---

## 0. 非スコープ（変更してはいけないもの）

- `docs/v1-mockup.html` の既存トークン値（色・タイポグラフィ・角丸・シャドウ・duration・easing）。AIアクセントカラーの追記のみ許可。
- 円盤タイマー・配色・レイアウトの「見た目」そのもののデザイン変更。
- `dnd-kit` によるOn Deckの並べ替え実装（Radix化の対象外）。
- Backlog / 今日完了 の開閉（`useState` + 条件レンダリング）。ADRのRadixプリミティブ一覧に Collapsible は含まれないため、素朴な実装のまま daisyUI クラスだけ当て替える。
- テーマ切替のセグメントボタン（system/light/dark）。ADRが明示するRadixプリミティブは Dialog / Popover / Slider / Switch / DropdownMenu のみで、セグメントは対象外。plain button + daisyUI クラスのまま。
- Toast コンポーネント。ADRのプリミティブ一覧にToastは無いため、条件レンダリング + daisyUI クラスのままでよい。
- `messages.ts` の文言、`aria-label`／見出しのアクセシブルネーム（E2Eテストが直接参照しているため。§7参照）。

---

## 1. ADR 0010（全文）

```
# UI実装基盤を daisyUI（Tailwind）+ Radix-ui に刷新する

v1 の既存 UI 実装（素の CSS によるセマンティックトークン + ハンドロールされたコンポーネント）を、
daisyUI（Tailwind CSS ベースのスタイリング）と Radix-ui（アクセシブルなヘッドレスコンポーネント）
を使う構成に刷新する。

## 背景
既存の UI はほぼ実装済みだったが、UI の質と実装速度を上げるためにコンポーネントライブラリの導入を
決めた。daisyUI は CSS クラスのみを提供し JS の振る舞いを持たないため、TaskDetailsSheet の spring
開閉・ドラッグクローズ・フォーカストラップのような複雑なインタラクションは別途担当が要る。

## 理由
- daisyUI は見た目のスタイリングのみを担当させ、Dialog / Popover / Slider / Switch /
  DropdownMenu などのインタラクションとアクセシビリティは Radix-ui に担当させる。
- 既存の配色・レイアウト・タイポグラフィの値（docs/v1-mockup.html のトークン）はそのまま維持し、
  daisyUI のカスタムテーマとして同じ値を移植する。
- テーマ切り替え機構は pomdo 独自の data-theme 実装から daisyUI のテーマ機構（同じく data-theme
  属性ベース）に一本化し、二重管理を避ける。

## トークンのマッピング
| pomdo の概念 | daisyUI のスロット |
|---|---|
| 集中色（既存） | primary |
| 休憩色（既存） | secondary |
| AI関連 UI 要素を示す色（新規追加） | accent |
| 削除確認の赤（既存） | error |
| 背景・面（既存の3段階） | base-100 / base-200 / base-300 |
| 本文・補助・淡色テキスト | base-content（+ opacity調整） |

色以外のトークン（--fs-timer などのタイポグラフィ、--maxw、--r-card などの形状、--shadow-card、
--dur / --ease-out などのモーション）は daisyUI のテーマ機構の対象外のため、pomdo 独自の CSS
変数のまま維持する。

## Considered Options
- accentスロットを未定義のまま残す: btn-accent 等が未定義値で描画され破綻するリスクがあるため見送り。
- accentスロットにprimaryを複製する: 破綻は防げるが意味を持たせられないため見送り。

## 結果
- docs/v1-mockup.html に AI アクセントカラーの新トークンを追記する。
- Radix-ui・daisyUI・Tailwind CSS を新規に依存として追加する。
- 既存の Playwright E2E テストは、UI コンポーネントの書き直しに伴いセレクタの見直しが必要になる。
```

---

## 2. 確定バージョンと出典

現時点（2026-09）でいずれも未インストール。新規導入。npm registry への直接問い合わせと公式ドキュメントで検証済み。

| パッケージ | バージョン | 出典 |
|---|---|---|
| `tailwindcss` | 4.3.3 | https://registry.npmjs.org/tailwindcss （`npm view tailwindcss version`） |
| `@tailwindcss/vite` | 4.3.3 | https://registry.npmjs.org/@tailwindcss/vite |
| `daisyui` | 5.7.32 | https://registry.npmjs.org/daisyui |
| `radix-ui`（統合パッケージ） | 1.6.7 | https://www.npmjs.com/package/radix-ui |

- Tailwind v4 は CSS-first 設定（`@import "tailwindcss"` + `@theme`/`@plugin`）が現行標準。`tailwind.config.js` は使わない。出典: https://tailwindcss.com/docs/installation/using-vite
- daisyUI v5 は Tailwind v4 の `@plugin` ディレクティブ登録が前提。`tailwind.config.js` の `plugins: [require('daisyui')]` は使わない。出典: https://daisyui.com/docs/install/ 、https://daisyui.com/docs/v5/
- radix-ui はReact 19を `peerDependencies` に含む（`^16.8 || ^17.0 || ^18.0 || ^19.0`）。出典: `npm view @radix-ui/react-dialog peerDependencies`。追加設定不要。
- Radix Dialog にドラッグ/スワイプで閉じる機能は組み込まれていない（確認済み）。出典: https://www.radix-ui.com/primitives/docs/components/dialog 、https://www.radix-ui.com/primitives/docs/guides/animation

### インストール

```bash
npm install radix-ui
npm install -D tailwindcss @tailwindcss/vite daisyui
```

---

## 3. ⚠️ 最重要の注意: `--color-accent` の意味変更

現行 `src/index.css` の `--color-accent` は「集中色（インディゴ）」を意味する。しかし ADR 0010 のマッピングにより、daisyUI の `accent` スロットは今回新設する「AI関連色（アンバー/オレンジ）」に割り当てられる。daisyUI は自身のテーマ機構でグローバルな `--color-accent` を生成するため、**pomdo が今まで使っていた `--color-accent`（インディゴ）という変数名をそのまま残すと、daisyUIが生成する `--color-accent`（オレンジ）と名前が衝突し、集中色のボタン・円盤・ハローが黙ってオレンジ色に変わってしまう。**

これを避けるため、`src/index.css` から次の変数を完全に削除し、以降のCSSはすべて右側の新名称を使う。

| 削除する旧変数（意味） | 置き換え先 |
|---|---|
| `--color-accent`（集中色） | daisyUIスロット `--color-primary` |
| `--color-accent-weak` | pomdo独自 `--color-primary-weak` |
| `--color-accent-line` | pomdo独自 `--color-primary-line` |
| `--color-accent-break`（休憩色） | daisyUIスロット `--color-secondary` |
| `--color-accent-break-weak` | pomdo独自 `--color-secondary-weak` |
| `--color-danger` | daisyUIスロット `--color-error` |
| `--color-focus-ring`（値は常にaccentと同じだったため統合） | daisyUIスロット `--color-primary` |

`--color-accent` という名前は今後 **AI機能の色だけ** を指す。プロジェクト全体を `grep -rn "color-accent" src` して、AI機能（別Issue）以外の用途に残っていないことを実装完了時に確認すること。

---

## 4. `src/index.css` の書き換え（全文の構成方針）

`src/index.css` は `main.tsx` からimportされている唯一のCSSエントリポイント。この1ファイルをTailwindの CSS-first エントリに作り替える。ファイル冒頭から順に、次の構成にする。

### 4.1 Tailwind + daisyUI の登録（ファイル最上部、この順序で）

```css
@import "tailwindcss";

@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}

@plugin "daisyui/theme" {
  name: "light";
  default: true;
  color-scheme: light;

  --color-base-100: #f4f5f7;
  --color-base-200: #ffffff;
  --color-base-300: #ffffff;
  --color-base-content: #191b21;

  --color-primary: #4d51c8;
  --color-primary-content: #ffffff;
  --color-secondary: #33926a;
  --color-secondary-content: #ffffff;
  --color-accent: #c8792e;
  --color-accent-content: #ffffff;
  --color-neutral: #575c69;
  --color-neutral-content: #ffffff;

  --color-info: #3b7dc8;
  --color-info-content: #ffffff;
  --color-success: #33926a;
  --color-success-content: #ffffff;
  --color-warning: #c8992e;
  --color-warning-content: #191b21;
  --color-error: #c53b37;
  --color-error-content: #ffffff;

  --radius-selector: 999px;
  --radius-field: 12px;
  --radius-box: 20px;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 0;
  --noise: 0;
}

@plugin "daisyui/theme" {
  name: "dark";
  prefersdark: true;
  color-scheme: dark;

  --color-base-100: #0f1013;
  --color-base-200: #17181e;
  --color-base-300: #1f2029;
  --color-base-content: #e9eaef;

  --color-primary: #8b8ff2;
  --color-primary-content: #17173a;
  --color-secondary: #5cc38f;
  --color-secondary-content: #17173a;
  --color-accent: #e0a15a;
  --color-accent-content: #17173a;
  --color-neutral: #9aa0b0;
  --color-neutral-content: #17173a;

  --color-info: #7fb2e8;
  --color-info-content: #17173a;
  --color-success: #5cc38f;
  --color-success-content: #17173a;
  --color-warning: #e0be5a;
  --color-warning-content: #17173a;
  --color-error: #e5817c;
  --color-error-content: #17173a;

  --radius-selector: 999px;
  --radius-field: 12px;
  --radius-box: 20px;
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;
  --depth: 0;
  --noise: 0;
}
```

**値の出典**: `base-*`/`primary`/`secondary`/`error` は `docs/v1-mockup.html` の `--color-bg`/`--color-surface`/`--color-surface-raised`/`--color-text`/`--color-accent`/`--color-accent-break`/`--color-danger` をそのまま転記（light/dark とも）。`accent` は Issue本文で指定された新規AI色 `#c8792e`(light) / `#e0a15a`(dark)。

**`*-content` の決め方（判断ログ、根拠は§11.3）**: 現行コードで唯一 solid な色付きボタンの前景色を定義していたのは `.btn-primary`（light: `#fff`、dark: `#17173a`）のみ。これを一般化し、light テーマの全 `*-content` は `#ffffff`、dark テーマの全 `*-content` は `#17173a` に統一した（`warning-content` のみ、明るい `#e0be5a` に白文字だとlightで読みにくいため `#191b21` を採用）。`neutral`/`info`/`success`/`warning` は pomdo UI 内で現在どこにも使われていない未使用スロットだが、ADR 0010 が `accent` について指摘した「未定義だと `btn-accent` 等が破綻する」リスクと同じ理由で、安全な値を明示している。ブラウザ確認時にコントラストが気になれば調整してよい（視覚的な意味を持たない値のため、変更しても Issue の「値を変更しない」制約には抵触しない）。

**`--radius-*` の対応**: `--radius-field: 12px` は既存 `.btn`/`.field input` の `border-radius:12px` と一致。`--radius-box: 20px` は `--r-card` と一致。`--radius-selector: 999px` は `--r-pill` と一致。

### 4.2 pomdo 独自トークン（daisyUI対象外、`:root` に維持）

```css
:root {
  --color-chrome: rgba(244, 245, 247, .72);
  --color-border: #e3e5eb;
  --color-hairline: rgba(18, 20, 32, .08);
  --color-text-muted: #575c69;
  --color-text-faint: #8b909e;
  --color-primary-weak: #e8e8fb;
  --color-primary-line: rgba(77, 81, 200, .34);
  --color-secondary-weak: #e1f0e8;
  --halo: radial-gradient(circle, rgba(77,81,200,.13), rgba(77,81,200,.04) 42%, transparent 70%);
  --font: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", Meiryo, system-ui, sans-serif;
  --fs-timer: 3.75rem;
  --fs-hero: 2.5rem;
  --fs-now-title: 1.5rem;
  --fs-h2: 1.0625rem;
  --fs-body: 1rem;
  --fs-meta: .875rem;
  --fs-label: .75rem;
  --maxw: 528px;
  --r-card: 20px;
  --r-row: 14px;
  --r-pill: 999px;
  --shadow-card: 0 1px 2px rgba(20,22,34,.04), 0 12px 32px -16px rgba(20,22,34,.16);
  --shadow-sheet: 0 -1px 0 var(--color-hairline), 0 -24px 64px -24px rgba(20,22,34,.28);
  --dur: .34s;
  --dur-fast: .18s;
  --ease-out: cubic-bezier(.22, 1, .36, 1);
  --ease-spring: linear(
    0, 0.017, 0.064, 0.13, 0.211, 0.303, 0.402, 0.502, 0.601, 0.694,
    0.78, 0.856, 0.921, 0.974, 1.014, 1.041, 1.055, 1.059, 1.054, 1.043,
    1.03, 1.017, 1.006, 0.999, 0.995, 0.994, 0.996, 0.998, 1
  );
}
```

`--ease-spring` は `docs/v1-mockup.html` から転記（現行 `src/index.css` には無かった。spring開閉を新規実装するため必須）。`--color-text`/`--color-text-muted`/`--color-text-faint` のうち `--color-text` は daisyUI の `--color-base-content` に統合したので `:root` から削除。`--color-text-muted`/`--color-text-faint` は daisyUI に「opacity調整」の仕組みが無く、opacity経由で近似すると背景色によって実効色が変わり値がズレるため、既存の実測hexをそのまま個別トークンとして維持する（判断根拠は§11.4）。`--fs-hero`/`--fs-now-title`/`--fs-h2` は mockup にのみ存在していたが、LP見出しやNowカード見出しのフォントサイズ指定に使うため追加する。

### 4.3 dark モードの上書き（daisyUI対象外トークンのみ）

daisyUI の8スロット（primary/secondary/accent/error/base-100/200/300/base-content）は `--prefersdark` 設定により自動でライト/ダークが切り替わるため、ここで再定義しない。pomdo独自トークンだけを上書きする。

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-chrome: rgba(15,16,19,.74);
    --color-border: #2c2e39;
    --color-hairline: rgba(255,255,255,.09);
    --color-text-muted: #9aa0b0;
    --color-text-faint: #696e7e;
    --color-primary-weak: #242449;
    --color-primary-line: rgba(139,143,242,.4);
    --color-secondary-weak: #183328;
    --halo: radial-gradient(circle, rgba(139,143,242,.22), rgba(139,143,242,.06) 42%, transparent 72%);
    --shadow-card: 0 1px 2px rgba(0,0,0,.4), 0 16px 40px -18px rgba(0,0,0,.6);
    --shadow-sheet: 0 -1px 0 var(--color-hairline), 0 -28px 72px -20px rgba(0,0,0,.7);
  }
}
:root[data-theme="dark"] {
  --color-chrome: rgba(15,16,19,.74);
  --color-border: #2c2e39;
  --color-hairline: rgba(255,255,255,.09);
  --color-text-muted: #9aa0b0;
  --color-text-faint: #696e7e;
  --color-primary-weak: #242449;
  --color-primary-line: rgba(139,143,242,.4);
  --color-secondary-weak: #183328;
  --halo: radial-gradient(circle, rgba(139,143,242,.22), rgba(139,143,242,.06) 42%, transparent 72%);
  --shadow-card: 0 1px 2px rgba(0,0,0,.4), 0 16px 40px -18px rgba(0,0,0,.6);
  --shadow-sheet: 0 -1px 0 var(--color-hairline), 0 -28px 72px -20px rgba(0,0,0,.7);
}
```

`--shadow-card`/`--shadow-sheet` の dark値は、現行 `src/index.css` には強化版が存在しなかったが `docs/v1-mockup.html` には存在する（判断根拠は§11.2）。Issueが「mockupの値は変更しない」と明言しているため、この抜け漏れを機会に mockup の値へ揃える。

### 4.4 `data-theme` 自動/手動切り替えの検証（実装時に必須）

`themes: light --default, dark --prefersdark;` の設定だけで「`data-theme`属性なし→OSの`prefers-color-scheme`に自動追従、`data-theme="light"|"dark"`→明示的に強制」という要件を満たせるはずだが、daisyUI公式ドキュメントの記述だけでは、生成されるCSSの優先順位（`@media (prefers-color-scheme:dark)` と `[data-theme]` セレクタの詳細な優先順位）を100%断定できなかった（出典: https://daisyui.com/docs/config/ 、https://daisyui.com/docs/themes/ ）。

`src/lib/theme.ts` の実装（`system`のとき`data-theme`属性を削除、`light`/`dark`のとき属性を設定）は変更不要 — この属性の付け外しパターンがdaisyUIの想定と一致しているため。**ただし実装後、次の3パターンをブラウザの実機（OS側のダーク/ライト切り替え含む）で必ず目視確認すること**:
1. OSがライトモード、`data-theme`属性なし → ライトテーマで表示される
2. OSがダークモード、`data-theme`属性なし → ダークテーマで自動的に表示される
3. OSがライトモードで`data-theme="dark"`を明示設定 → OS設定を無視してダークテーマが強制される（逆も同様）

期待通りに動かない場合のフォールバック: `:root:not([data-theme])`に対する自前の`@media (prefers-color-scheme:dark)`ブロックで daisyUI の8スロット変数を再定義する保険を追加する。

### 4.5 グローバルなクラス名変更

| 旧クラス | 新クラス | 理由 |
|---|---|---|
| `btn-danger` | `btn-error` | daisyUI v5の命名規則（error スロット）に合わせる |
| `btn-small` | `btn-sm` | daisyUI v5の命名規則に合わせる |
| `visually-hidden` | `sr-only` | Tailwind v4 標準搭載のユーティリティと機能的に同一のため、自前定義をやめて統一する |

変更対象ファイル（grep済み・全件）:
- `btn-danger` → `btn-error`: `src/components/tasks/TaskDetailsSheet.tsx`（削除ボタン）、`src/components/timer/TimerControls.tsx`（ストップ/スキップボタン）、`src/components/settings/SettingsPage.tsx`（アカウント削除ボタン）
- `btn-small` → `btn-sm`: `src/components/tasks/TaskAddForm.tsx`（追加ボタン）、`src/components/app/NowCard.tsx`（編集/完了/このまま集中するボタン、3箇所）、`src/components/settings/SettingsPage.tsx`（テスト再生ボタン）
- `visually-hidden` → `sr-only`: `src/components/tasks/TaskAddForm.tsx`（ラベル）。`src/components/tasks/TaskRow.tsx`の`visually-hidden`な削除ボタンは§6.2でDropdownMenuに置き換えるため削除（クラス名の付け替えではなく要素ごと削除）。

`src/index.css` から次のルールを削除する（daisyUIの `@plugin "daisyui"` がテーマトークンから自動生成するため不要）: `.btn`, `.btn-primary`, `.btn-danger`, `.btn-ghost`, `.btn-small`, `.btn-lg`, `.visually-hidden`。

**削除後の確認事項**: daisyUIの`.btn`のデフォルト余白・高さが現行の`min-height:40px;padding:9px 16px`（`.btn-sm`は`min-height:34px;padding:6px 11px`、`.btn-lg`は`min-height:48px;padding:12px 30px`）と完全一致しない場合、見た目が変わってしまう。ブラウザ確認（§8）でボタンの高さ・余白を目視比較し、ズレていれば `<button className="btn btn-primary min-h-10 px-4 py-[9px]">` のように Tailwind の任意値ユーティリティで pomdo の元の数値を上書きすること。

### 4.6 その他のカスタムCSSクラスの扱い（方針）

`--r-card`/`--r-row`/`--r-pill`/`--shadow-card`/`--shadow-sheet`/`--dur*`/`--ease-*`/`--fs-*`/`--maxw` はdaisyUI管轄外のpomdo独自トークンとして維持されるため（§4.2）、これらを使う既存のカスタムCSSクラス（`.now-card`, `.task-row`, `.appbar`, `.section`, `.disclosure*`, `.pillar*`, `.stats-grid`, `.review-card`, `.settings-group`, `.setting-row` 等）は、**クラス名は維持したまま、内部の色プロパティ（`var(--color-accent)`等）だけを§3の新変数名に置き換える**方針でよい。これらは daisyUI が代替クラスを持たない pomdo 固有のレイアウトであり、Issue の非スコープ（「配色・レイアウトの見た目のデザイン変更をしない」）とも整合する。

ただし、以下は daisyUI/Tailwind の直接的な等価物があるため、そちらへの置き換えを優先すること（§4.5のグローバル置換と同じ理由）:
- `.iconbtn`/`.iconbtn.small` → `btn btn-ghost btn-circle`（daisyUI）+ サイズ調整（`btn-sm`）。既存の`width:40px;height:40px;border-radius:12px`という角丸正方形の見た目を優先するなら、daisyUI化はせず現状のカスタムクラスを維持してもよい（判断はブラウザ確認で見た目が変わらない方を採用）。
- `input[type="checkbox"]`（ミュート）と `input[type="range"]`（音量）→ §6.6でRadix `Switch`/`Slider`に置き換える（必須、ADR指定のプリミティブ）。

一般原則: `var(--color-accent)`（旧・集中色の意味）を使っていた箇所は `var(--color-primary)` に、`var(--color-accent-break)`（旧・休憩色）は `var(--color-secondary)` に、`var(--color-accent-weak)`は`var(--color-primary-weak)`に、`var(--color-accent-line)`は`var(--color-primary-line)`に、`var(--color-accent-break-weak)`は`var(--color-secondary-weak)`に、`var(--color-danger)`は`var(--color-error)`に、`var(--color-text)`は`var(--color-base-content)`に、`var(--color-bg)`は`var(--color-base-100)`に、`var(--color-surface)`は`var(--color-base-200)`に、`var(--color-surface-raised)`は`var(--color-base-300)`に機械的に置換する。この置換は `src/index.css` 内の全セレクタに適用する（`.brand-mark`, `.btn-primary`系の削除済みルールを除く現存する全ルール: `.appbar`, `.now-card`, `.disc`/`.disc-break`, `.presets`/`.segmented`, `.break-suggestion`, `.task-row`, `.check`, `.now-badge`, `.disclosure-trigger`, `.field`, `.toast`, `.landing*`, `.pillar*`, `.cta`, `.stats-grid`, `.day-bar`/`.today-bar`, `.setting-row` 等)。

**例外（`.brand-mark`のみ）**: `.brand-mark { background: var(--color-accent); color: #fff }` は `background: var(--color-primary)` に置き換えるが、`color: #fff` は `var(--color-primary-content)` に変えず**そのまま `#fff` 固定で維持する**。現行コードは dark モードでもこのアイコン色を白固定にしており（`.btn-primary`とは異なり dark 用の上書きが元々存在しない）、これは既存の意図的な挙動なので Issue の非スコープに従いそのまま踏襲する。

---

## 5. `vite.config.ts` の変更

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
})
```

出典: https://tailwindcss.com/docs/installation/using-vite （`react()`と`tailwindcss()`を配列で併記する形は同ガイドのサンプルに準拠）。PostCSS/Autoprefixerの個別インストールはTailwind v4では不要（同出典）。

---

## 6. コンポーネント別の変更内容

### 6.1 `src/App.css`

現状は空のコメントのみで、どこからもimportされていない（`rg -rn "App.css" src` で確認済み、0件）。**ファイルを削除する。** Tailwindのエントリは`src/index.css`のまま（`main.tsx`が既にimportしている）。

### 6.2 `src/components/tasks/TaskRow.tsx` — DropdownMenu化

現行の「⋯」ボタンは`onEdit`（詳細シートを開く）を直接呼ぶだけで、削除は`visually-hidden`な到達不能ボタンだった（マウス/タッチで削除できない既存の不具合）。ADRが挙げるRadixプリミティブのうちDropdownMenuに該当する箇所はここだけなので、ここで解消する。

```tsx
import { Check, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DropdownMenu } from 'radix-ui'
import { messages } from '../../messages'

export type TaskView = {
  id: string
  title: string
  note: string | null
  estimate: number | null
  deckOrder: string | null
  completedAt: Date | string | null
}

export function TaskRow({ task, isNow = false, completedFocusCount = 0, onComplete, onDelete, onMoveToNow, onEdit, onMove }: {
  task: TaskView
  isNow?: boolean
  completedFocusCount?: number
  onComplete: () => void
  onDelete: () => void
  onMoveToNow?: () => void
  onEdit?: () => void
  onMove?: (direction: 'up' | 'down') => void
}) {
  const sortable = useSortable({ id: task.id })
  const sortableEnabled = onMove !== undefined
  const progress = task.estimate === null ? `${completedFocusCount} 本` : `${Math.min(completedFocusCount, task.estimate)} / ${task.estimate} 本${completedFocusCount > task.estimate ? `  ${completedFocusCount}` : ''}`
  return <article ref={sortableEnabled ? sortable.setNodeRef : undefined} style={sortableEnabled ? { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition } : undefined} className={`task-row ${task.completedAt ? 'done' : ''} ${isNow ? 'is-now' : ''} ${sortable.isDragging ? 'is-dragging' : ''}`}>
    <button className="check" type="button" aria-label={`${task.title}を完了`} onClick={onComplete} disabled={Boolean(task.completedAt)}><Check size={15} /></button>
    <button className="task-main" type="button" onClick={onMoveToNow ?? onEdit}>
      <span className="task-title">{task.title}</span>
      <span className="task-meta">{progress}{task.note ? ` · ${task.note}` : ''}</span>
    </button>
    {sortableEnabled ? <button className="drag-handle" type="button" aria-label={`${task.title}をドラッグして並べ替え`} {...sortable.attributes} {...sortable.listeners}>⠿</button> : null}
    {onMove ? <span className="reorder-buttons"><button type="button" aria-label={`${task.title}を上へ`} onClick={() => onMove('up')}><ChevronUp size={15} /></button><button type="button" aria-label={`${task.title}を下へ`} onClick={() => onMove('down')}><ChevronDown size={15} /></button></span> : null}
    {isNow ? <span className="now-badge">NOW</span> : null}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="iconbtn small" type="button" aria-label={`${task.title}のメニュー`}><MoreHorizontal size={18} /></button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="dropdown-menu-content" align="end" sideOffset={4}>
          <DropdownMenu.Item className="dropdown-menu-item" onSelect={() => onEdit?.()}>{messages.task.edit}</DropdownMenu.Item>
          {onMoveToNow ? <DropdownMenu.Item className="dropdown-menu-item" onSelect={() => onMoveToNow()}>{messages.task.moveToNow}</DropdownMenu.Item> : null}
          <DropdownMenu.Separator className="dropdown-menu-separator" />
          <DropdownMenu.Item className="dropdown-menu-item dropdown-menu-item-danger" onSelect={() => onDelete()}>{messages.task.delete}</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  </article>
}
```

変更点まとめ:
- `visually-hidden`な削除ボタンを削除し、`DropdownMenu.Item`に統合（`onDelete`は既存どおり呼び出し元(`TaskList.tsx`)の`window.confirm`ラップをそのまま経由するので、確認ダイアログの挙動は変わらない）。
- `onEdit`ボタンのアイコンはそのまま`MoreHorizontal`を使い、押下対象を`DropdownMenu.Trigger`に変更しただけなので、`aria-label={`${task.title}のメニュー`}`は変更不要。
- `onSelect`はRadixのイベント型 (`Event`) を受け取るため、`onEdit`/`onMoveToNow`/`onDelete`（いずれも`() => void`）をそのまま渡さず`() => onEdit?.()`のようにラップすること（型不一致を避けるため）。
- `messages.task.moveToNow`（値: `'今これにする'`）を新規に使用する。既に`src/messages.ts`に定義済みなので追加不要。

`.dropdown-menu-content`/`.dropdown-menu-item`/`.dropdown-menu-separator`は新規CSSクラス。daisyUIの`menu`コンポーネントはセレクタが`.menu > li > a`のような子要素構造を前提としており、Radixのフラットな`DropdownMenu.Item`構造とは噛み合わないため使わない（daisyUIの`menu`クラスを使わない理由の記録）。代わりにdaisyUIが生成するCSS変数（`--color-base-300`等）を直接参照するプレーンCSSを`src/index.css`に追記する。

```css
.dropdown-menu-content {
  min-width: 160px; padding: 6px;
  border-radius: var(--r-row);
  background: var(--color-base-300);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-hairline);
}
.dropdown-menu-item {
  display: flex; align-items: center;
  min-height: 38px; padding: 0 10px;
  border-radius: 8px;
  font-size: var(--fs-meta);
  color: var(--color-base-content);
  outline: none;
  cursor: pointer;
}
.dropdown-menu-item[data-highlighted] { background: var(--color-hairline); }
.dropdown-menu-item-danger { color: var(--color-error); }
.dropdown-menu-separator { height: 1px; margin: 6px 4px; background: var(--color-hairline); }
```

`[data-highlighted]`はRadixのMenu系プリミティブがキーボード操作/ホバー時に自動付与する属性（公式ドキュメント: https://www.radix-ui.com/primitives/docs/components/dropdown-menu のData attributes欄）。

### 6.3 `src/components/tasks/TaskDetailsSheet.tsx` — Radix Dialog + spring開閉 + ドラッグクローズ

現行実装には spring 開閉もドラッグクローズも存在しない（`git log --all -p`で全履歴確認済み。単一コミットのみ、mount/unmountでの開閉のみ）。**`docs/v1-mockup.html`の仕様（`--ease-spring`のtransition、grabberのpointer dragによるクローズ判定）に基づく新規実装**として作る（既存動作の「維持」ではない）。

現行のEscapeキー処理・Tabフォーカス循環・opener要素へのフォーカス復帰は、すべてRadix `Dialog`が標準で提供するため削除する（Radixが自動的に代替する）。

```tsx
import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Dialog } from 'radix-ui'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'
import type { TaskView } from './TaskRow'

const DRAG_CLOSE_PROJECTED_DISTANCE_PX = 120
const DRAG_UP_RUBBER_BAND_RATIO = 0.2
const DRAG_VELOCITY_DECAY = 0.998

export function TaskDetailsSheet({ task, turnstileToken, onClose, onDeleted, onSaved }: { task: TaskView | null; turnstileToken: string | null; onClose: () => void; onDeleted: () => void; onSaved?: () => void }) {
  const [displayedTask, setDisplayedTask] = useState<TaskView | null>(task)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [estimate, setEstimate] = useState('')
  const updateTask = trpc.tasks.update.useMutation()
  const deleteTask = trpc.tasks.delete.useMutation()
  const titleInput = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const isOpen = task !== null

  useEffect(() => {
    if (!task) return
    setDisplayedTask(task)
    setTitle(task.title)
    setNote(task.note ?? '')
    setEstimate(task.estimate?.toString() ?? '')
  }, [task?.id])

  const dragState = useRef<{ startClientY: number; lastClientY: number; lastTimeMs: number; lastOffsetPx: number; velocityPxPerSec: number } | null>(null)

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const content = contentRef.current
    if (!content) return
    // pointer capture は実際にリスナーを張っている grabber 自身（event.currentTarget）に対して行う。
    // content（親要素）に対して行うと、以降の pointermove/pointerup が grabber ではなく
    // content 側に retarget され、このハンドラ自体が呼ばれなくなる。
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = { startClientY: event.clientY, lastClientY: event.clientY, lastTimeMs: performance.now(), lastOffsetPx: 0, velocityPxPerSec: 0 }
    // [data-state] の開閉アニメーション（animation）は inline style の transform より
    // 優先度が高いため、開閉アニメーション再生中にドラッグを始めた場合に備えて明示的に止める。
    content.style.animation = 'none'
    content.style.transition = 'none'
  }
  const continueDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const content = contentRef.current
    const drag = dragState.current
    if (!content || !drag) return
    const draggedDistancePx = event.clientY - drag.startClientY
    const appliedOffsetPx = draggedDistancePx < 0 ? draggedDistancePx * DRAG_UP_RUBBER_BAND_RATIO : draggedDistancePx
    content.style.transform = `translateY(${appliedOffsetPx}px)`
    const nowMs = performance.now()
    drag.velocityPxPerSec = (event.clientY - drag.lastClientY) / (nowMs - drag.lastTimeMs) * 1000
    drag.lastClientY = event.clientY
    drag.lastTimeMs = nowMs
    drag.lastOffsetPx = appliedOffsetPx
  }
  const endDrag = () => {
    const content = contentRef.current
    const drag = dragState.current
    if (!content || !drag) return
    dragState.current = null
    const projectedDistancePx = drag.lastOffsetPx + drag.velocityPxPerSec * DRAG_VELOCITY_DECAY / 1000 / (1 - DRAG_VELOCITY_DECAY)
    const shouldClose = projectedDistancePx > DRAG_CLOSE_PROJECTED_DISTANCE_PX
    // スナップバックも閉じる場合も、まずこの要素自身の inline transition で
    // なめらかに動かし切ってから、[data-state] 側のアニメーションに制御を戻す
    // （setTimeoutで固定ミリ秒を待つと --dur の値とズレるため、transitionend を使う）。
    content.style.transition = 'transform var(--dur) var(--ease-spring)'
    content.style.transform = shouldClose ? 'translateY(100%)' : 'translateY(0)'
    const handOffToStateDrivenAnimation = () => {
      content.removeEventListener('transitionend', handOffToStateDrivenAnimation)
      content.style.transition = ''
      content.style.transform = ''
      content.style.animation = ''
      if (shouldClose) onClose()
    }
    content.addEventListener('transitionend', handOffToStateDrivenAnimation)
  }

  if (!displayedTask) return null
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateTask.mutate({ id: displayedTask.id, title: title.trim(), note: note || null, estimate: estimate ? Number(estimate) : null, turnstileToken: turnstileToken ?? undefined }, { onSuccess: () => { onSaved?.(); onClose() } })
  }
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-scrim" />
        <Dialog.Content
          ref={contentRef}
          className="sheet"
          onOpenAutoFocus={(event) => { event.preventDefault(); titleInput.current?.focus() }}
        >
          <Dialog.Title>タスクを編集</Dialog.Title>
          <Dialog.Description className="sr-only">タスクのタイトル・メモ・見積もりを編集します</Dialog.Description>
          <div className="grabber" aria-hidden="true" onPointerDown={beginDrag} onPointerMove={continueDrag} onPointerUp={endDrag} onPointerCancel={endDrag} />
          <form onSubmit={submit}>
            <label className="field"><span>タイトル</span><input ref={titleInput} value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={240} /></label>
            <label className="field"><span>{messages.task.note}</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} /></label>
            <label className="field"><span>{messages.task.estimate}（1〜8）</span><input type="number" min="1" max="8" value={estimate} onChange={(event) => setEstimate(event.target.value)} placeholder={messages.task.noEstimate} /></label>
            <div className="sheet-actions">
              <Dialog.Close asChild><button className="btn btn-ghost" type="button">キャンセル</button></Dialog.Close>
              <button className="btn btn-primary" type="submit" disabled={updateTask.isPending}>保存</button>
              <button className="btn btn-error" type="button" onClick={() => { if (window.confirm(messages.task.deleteConfirm)) deleteTask.mutate({ id: displayedTask.id, turnstileToken: turnstileToken ?? undefined }, { onSuccess: onDeleted }) }}>{messages.task.delete}</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

**重要な設計判断の説明**:
- `displayedTask`（closing中も直前のtaskを保持するstate）を導入した理由: 親（`AppPage.tsx`/`TaskList.tsx`）は`setDetailsTask(null)`で即座に`task`をnullにするが、Radixの閉じるアニメーションが再生されている間もフォームの中身（タイトル等）を表示し続ける必要がある。`task`propが`null`になっても`displayedTask`は直前の値を保持し続けるため、閉じるアニメーション中に中身が消えない。
- 親コンポーネント側の`key={detailsTask?.id ?? 'closed'}`による強制remountは不要になる（`useEffect(..., [task?.id])`が同じ役割を果たすため）。`AppPage.tsx`と`TaskList.tsx`の`<TaskDetailsSheet key={...} .../>`から`key`propを削除すること。
- 現行の`opener`ref（フォーカスを戻す処理）・`closeOnEscape`（Escape/Tab処理）は削除。Radix `Dialog.Content`が内部の`FocusScope`でフォーカストラップ・Escape閉じる・閉じた後のトリガー要素へのフォーカス復帰を自動的に行う（出典: https://www.radix-ui.com/primitives/docs/components/dialog ）。
- 背景クリックで閉じる処理（`onMouseDown`での`event.currentTarget === event.target`判定）も削除。Radix DialogはデフォルトでOverlay外側（＝Content外側）のクリックを検知して`onOpenChange(false)`を呼ぶため不要。
- `Dialog.Title`の文言は現行どおり固定の「タスクを編集」を維持する（タスクのタイトルを見出しにする実装ではない。E2Eテストがこの見出しにタスクタイトルを期待しているという懸念は誤りだったことを確認済み。詳細は§7参照）。
- `Dialog.Description`は`sr-only`（Tailwind標準ユーティリティ）にして視覚的には非表示にする。Radixは`Dialog.Description`が無いと開発コンソールに警告を出すため追加した（見た目への影響なし）。
- ドラッグ実装は`docs/v1-mockup.html`の`<script>`内ロジック（pointerdown/pointermove/pointerupでのtranslateY操作＋速度計算）を忠実に移植したもの。しきい値`120`（px）・減衰係数`0.998`は mockup と同じ値。
- ドラッグ中は`content.style.animation = 'none'; content.style.transition = 'none'`でCSSの開閉アニメーションを無効化し、指の動きに`transform`で直接追従させる。ポインタを離した時点で、`projectedDistancePx > 120`ならクローズ側・そうでなければスナップバック側の目標位置（`translateY(100%)`/`translateY(0)`）へ向けて自前の`transition`でなめらかに動かし切り、`transitionend`後に初めてinline styleをクリアして`[data-state]`側のCSS `animation`に制御を戻す（クローズの場合はその後で`onClose()`を呼ぶ）。

`src/index.css`に追記する`.sheet-scrim`/`.sheet`は、Radixが`Overlay`/`Content`に自動付与する`data-state="open"|"closed"`属性でアニメーションさせる。**`transition`ではなく`@keyframes` + `animation`を使うこと** — Radix公式のAnimationガイドが示す方法は`animation`であり（出典: https://www.radix-ui.com/primitives/docs/guides/animation の "You can use CSS animation to animate both mount and unmount phases"、サンプルコードも`animation: fadeIn 300ms ease-out`のように`animation`プロパティを使っている）、これには理由がある。`transition`は「スタイルの値が変化した瞬間」にしか発火しないため、Radixが`Dialog.Content`を初めてDOMに挿入する瞬間（＝`data-state="open"`が最初から付いた状態で挿入される瞬間）には「変化前の値」が存在せず、初回オープン時のアニメーションが再生されない可能性がある。`animation`は要素の挿入そのものをトリガーに再生されるため、この問題が起きない。

```css
@keyframes sheet-scrim-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes sheet-scrim-fade-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes sheet-slide-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes sheet-slide-out { from { transform: translateY(0); } to { transform: translateY(100%); } }

.sheet-scrim {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(20, 18, 16, .32);
  backdrop-filter: blur(2px);
}
.sheet-scrim[data-state="open"] { animation: sheet-scrim-fade-in var(--dur) var(--ease-out); }
.sheet-scrim[data-state="closed"] { animation: sheet-scrim-fade-out var(--dur) var(--ease-out); }

.sheet {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 61;
  width: min(100%, var(--maxw)); margin: 0 auto;
  padding: 8px 20px calc(24px + env(safe-area-inset-bottom));
  border-radius: 22px 22px 0 0;
  background: var(--color-base-300);
  box-shadow: var(--shadow-sheet);
  transform-origin: bottom center;
}
.sheet[data-state="open"] { animation: sheet-slide-in var(--dur) var(--ease-spring) forwards; }
.sheet[data-state="closed"] { animation: sheet-slide-out var(--dur) var(--ease-out) forwards; }
.sheet:focus-visible { outline: none; }
.sheet h2 { margin: 0 0 10px; font-size: 1.15rem; }
```

`forwards`（`animation-fill-mode`）を付けて、アニメーション終了後もその最終フレームの見た目（開＝`translateY(0)`、閉＝`translateY(100%)`）を保持させる。これがないとアニメーション終了と同時に元のtransform（未指定＝0）に戻ってしまい、閉じたはずのシートが再び見えてしまう。

（`.grabber`/`.field`/`.sheet-actions`は既存の`src/index.css`のルールをそのまま流用でよい。中の`var(--color-border)`等は§4.6の一般原則に従い置換すること。）

**動作確認の注意（実装時に必ずブラウザで確認すること）**:
1. Radixの`Presence`は要素に定義された`animation`のdurationを自動検出して、アニメーションが終わるまでDOMのunmountを遅延させる。実装後、閉じるアニメーションが最後まで再生されることを目視確認すること。
2. ドラッグクローズの実装（`endDrag`）は、ドラッグ操作の終盤を独自のinline `transition`で滑らかに動かし切ってから`onClose()`を呼ぶことで、CSS `animation`（`sheet-slide-out`は`from { transform: translateY(0) }`から始まる）が上書きしてしまう問題を避けている。ただし、しきい値を超えて実際に閉じる瞬間、ドラッグで既に画面外近くまで動いた状態から`onClose()`を呼んだ直後に`data-state="closed"`の`sheet-slide-out`アニメーションが一瞬`translateY(0)`から再生し直す可能性が理論上ある（inline styleより`animation`の優先度が高いため）。ブラウザで実際にドラッグクローズを試し、一瞬シートが引き戻されるような視覚的な乱れがないか確認すること。もし発生する場合は、`onClose()`の呼び出しを遅らせずに即座に呼ぶ代わりに、閉じる方向にドラッグされたときだけ`Dialog.Root`の`open`を先に`false`にしてから実際のonCloseコールバック（親の`setDetailsTask(null)`）を呼ぶ、または`forceMount` + 手動の開閉タイミング制御に切り替えるなど、追加の調整を検討すること。

### 6.4 `src/components/tasks/TaskList.tsx` / `src/components/app/AppPage.tsx`

両ファイルとも`<TaskDetailsSheet key={detailsTask?.id ?? 'closed'} ... />`から`key`propを削除する（§6.3の理由により不要）。それ以外の変更は無し（dnd-kitのDndContext、disclosureのbutton+useState方式はそのまま維持）。

`TaskList.tsx`の`.disclosure-trigger`/`.group-list`等のクラス名はそのまま維持し、内部の色var参照のみ§4.6の一般原則で置換する。

`AppPage.tsx`のローディング/エラー分岐（`<button className="btn">`）は`btn`クラスがdaisyUI由来になるだけで変更不要。

### 6.5 `src/components/app/NowCard.tsx`

`btn-small`→`btn-sm`のリネームのみ（§4.5で対応済み）。`.now-card`/`.now-note`/`.now-footer`等のクラス名は維持し、`src/index.css`側の色var参照を§4.6の原則で置換する。

### 6.6 `src/components/settings/SettingsPage.tsx` — Radix Slider + Switch

`docs/v1-mockup.html`は`.slider`/`.switch`という専用のトラック+ノブ形状のカスタムコントロールを既に設計していたが、現行の`SettingsPage.tsx`はネイティブの`<input type="range">`/`<input type="checkbox">`をそのまま使っており、mockupの見た目は未実装だった。Radix化は「ライブラリの入れ替え」であると同時に「mockupのカスタムコントロール外観を初めて実装する」作業でもある。

```tsx
import { Slider, Switch } from 'radix-ui'
// 既存のimportに追加

// 音量（Slider）— <label className="setting-row"><span>...</span><input type="range" .../></label> を置き換える
<div className="setting-row">
  <span>{messages.settings.volume}</span>
  <Slider.Root
    className="slider-root"
    min={0} max={1} step={0.05}
    value={[volume]}
    onValueChange={([value]) => { setVolume(value); save({ soundVolume: value }) }}
  >
    <Slider.Track className="slider-track">
      <Slider.Range className="slider-range" />
    </Slider.Track>
    <Slider.Thumb className="slider-thumb" aria-label={messages.settings.volume} />
  </Slider.Root>
</div>

// ミュート（Switch）— <label className="setting-row"><span>...</span><input type="checkbox" .../></label> を置き換える
<label className="setting-row">
  <span>{messages.settings.muted}</span>
  <Switch.Root
    className="switch-root"
    checked={muted}
    onCheckedChange={(checked) => { setMuted(checked); save({ soundMuted: checked }) }}
  >
    <Switch.Thumb className="switch-thumb" />
  </Switch.Root>
</label>
```

**`<label>`によるアクセシブルネームの引き継ぎに関する注意**: `<button>`要素はHTML仕様上「labelable element」に含まれるため、`<label>`で囲むだけで内包する`Switch.Root`（実体は`<button role="switch">`）にラベルテキストが暗黙的に関連付けられ、ラベルクリックでもトグルが反応する（Radix公式サンプルでも`<label htmlFor>` + `<Switch.Root id>`の組み合わせが示されている: https://www.radix-ui.com/primitives/docs/components/switch ）。よって`aria-label`を明示する必要はない。一方`Slider.Thumb`は`role="slider"`を持つ`<span>`でありlabelable elementではないため、`aria-label`を明示する必要がある（現行コードも`input[type=range]`に`aria-label`を明示していたので、その値をそのまま`Slider.Thumb`に移す）。

`src/index.css`に追記するCSS（値は`docs/v1-mockup.html`の`.slider`/`.switch`から転記。mockupでは`--color-accent`で塗っていたが、これは旧・集中色の意味なので新名称`--color-primary`に読み替える）:

```css
.slider-root { position: relative; display: flex; align-items: center; width: 168px; height: 20px; touch-action: none; }
.slider-track { position: relative; flex: 1; height: 5px; border-radius: var(--r-pill); background: var(--color-border); }
.slider-range { position: absolute; height: 100%; border-radius: var(--r-pill); background: var(--color-primary); }
.slider-thumb {
  display: block; width: 20px; height: 20px; border-radius: 50%;
  background: var(--color-base-300);
  box-shadow: 0 1px 4px rgba(20,22,34,.28);
}
.slider-thumb:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }

.switch-root {
  position: relative; width: 46px; height: 28px; border-radius: var(--r-pill);
  background: var(--color-border);
  transition: background-color var(--dur) var(--ease-out);
}
.switch-root[data-state="checked"] { background: var(--color-primary); }
.switch-thumb {
  display: block; position: relative; width: 22px; height: 22px; margin: 3px; border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(20,22,34,.3);
  transition: transform var(--dur) var(--ease-spring);
  transform: translateX(0);
}
.switch-root[data-state="checked"] .switch-thumb { transform: translateX(18px); }
.switch-thumb:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }
```

`[data-state="checked"|"unchecked"]`はRadix Switchが自動付与する属性（出典: https://www.radix-ui.com/primitives/docs/components/switch ）。テーマ切替のセグメントボタン（`.segmented`）はADRの対象外なのでRadix化しない。`aria-pressed`のままでよい。

### 6.7 その他のコンポーネント（クラス名変更なし・軽微な調整のみ）

以下は構造変更が無いため、§4.5のグローバル置換（`btn-danger`/`btn-small`/`visually-hidden`）と§4.6の色var置換のみを適用する。JSXの構造自体は変更不要。

| ファイル | 適用する変更 |
|---|---|
| `src/components/auth/GoogleLoginButton.tsx` | 色var置換のみ（クラス名変更なし） |
| `src/components/landing/LandingPage.tsx` | 色var置換のみ。`.pillar-heading`クラス名は**変更しないこと**（E2Eテストが`tests/e2e/v1-bootstrap-focus.spec.ts`でこのクラス名をハードコードして幾何学的位置検証をしている。詳細§7） |
| `src/components/layout/AppHeader.tsx` | 変更なし（クラス名はいずれもレイアウト用で色varを直接使っていない） |
| `src/components/layout/PomdoBrand.tsx` | 変更なし |
| `src/components/legal/LegalPage.tsx` | 変更なし（色varを直接使っていない） |
| `src/components/review/ReviewPage.tsx` | 色var置換のみ。`role="img" aria-label="直近7日の集中時間"`は変更禁止（E2Eが参照） |
| `src/components/tasks/TaskAddForm.tsx` | `btn-small`→`btn-sm`、`visually-hidden`→`sr-only`（§4.5で対応済み） |
| `src/components/timer/TimerControls.tsx` | `btn-danger`→`btn-error`（§4.5で対応済み） |
| `src/components/timer/TimerDisc.tsx` | 変更なし（`currentColor`でCSSクラス経由の色を継承する設計のまま。`.disc`/`.disc-break`が参照する`var(--color-accent)`/`var(--color-accent-break)`は§4.6の原則で`var(--color-primary)`/`var(--color-secondary)`に置換） |
| `src/components/ui/Toast.tsx` | 変更なし（Radix化・daisyUI化どちらも対象外。`.toast`クラスの色var置換のみ`src/index.css`側で行う） |

---

## 7. E2Eテストへの影響

事実確認のため実際に `npx playwright test` を実行し、既存の全E2Eスペックが変更前の時点でgreenであることを確認済み。

**重要な訂正**: 事前調査の過程で「`tests/e2e/v1-bootstrap-focus.spec.ts`の`getByRole('heading', {name:'いつか読む記事'})`が`TaskDetailsSheet`の固定見出し「タスクを編集」と矛盾するのではないか」という懸念があったが、実際にテストを実行して確認したところ **誤りだった**。該当のテストコード（62行目付近）は、Backlogのタスクをタップして「Nowにする」フローを検証しており、この`heading`は`TaskDetailsSheet`ではなく`src/components/app/NowCard.tsx`の`<h1>{task.title}</h1>`（Nowに昇格したタスクのタイトル見出し）を指している。`TaskDetailsSheet`の見出しは今回の実装計画でも「タスクを編集」の固定文言のまま変更しない。

以下の観点でE2Eへの影響を整理する。

| ファイル | 影響 | 対応 |
|---|---|---|
| `tests/e2e/v1-deep-links.spec.ts` | UIセレクタなし（HTTPリクエストのみ） | 変更不要 |
| `tests/e2e/v1-bootstrap-focus.spec.ts` | ほぼ全セレクタが`getByRole`/`getByText`/`getByLabel`でロール・アクセシブルネームベース。`.pillar-heading`のみクラス名を直接参照 | `.pillar-heading`のクラス名を維持していれば変更不要 |
| `tests/e2e/v1-review.spec.ts` | 全てロール・テキストベース | 変更不要 |
| `tests/e2e/v1-auth-link.spec.ts` | 全てロール・テキストベース | 変更不要 |

Radixの`Dialog.Portal`/`DropdownMenu.Portal`は`document.body`直下にレンダリングされるが、Playwrightの`page.getByRole()`等はDOM上の位置に依存せず文書全体を検索するため、Portal化によるセレクタ破損は起きない。

**とはいえ**、実装完了後は必ず`npm run test:e2e -- --project=chromium`をフルスイートで実行し、全specがgreenであることを確認すること（想定外の破損がないか確認するため。CLAUDE.mdの品質管理手順にも含まれる）。

---

## 8. 品質管理・動作確認手順

### 8.1 品質管理手順（`CLAUDE.md`に定める手順。上から順番に実行し、前の失敗を隠して進めない）

```bash
npm ci
npm run lint
npm run typecheck
npm test -- --run
npm run test:coverage
npm run build
npm run test:e2e -- --project=chromium
```

上記に続けて、Playwright CLI（`playwright-cli` skill、または `npx playwright test --ui` / 手動操作）で実画面を操作し、次を確認する:
- light / dark / system の3テーマ（OS設定の切り替えと、設定画面からの明示切り替えの両方）
- mobile / desktop のビューポート
- キーボード操作のみでの全操作（Tab移動、Escapeでの`TaskDetailsSheet`/`DropdownMenu`クローズ、Enterでの`Switch`トグル）
- `prefers-reduced-motion` / `prefers-reduced-transparency`
- ネットワーク断（Chrome DevToolsのOffline、または`page.route`で拒否）時の挙動が壊れないこと

`rtk git diff --check`、旧参照検索（`--color-accent`が意図せずAI機能以外に残っていないか、`btn-danger`/`btn-small`/`visually-hidden`が残っていないか）、secret混入確認も実施する。

### 8.2 ブラウザでの動作確認手順（具体的な操作と期待結果）

開発サーバーが起動済みとは限らないため、起動前に`lsof -i :5173`等で空きポートを確認し、必要なら自分で`npm run dev`（Vite + wrangler pages dev の並行起動）を実行する。

1. `http://localhost:5173/` （LP）を開く → 見出し「ひとつずつ、前に進める。」が表示される。3つのpillarカードがスクロールでフェードイン表示される（`prefers-reduced-motion`有効時は即表示）。「使ってみる」リンクを押すと `/app` に遷移する。
2. `/app` を開く → NowCardに初期タスク「Pomdo を5分だけ触ってみる」が表示される。円盤タイマーが表示され、集中色（インディゴ）で描画されている（AI色のオレンジになっていないことを確認 — §3の変数名衝突の検証）。
3. On Deckにタスクを追加 → タスク行の「⋯」ボタンをクリック → DropdownMenuが開き「編集」「今これにする」（`messages.task.moveToNow`）「削除」が表示される。「編集」を選ぶ → `TaskDetailsSheet`が画面下からspringアニメーションで開く（バウンドするような動き）。
4. `TaskDetailsSheet`のgrabber（つまみ）を下方向にドラッグ → シートが指に追従して動く。途中で離す → 一定距離を超えていればシートが閉じ、超えていなければ元の位置にスプリングで戻る。上方向にドラッグした場合はゴムのように抵抗して少しだけ動く。
5. `TaskDetailsSheet`を開いた状態でEscapeキーを押す → 閉じる（アニメーション込みで）。オーバーレイの背景をクリックしても閉じる。
6. DropdownMenuで「削除」を選ぶ → `window.confirm`が表示され、OKで削除される。
7. `/app/settings` を開く → 音量スライダーをドラッグ → トラックの塗り（primary色）とつまみが追従し、値が保存される（ネットワークタブで`settings.update`が呼ばれることを確認）。ミュートのSwitchをクリック/タップ → トグルし、つまみがspring的にスライドする。ラベルの文字列（「ミュート」）をクリックしても同様にトグルすることを確認する（labelable element経由の暗黙関連付けの検証）。
8. テーマを「system」→「light」→「dark」→「system」と切り替え、それぞれ即座に反映されることを確認する。OS側のダーク/ライト設定も切り替えて、`data-theme`属性なしの状態でOS設定に追従することを確認する（§4.4の3パターン）。
9. JSONエクスポート・アカウント削除ボタンが押せること、文言が変わっていないことを確認する。
10. `/app/review` で棒グラフ（primary/secondary色ではなくprimaryの濃淡）が表示され、`role="img"`のaria-labelが「直近7日の集中時間」のままであることを確認する。

---

## 9. テスト方針

### 9.1 既存テストへの影響

- ユニットテスト（Vitest）: `src/components/layout/PomdoBrand.test.tsx`と`src/components/timer/TimerDisc.test.tsx`は、対象コンポーネントの構造・アクセシブルネームを変更しないため無修正で通る想定。実行して確認する。
- E2E（Playwright）: §7の通り、想定される変更は不要（`.pillar-heading`維持が条件）。フルスイートを実行して確認する。

### 9.2 新規追加するテスト

daisyUI化そのものは見た目の変更でありユニットテストの対象にしないが、Radix統合による新しい振る舞い（`TaskDetailsSheet`の`displayedTask`保持ロジック、`TaskRow`のDropdownMenu化）は現状カバレッジが無い新しい分岐なので、以下を追加する。配置場所は既存の`PomdoBrand.test.tsx`/`TimerDisc.test.tsx`と同じ、対象コンポーネントと同じディレクトリに`.test.tsx`。

- `src/components/tasks/TaskDetailsSheet.test.tsx`
  - `task`ありでレンダリングすると、タイトル・メモ・見積もりの各入力欄に`task`の値が反映されている
  - 異なる`id`を持つ`task`に差し替えてrerenderすると、フォームの値が新しい`task`の値にリセットされる（`useEffect(..., [task?.id])`の検証）
  - 一度も`task`が渡されていない状態（初回レンダリングから`task=null`）では`displayedTask`もnullのままなので、`Dialog`を含め何もレンダリングされない（`screen.queryByRole('dialog')`が`null`）
  - 一度`task`ありでレンダリングされたあとに`task=null`に変わると`Dialog`の`open`が`false`になる（jsdom環境では`Presence`によるアンマウント遅延が実質発生しないため、`waitFor`等で最終的に`screen.queryByRole('dialog')`が`null`になることを確認する）
- `src/components/tasks/TaskRow.test.tsx`
  - 「⋯」ボタン相当のトリガーをクリックするとメニューが開き、「編集」「削除」が表示される
  - `onMoveToNow`を渡した場合のみ「今これにする」（`messages.task.moveToNow`）項目が表示される
  - 各メニュー項目のクリックで対応するコールバック（`onEdit`/`onDelete`/`onMoveToNow`）が呼ばれる

テストコードの命名・記述は`code-comments`/`code-naming` skillに従うこと（テスト名は「どういう状態で・何をすると・どうなるか」が読み取れる形にする。例: `異なるタスクへ切り替えるとフォームの入力値が新しいタスクの値にリセットされる`）。

---

## 10. 実装順序の推奨

依存関係に基づく推奨順序。各ステップ完了後に`npm run typecheck`と`npm test -- --run`を回して早期にエラーを検出すること。

1. パッケージインストール（§2）、`vite.config.ts`変更（§5）
2. `src/index.css`の全面書き換え（§3, §4）— この時点でアプリ全体の見た目が一旦大きく崩れる想定（daisyUIのデフォルトスタイルが当たるため）。次のステップで各コンポーネントを直していく前提の中間状態でよい。
3. `src/App.css`削除（§6.1）
4. グローバルなクラス名置換（`btn-danger`→`btn-error`、`btn-small`→`btn-sm`、`TaskAddForm.tsx`の`visually-hidden`→`sr-only`）（§4.5、対象ファイルは§6.7の一覧）
5. `TaskRow.tsx`のDropdownMenu化（§6.2）
6. `TaskDetailsSheet.tsx`のDialog化（§6.3）、`TaskList.tsx`/`AppPage.tsx`の`key`prop削除（§6.4）
7. `SettingsPage.tsx`のSlider/Switch化（§6.6）
8. 残りのコンポーネントの色var確認（§6.7の一覧を上から順に、ブラウザで見た目を確認しながら）
9. §8の品質管理手順をフルで実行
10. §9の新規テスト追加

---

## 11. 決定事項ログ

このIssueの実装計画作成にあたり、コード調査の過程でIssue/ADRの記述と実際のコードが食い違う箇所が見つかったため、以下の通り作成者（あなた/Claude）またはユーザーに確認して確定させた。実装中にこれらを再検討する必要はない。

### 11.1 ユーザーに確認して確定した事項

1. **`TaskDetailsSheet`のspring開閉・ドラッグクローズ**: 現行実装には存在しない（mockupのみに存在）。ユーザーの回答により「mockup仕様通り新規実装する」方針で確定（§6.3）。
2. **`TaskRow`の「⋯」ボタン**: 現行は`onEdit`直呼びのみで、削除ボタンは視覚的に到達不能だった。ユーザーの回答により「DropdownMenu化して編集/削除/今これにするを統合」方針で確定（§6.2）。

### 11.2 実装計画作成者が事実確認して確定した事項

3. **dark用の`--shadow-card`/`--shadow-sheet`**: 現行`src/index.css`には存在せず、`docs/v1-mockup.html`にのみ存在する（強化版の値）。Issueの「mockupの値は変更しない」を優先し、mockupの値を採用（§4.3）。
4. **`TaskDetailsSheet`の見出し文言とE2Eテストの整合性**: 事前調査で「E2Eテストが`TaskDetailsSheet`の見出しにタスクタイトルを期待しており、現行コードの固定文言『タスクを編集』と矛盾するのでは」という懸念が浮上したが、`npx playwright test`で実際にテストを実行し、該当テストが現状green（合格）であることを確認。該当の`getByRole('heading', {name:'いつか読む記事'})`は`NowCard`のタスク昇格後の見出しを検証しているのであって`TaskDetailsSheet`とは無関係と判明した（§7）。`TaskDetailsSheet`の見出しは変更不要。
5. **`messages.settings.export`の文言**: 事前調査で「コード上のボタン文言とE2Eテストの期待文言（半角スペースの有無）が食い違うのでは」という懸念が浮上したが、`src/messages.ts`を直接読み実際の値（`'JSONをエクスポート'`、スペースなし）を確認し、E2Eテストの期待値と完全一致することを確認済み（懸念は誤りだった）。

### 11.3 実装計画作成者が設計判断として決定した事項（デザイン上の意味を持たない機械的決定）

6. **daisyUIテーマの`*-content`色**: 現行コードで唯一存在した前景色の指定（`.btn-primary`のdark時`#17173a`）を全スロット・両テーマに一般化した。`neutral`/`info`/`success`/`warning`はpomdo UIで未使用のスロットだが、ADR 0010が`accent`について指摘した「未定義だと将来の誤用時に破綻する」リスクと同じ理由で安全な値を明示した（§4.1）。視覚的な意味を持たない決定なので、実装中に見た目が気になれば調整してよい。

### 11.4 実装計画作成者が設計判断として決定した事項（トークンの数値精度に関わる決定）

7. **`--color-text-muted`/`--color-text-faint`をopacity修飾ではなく個別トークンのまま維持**: ADR文中の「base-content（+opacity調整）」という表現は一般論であり、厳密にopacityで近似すると背景色によって実効色が変わり「既存の値を変更しない」というIssueの完了条件に抵触するリスクがあるため、既存hexをそのまま個別のCSS変数として維持する判断とした（§4.2）。

これ以外の点で、実装中にIssue本文・ADR・このファイルの記述と実際のコードが食い違う場合、または要件の解釈次第で設計が大きく変わる場合は、推測で進めずユーザーに確認すること。
