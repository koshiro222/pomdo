# コミット・PRガイドライン

## コミットメッセージ

### Conventional Commits形式

```
<種別>(<スコープ>): <簡潔な説明>

<詳細な説明（任意）>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### 種別一覧

| 種別 | 説明 |
|------|------|
| `feat` | 新機能追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントの変更 |
| `style` | コードのスタイルの変更（セミコロンの追加や改行の修正など） |
| `refactor` | コードのリファクタリング（バグの修正や機能の追加は含まない） |
| `perf` | パフォーマンスの向上 |
| `test` | テストの追加・修正 |
| `build` | ビルドシステムの変更または依存関係のアップデート |
| `ci` | CI/CD の設定の変更 |
| `chore` | その他の変更 |

### スコープ（任意）

- `auth` - 認証機能（Google OAuth, JWT）
- `todo` - Todo CRUD 機能
- `timer` - ポモドーロタイマー
- `bgm` - BGM 再生機能
- `db` - データベース・スキーマ関連
- `ui` - UIコンポーネント
- `infra` - インフラ・設定

### 例

```
feat(todo): Todo CRUD API を実装

GET/POST/PATCH/DELETE /api/todos を追加。
ゲストモードは localStorage、ログイン時はDBに保存する二重構造。

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

```
fix(timer): タイマーリセット時にセッションが二重記録される問題を修正

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## PRタイトル・本文

### タイトル

コミットメッセージと同様の形式を使用

```
[種別] 簡潔な説明
```

### 本文テンプレート

```markdown
## 変更内容
- 変更点1
- 変更点2

## 実装のポイント
- 技術的な決定事項
- 既存機能への影響

## テスト・動作確認
- [ ] ローカル環境で動作確認済み
- [ ] 既存機能に影響がないことを確認

## 関連Issue
Closes #<issue番号>
```

