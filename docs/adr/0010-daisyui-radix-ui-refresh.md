# UI実装基盤を daisyUI（Tailwind）+ Radix-ui に刷新する

v1 の既存 UI 実装（素の CSS によるセマンティックトークン + ハンドロールされたコンポーネント）を、daisyUI（Tailwind CSS ベースのスタイリング）と Radix-ui（アクセシブルなヘッドレスコンポーネント）を使う構成に刷新する。

## 背景

既存の UI はほぼ実装済みだったが、UI の質と実装速度を上げるためにコンポーネントライブラリの導入を決めた。daisyUI は CSS クラスのみを提供し JS の振る舞いを持たないため、`TaskDetailsSheet` の spring 開閉・ドラッグクローズ・フォーカストラップのような複雑なインタラクションは別途担当が要る。

## 理由

- daisyUI は見た目のスタイリングのみを担当させ、Dialog / Popover / Slider / Switch / DropdownMenu などのインタラクションとアクセシビリティは Radix-ui に担当させる。役割を分けることで、daisyUI 単体でインタラクションを自前実装し直すコストを避けられる。
- 既存の配色・レイアウト・タイポグラフィの値（`docs/v1-mockup.html` のトークン）はそのまま維持し、daisyUI のカスタムテーマとして同じ値を移植する。見た目を作り直すのではなく、実装の道具を差し替える。
- テーマ切り替え機構は pomdo 独自の `data-theme` 実装から daisyUI のテーマ機構（同じく `data-theme` 属性ベース）に一本化し、二重管理を避ける。

## トークンのマッピング

daisyUI のテーマは `primary` / `secondary` / `accent` / `base-100〜300` / `base-content` / `error` 等の色スロットを要求する。pomdo は元々「集中色・休憩色・danger」の3色構成だったが、今回追加する AI タスク分解機能に合わせて、新たに専用の AI アクセントカラーを追加しブランドカラーを3色構成にする。

| pomdo の概念 | daisyUI のスロット |
|---|---|
| 集中色（既存） | `primary` |
| 休憩色（既存） | `secondary` |
| AI関連 UI 要素を示す色（新規追加） | `accent` |
| 削除確認の赤（既存） | `error` |
| 背景・面（既存の3段階） | `base-100` / `base-200` / `base-300` |
| 本文・補助・淡色テキスト | `base-content`（+ opacity調整） |

色以外のトークン（`--fs-timer` などのタイポグラフィ、`--maxw`、`--r-card` などの形状、`--shadow-card`、`--dur` / `--ease-out` などのモーション）は daisyUI のテーマ機構の対象外のため、pomdo 独自の CSS 変数のまま維持する。

## Considered Options

- daisyUI の `accent` スロットを未定義のまま残す: `btn-accent` 等の daisyUI 標準クラスが未定義値で描画され、将来の実装者が意図せず使った際に見た目が破綻するリスクがあるため見送った。
- `accent` スロットに `primary` の値を複製する: 見た目の破綻は防げるが、AI タスク分解という今回の主目的と結びつく意味を持たせられないため、AI 専用色の新設を選んだ。

## 結果

- `docs/v1-mockup.html` に AI アクセントカラーの新トークンを追記する。
- Radix-ui・daisyUI・Tailwind CSS を新規に依存として追加する。
- 既存の Playwright E2E テストは、UI コンポーネントの書き直しに伴いセレクタの見直しが必要になる。
