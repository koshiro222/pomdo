# ワークフロー

GitHub Flow採用。mainへの直接コミット禁止。

開発フロー: issue作成 → feature ブランチ → PR（必ずこの順序で進める）

1. 作業前に対応する GitHub Issue を確認する
2. feature ブランチを main から作成する
   - **命名規則**: `feature/#issue番号_動詞_機能`
   - 例: `feature/#42_add_user_auth`
3. 実装・動作確認後にコミット・push
4. Issue を参照した PR を作成する

- Issue作成: ai-rules/ISSUE_GUIDELINES.md を参照
- テスト: ai-rules/TESTING.md を参照
- コミット・PR: ai-rules/COMMIT_AND_PR_GUIDELINES.md を参照