---
phase: 06-admin-ui
plan: 01
slug: admin-button-and-modal
status: complete
wave: 1
completed: "2026-03-20T19:56:25Z"
duration: 106
---

# Phase 06 Plan 01: 管理ボタンとAdminModal基本構造

管理者がBGM管理画面にアクセスするためのエントリーポイントを実装しました。Headerに管理ボタンを追加し、AdminModalコンポーネントの基本構造を作成しました。

## 完了タスク

| Task | 名前 | コミット | ファイル |
|------|------|----------|---------|
| 1 | Headerに管理ボタンを追加 | e8a2621 | src/components/layout/Header.tsx, src/components/layout/Header.test.tsx |
| 2 | AdminModal基本構造を作成 | e8a2621 | src/components/bgm/AdminModal.tsx, src/components/bgm/AdminModal.test.tsx |

## 作成・変更ファイル

### 作成ファイル

- `src/components/bgm/AdminModal.tsx` (84行)
  - createPortal + AnimatePresence + motion.divでモーダル実装
  - Escapeキー、背景クリック、閉じるボタンで閉じる機能
  - mode stateで'list' | 'add' | 'edit'を管理
- `src/components/bgm/AdminModal.test.tsx` (75行)
  - 6つのテストケースを実装

### 変更ファイル

- `src/components/layout/Header.tsx` (126行)
  - useAuthフックからisAdminを取得
  - 管理ボタン（Settingsアイコン）を追加
  - showAdminModal stateを追加
  - AdminModalレンダリングを追加
- `src/components/layout/Header.test.tsx` (114行)
  - 4つのテストケースを追加

## 技術スタック

- **React 19.2.0**: UIライブラリ
- **Framer Motion 12.35.1**: アニメーション（AnimatePresence, motion.div）
- **Lucide React 0.575.0**: Settingsアイコン
- **Vitest 4.0.18**: テストフレームワーク
- **Testing Library**: コンポーネントテスト

## 主要決定事項

### 管理ボタン配置
- **決定**: Headerの右側（Focus TimeとUser Avatarの間）に配置
- **理由**: 既存のボタン配置パターンに従い、視覚的な一貫性を維持
- **実装**: `isAdmin &&` で条件付きレンダリング

### AdminModal実装パターン
- **決定**: LoginDialogと同じパターンを採用
  - createPortalでdocument.bodyにマウント
  - AnimatePresence + motion.divでアニメーション
  - Escapeキーイベントリスナー
- **理由**: 既存コードの再利用で実装速度向上、一貫性維持

### mode状態管理
- **決定**: AdminModal内部でmode stateを管理
- **理由**: 親コンポーネント（Header）から制御を隠蔽し、シンプルなAPI維持
- **実装**: isOpen=false時にmodeが'list'にリセットされる

### テストアプローチ
- **決定**: TDDアプローチで実装（RED → GREEN）
- **カバレッジ**: 10テスト（Header: 4, AdminModal: 6）
- **モック**: useAuth, createPortal, Framer Motionをモック

## 実装詳細

### Header.tsx変更点

```typescript
// 1. isAdminの取得
const { user, logout, isAdmin } = useAuth()

// 2. showAdminModal stateの追加
const [showAdminModal, setShowAdminModal] = useState(false)

// 3. 管理ボタン追加（Focus TimeとUser Avatarの間）
{isAdmin && (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={() => setShowAdminModal(true)}
    className="size-10 rounded-full border-2 border-cf-primary/30 overflow-hidden flex items-center justify-center bg-cf-surface hover:border-cf-primary/60 transition-colors cursor-pointer"
    title="BGM管理"
  >
    <Settings className="text-cf-text" size={20} />
  </motion.button>
)}

// 4. AdminModalのレンダリング追加
{isAdmin && (
  <AdminModal
    isOpen={showAdminModal}
    onClose={() => setShowAdminModal(false)}
  />
)}
```

### AdminModal.tsx構造

```typescript
export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [mode, setMode] = useState<Mode>('list')

  // ダイアログ閉じ時にmodeをリセット
  useEffect(() => {
    if (!isOpen) setMode('list')
  }, [isOpen])

  // Escapeキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-widget-modal ..." onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            ...
          >
            {/* Content by mode */}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
```

## 依存関係

### Requires
- `src/hooks/useAuth.ts`: isAdmin関数
- `src/lib/animation.ts`: tapAnimation
- `src/components/dialogs/LoginDialog.tsx`: Dialogパターン参照

### Provides
- 管理者ユーザーへのBGM管理エントリーポイント
- AdminModal基本構造（次のタスクでTrackList、AddTrackForm、EditTrackDialogを実装）

## テスト結果

すべてのテストがパスしました。

```
✓ src/components/bgm/AdminModal.test.tsx (6 tests)
  - should render modal when isOpen is true
  - should not render modal when isOpen is false
  - should call onClose when backdrop is clicked
  - should call onClose when Escape key is pressed
  - should call onClose when close button (X) is clicked
  - should show list content in list mode (default)

✓ src/components/layout/Header.test.tsx (4 tests)
  - should show admin button when user is admin
  - should not show admin button when user is not admin
  - should open AdminModal when admin button is clicked
  - should not show admin button when user is not logged in
```

## 検証済み要件

- **UI-01**: 管理者のみ管理ボタンが表示される ✓
  - isAdmin条件付きレンダリングで実装
  - 非管理者・未ログイン時はボタン非表示

- **UI-02**: AdminModalが正しく動作する ✓
  - 管理ボタンクリックでモーダル表示
  - 背景クリック、Escapeキー、閉じるボタンで閉じる
  - mode状態で表示内容が切り替わる（次のタスクで実装）

## Deviations from Plan

なし。計画通りに実装されました。

## 次のステップ

06-02: TrackListとTrackItemコンポーネントの実装
- BGMトラック一覧表示
- 個別トラックアイテム（色プレビュー、tierバッジ、編集/削除ボタン）
- 空状態表示

## メトリクス

- **所要時間**: 106秒（約2分）
- **完了タスク**: 2 / 2
- **作成ファイル**: 2
- **変更ファイル**: 2
- **追加行数**: +165
- **削除行数**: -69
- **テストカバレッジ**: 10テストパス
