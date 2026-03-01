# テスト・動作確認ガイドライン

## テストコマンド

```bash
npm test              # vitest（ユニットテスト）
npm run test:e2e      # Playwright E2E テスト
npm run test:e2e:ui   # Playwright UI モード
npm run test:e2e:debug  # Playwright デバッグモード
```

## E2Eテスト（必須）

実装後は `/playwright-cli` skill でブラウザ動作確認を行う（Skill tool 経由で呼び出す）。

- Python/JavaScript/Bash による直接ブラウザ操作禁止
- エラーが発生した場合は即座に報告し、修正してから再確認する

## ユニットテスト（推奨）

ロジック・フック・ユーティリティにはユニットテストを作成する。
テストファイルは対象ファイルと同ディレクトリに `*.test.ts` で配置。

## テスト対象の優先度

1. **必須**: 実装した機能のE2E動作確認（ゲストモード・ログイン状態両方）
2. **推奨**: 複雑なロジックを持つカスタムフックのユニットテスト
3. **既存テストへの影響確認**: 変更が既存テストを壊していないか `npm test` で確認
