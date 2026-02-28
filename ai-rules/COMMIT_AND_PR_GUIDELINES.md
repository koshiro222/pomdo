# コミット・PRガイドライン

## コミットメッセージ

### Conventional Commits形式

```
<種別>(<スコープ>): <簡潔な説明>

<詳細な説明（任意）>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
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

- `settings` - 設定管理機能
- `devices` - デバイス管理機能
- `matches` - 戦績管理機能
- `profile` - プロフィール機能
- `auth` - 認証機能
- `ui` - UIコンポーネント
- `db` - データベース関連
- `infra` - インフラ構成

### 例

```
feat(settings): 設定編集ページを実装

既存の設定を編集できる機能を追加。感度・DPI・eDPI等の更新に対応。

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

```
fix(devices): デバイス画像が表示されない問題を修正

画像URLの取得ロジックを修正し、正しいパスから画像を表示するように変更。

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
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

## 作業手順

1. mainからfeatureブランチを作成
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/xxx
   ```

2. 作業・コミット

3. リモートへpush
   ```bash
   git push -u origin feature/xxx
   ```

4. PRを作成（ghコマンド）
   ```bash
   gh pr create --title "[feat] 設定編集ページを実装" --body "本文..."
   ```

5. レビュー後にマージ
