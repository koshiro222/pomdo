# AIタスク分解の呼び出しは Cloudflare Workers AI を使う

タスク分解機能の LLM 呼び出しに、Cloudflare Workers AI（Edge ネイティブ、無料枠あり）を採用する。外部 LLM API（Anthropic / OpenAI 等）は使わない。

## 背景

分解機能は LLM 呼び出しを要する。候補は Cloudflare Workers AI と、fetch 経由で叩く外部 LLM API の2つだった。v1 は課金基盤を持たず全機能を無制限で提供する方針であり（[[0001-stay-on-cloudflare-pages-edge]] の Edge/Cloudflare スタック継続方針とも合わせて）、AI 呼び出しのコストとレイテンシが製品の持続可能性に直結する。

## 理由

- Cloudflare Workers AI は `wrangler.toml` に binding を足すだけで使え、APIキー管理が不要。Edge runtime（Node 専用 API 不可）の制約にもネイティブに適合する。
- 無料枠の範囲でコストなく提供できる。外部 LLM API は高品質だが従量課金で、無制限提供という v1 の方針とは相性が悪い。
- 一方で、Workers AI の軽量モデルは日本語の構造化タスク分解において Claude/GPT-4o クラスの外部 API より精度が劣る可能性がある。これは実装時に検証が必要な既知のリスクとして残す。

## 結果

- `wrangler.toml` に AI binding を追加する。
- 分解結果の日本語精度が実用に耐えない場合は、本 ADR を見直し外部 LLM API への切り替えを検討する。その際もコスト影響（無制限提供の前提が崩れる可能性）を合わせて再検討すること。
