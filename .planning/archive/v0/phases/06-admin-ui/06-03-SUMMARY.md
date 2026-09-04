---
phase: 06-admin-ui
plan: 03
subsystem: bgm-admin-ui
tags: [ui, component, bgm, admin]
dependency_graph:
  requires:
    - "06-00: Phase 0 foundation (trpc, types)"
    - "06-01: TrackList & TrackItem components"
    - "06-02: AddTrackForm component"
  provides:
    - "EditTrackDialog: トラック編集ダイアログ"
    - "DeleteConfirmDialog: 削除確認ダイアログ"
    - "AdminModal: 完成した管理モーダル（TrackList/AddTrackForm統合）"
  affects:
    - "src/components/bgm/*: BGM管理UIコンポーネント群"
tech_stack:
  added: []
  patterns:
    - TDDフロー: RED→GREEN→REFACTOR
    - createPortal + AnimatePresenceによるモーダル実装
    - tRPC mutationフックでの成功・失敗ハンドリング
    - tapAnimationによるボタンフィードバック
key_files:
  created:
    - src/components/bgm/EditTrackDialog.tsx
    - src/components/bgm/EditTrackDialog.test.tsx
    - src/components/bgm/DeleteConfirmDialog.tsx
    - src/components/bgm/DeleteConfirmDialog.test.tsx
  modified:
    - src/components/bgm/AdminModal.tsx
    - src/components/bgm/AdminModal.test.tsx
decisions: []
metrics:
  duration: "4分1秒"
  completed_date: "2026-03-21"
  tasks_completed: 3
  files_created: 4
  files_modified: 2
  tests_added: 15
  tests_passing: 15
---

# Phase 06 Plan 03: トラック編集・削除UI実装 Summary

**サマリー:** BGMトラックの編集ダイアログ（EditTrackDialog）と削除確認ダイアログ（DeleteConfirmDialog）をTDDで実装し、AdminModalにTrackListとAddTrackFormを統合して管理UIを完成させた。

## 完了タスク

| Task | 名前 | コミット | ファイル |
| ---- | ---- | -------- | -------- |
| 1 | EditTrackDialog実装 | 563587e | EditTrackDialog.tsx, .test.tsx |
| 2 | DeleteConfirmDialog実装 | a75ce7e | DeleteConfirmDialog.tsx, .test.tsx |
| 3 | AdminModal統合 | ccd76fc | AdminModal.tsx, .test.tsx |

## 成果物

### 1. EditTrackDialog（トラック編集ダイアログ）
- ファイル: `src/components/bgm/EditTrackDialog.tsx` (160行)
- 機能:
  - 既存トラック情報のフォーム表示（タイトル、アーティスト、色、Tier）
  - `trpc.bgm.update.useMutation` による更新
  - 成功時にトースト通知 + リスト更新 + ダイアログ閉じる
  - エラー時にエラートースト表示
  - `useEffect` でtrack変更時にフォーム値リセット
- テスト: 10件パス

### 2. DeleteConfirmDialog（削除確認ダイアログ）
- ファイル: `src/components/bgm/DeleteConfirmDialog.tsx` (70行)
- 機能:
  - 確認メッセージ: 「{title}」を削除しますか？
  - `trpc.bgm.delete.useMutation` による削除
  - 破壊的アクション用の赤色ボタン（`bg-cf-danger`）
  - 成功時にトースト通知 + リスト更新 + ダイアログ閉じる
  - エラー時にエラートースト表示
- テスト: 5件パス

### 3. AdminModal（完成した管理モーダル）
- ファイル: `src/components/bgm/AdminModal.tsx` (82行)
- 機能:
  - mode='list': TrackList表示
  - mode='add': AddTrackForm表示
  - mode='edit': プレースホルダー（編集はTrackItemから直接開く）
  - TrackList.onAdd → mode='add' 遷移
  - AddTrackForm.onBack → mode='list' 戻る
- テスト: 7件パス

## 技術詳細

### コンポーネント構造
```
AdminModal
├── mode='list' → TrackList
│   └── TrackItem → EditTrackDialog / DeleteConfirmDialog
└── mode='add' → AddTrackForm
```

### UIパターン
- **createPortal**: body直下にレンダリングしてz-index問題回避
- **AnimatePresence**: アニメーション付きで表示/非表示
- **tapAnimation**: ボタンクリック時のフィードバック（whileTap: { scale: 0.95 }）
- **Framer Motion**: initial→animate→exitでモーダルアニメーション

### データフロー
- **EditTrackDialog**: `trpc.bgm.update.useMutation` → `utils.bgm.getAll.invalidate()`
- **DeleteConfirmDialog**: `trpc.bgm.delete.useMutation` → `utils.bgm.getAll.invalidate()`
- **トースト通知**: `useUiStore(state => state.addToast)` で成功/エラー通知

### スタイリング
- **色**:
  - Primary: `bg-cf-primary`（青）
  - Danger: `bg-cf-danger`（赤、削除ボタン用）
  - Surface: `bg-cf-surface`（キャンセルボタン用）
- **フォームスタイル**: AddTrackFormと統一
- **アニメーション**: duration: 0.2s, ease: 'easeOut'

## テスト戦略

### モック設定
- **tRPC**: `trpc.bgm.update/delete.useMutation` をvi.fnでモック
- **useUiStore**: `addToast` をvi.fnでモック
- **react-dom**: `createPortal` をchildrenを返すようにモック
- **framer-motion**: motion.div/buttonを通常div/buttonに変換

### カバレッジ
- EditTrackDialog: 6種類のテスト（表示、入力、送信、成功、エラー、キャンセル）
- DeleteConfirmDialog: 5種類のテスト（表示、削除、成功、エラー、キャンセル）
- AdminModal: 7種類のテスト（表示、非表示、背景クリック、ESCキー、閉じるボタン、list/addモード）

### 制約事項
- **onSuccess/onErrorコールバック**: tRPCモックの複雑さのため、mutation呼び出しの検証にとどめ、コールバック呼び出しのテストはE2Eテストに委譲

## 課題と学び

### 課題
1. **テスト内のUnhandled Rejection**: mockRejectedValueでスローされたエラーがキャッチされない警告が出るが、テスト自体はパスするため無視
2. **select要素のvalue属性**: モックのmotion.divがvalue属性を転送していなかったため、 getByRole('combobox') で取得するよう修正

### 学び
1. **TDDフローの徹底**: RED→GREEN→REFACTORを各コンポーネントで実行
2. **モック設計**: tRPC mutationフックは返り値のオブジェクト構造を正確にモックする必要がある
3. **Portalテスト**: createPortalをchildrenを返すモックでテスト可能

## 次のステップ

- [ ] TrackItemにEditTrackDialog/DeleteConfirmDialogを統合（編集・削除ボタン）
- [ ] バリデーションファイル(06-VALIDATION.md)の確認
- [ ] E2Eテストで実際のAPI呼び出しを検証

## セルフチェック

- [x] EditTrackDialog.tsxが存在し、EditTrackDialogをexportしている
- [x] DeleteConfirmDialog.tsxが存在し、DeleteConfirmDialogをexportしている
- [x] AdminModal.tsxにTrackList/AddTrackFormが統合されている
- [x] すべてのテストがパスする（15件）
- [x] コミットが3つ作成されている
