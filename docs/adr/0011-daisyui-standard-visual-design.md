# daisyUI標準デザインをUIの見た目の正とする

ADR 0010で維持すると決めた`docs/v1-mockup.html`の配色・見た目を、今回以降のUI仕様の正とはしない。既に導入済みのdaisyUI + Radix UI基盤、既存の操作・データ保存・アクセシビリティは維持し、画面の配色とコンポーネント表現はdaisyUIの標準light/darkテーマと標準クラスへ寄せる。Focusは`primary`、Breakは`secondary`、AI分解は`accent`、削除などの破壊的操作は`error`という意味付けを維持する。

## Status

accepted

## Considered Options

- `docs/v1-mockup.html`の見た目を維持する: ADR 0010の既存方針だが、導入済みdaisyUIの標準コンポーネントと現在の見た目の差を解消できないため採用しない。
- daisyUIの導入だけ維持して独自CSSを主とする: 画面ごとの表現差とホバー状態の視認性問題が残るため採用しない。

## Consequences

- ADR 0010のうち、モックの配色・レイアウト・見た目を維持する部分は本ADRで上書きされる。ADR 0010はUI基盤をdaisyUI + Radix UIへ移行した履歴として残す。
- タイマー円盤、dnd-kitのドラッグ状態、Radix Dialogのシート開閉、レスポンシブ配置など、daisyUIで表現できない挙動・レイアウトには独自CSSを残す。
- `docs/v1-mockup.html`は削除しないが、今回の実装・レビューにおける視覚的な正解として参照しない。
