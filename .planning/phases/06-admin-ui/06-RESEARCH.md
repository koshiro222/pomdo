# Phase 6: Admin UI - Research

**Researched:** 2026-03-21
**Domain:** React + tRPC + Framer Motion
**Confidence:** HIGH

## Summary

Phase 6では、管理者がブラウザからBGMトラックを管理するUIを実装する。バックエンドAPI（tRPC mutations）はPhase 4で実装済みであり、このフェーズは純粋なフロントエンドUI開発に焦点を当てる。

既存コードベースには`LoginDialog.tsx`、`MigrateDialog.tsx`、`TodoList.tsx`、`TodoItem.tsx`などの実績あるパターンが存在し、これらを再利用することで迅速かつ一貫性のある実装が可能。`createPortal` + `AnimatePresence` + `motion.div`によるモーダルパターン、`slideInVariants`によるリストアニメーション、`useUiStore`によるトースト通知など、すべて必要な部品が揃っている。

**主要な技術的決定事項:**
- UI形式: Adminモーダル（`createPortal`でbodyにマウント、背景クリック/Escapeキーで閉じる）
- リスト表示: TodoList/TodoItemパターンの完全再利用
- ファイルアップロード: `<input type="file" />` + FormData（ドラッグ&ドロップは除外）
- 色選択: OS標準カラーピッカー（`<input type="color" />`）
- エラー表示: `useUiStore`のトースト通知（form内エラー表示なし）
- ローディング状態: ボタンのdisabled + テキスト変更

**主要な推奨事項:**
- 楽観的UI（optimistic updates）は実装しない（サーバー応答後にrefetch）
- スケルトンローディングは実装しない（`loading`状態でシンプルな表示）
- refetchは各mutation成功後の即時実行（`utils.bgm.getAll.invalidate()`）

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.0 | UIライブラリ | プロジェクト既定 |
| Framer Motion | 12.35.1 | アニメーション | 既存コンポーネントで使用済み |
| tRPC React | 11.0.0 | APIクライアント | プロジェクト既定 |
| TanStack Query | 5.90.21 | データフェッチ | tRPC内包 |
| Lucide React | 0.575.0 | アイコン | プロジェクト既定 |
| Zustand | 5.0.11 | 状態管理（トースト） | 既存`useUiStore`使用 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.1.1 | 条件クラス結合 | Tailwindクラスの動的切り替え |
| tailwind-merge | 3.5.0 | Tailwindクラスマージ | cn()ユーティリティ経由 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Adminモーダル | 専用ページ | ページ遷移が不要、コンテキスト維持 |
| Listパターン | Table | 既存パターンの再利用、実装シンプル |
| Buttonのみ | ドラッグ&ドロップ | 実装確実、コード量少 |

**Installation:**
必要なパッケージはすべてインストール済み。

**Version verification:**
```bash
npm list framer-motion lucide-react @tanstack/react-query zustand
# framer-motion@12.35.1
# lucide-react@0.575.0
# @tanstack/react-query@5.90.21
# zustand@5.0.11
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── layout/
│   │   └── Header.tsx           # 既存：管理ボタン追加
│   ├── bgm/
│   │   ├── AdminModal.tsx       # 新規：メイン管理モーダル
│   │   ├── TrackList.tsx        # 新規：トラック一覧
│   │   ├── TrackItem.tsx        # 新規：トラックアイテム
│   │   ├── AddTrackForm.tsx     # 新規：追加フォーム
│   │   ├── EditTrackDialog.tsx  # 新規：編集ダイアログ
│   │   └── DeleteConfirmDialog.tsx # 新規：削除確認
│   └── dialogs/
│       ├── LoginDialog.tsx      # 既存：パターン参考
│       └── MigrateDialog.tsx    # 既存：パターン参考
├── hooks/
│   ├── useAuth.ts               # 既存：isAdmin使用
│   └── useBgmAdmin.ts           # 新規（オプション）：tRPCラッパー
├── core/
│   └── store/
│       └── ui.ts                # 既存：useUiStore使用
└── lib/
    └── animation.ts             # 既存：アニメーション定義
```

### Pattern 1: Admin Modal（createPortal + AnimatePresence）
**What:** `createPortal`で`document.body`にマウントし、`AnimatePresence`と`motion.div`でアニメーション付きモーダル
**When to use:** 管理画面など一時的なオーバーレイUI
**Example:**
```typescript
// Source: src/components/dialogs/LoginDialog.tsx
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export function AdminModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-widget-modal flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="widget p-6 w-full max-w-2xl m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Content */}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
```

### Pattern 2: TrackList + TrackItem（TodoListパターン再利用）
**What:** `AnimatePresence mode="popLayout"` + `slideInVariants`でアニメーション付きリスト
**When to use:** トラック一覧表示
**Example:**
```typescript
// Source: src/components/todos/TodoList.tsx, src/components/todos/TodoItem.tsx
import { AnimatePresence, motion } from 'framer-motion'
import { slideInVariants } from '@/lib/animation'

export function TrackList() {
  const { data: tracks } = trpc.bgm.getAll.useQuery()

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {tracks.length === 0 ? (
        <div className="text-cf-subtext text-center py-8">No tracks yet</div>
      ) : (
        <AnimatePresence mode="popLayout">
          {tracks.map((track) => (
            <TrackItem key={track.id} track={track} />
          ))}
        </AnimatePresence>
      )}
    </div>
  )
}

export function TrackItem({ track }: { track: BgmTrack }) {
  return (
    <motion.div
      variants={slideInVariants}
      initial="visible"
      animate="visible"
      className="group flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl"
    >
      {/* Track content */}
    </motion.div>
  )
}
```

### Pattern 3: tRPC Mutations + Toast Notifications
**What:** `trpc.bgm.create.useMutation()`で`onSuccess`時にトースト通知 + invalidate
**When to use:** 追加/編集/削除操作
**Example:**
```typescript
// Source: Standard tRPC + TanStack Query pattern
import { trpc } from '@/lib/trpc'
import { useUiStore } from '@/core/store/ui'

export function AddTrackForm() {
  const addToast = useUiStore(state => state.addToast)
  const utils = trpc.useUtils()

  const createMutation = trpc.bgm.create.useMutation({
    onSuccess: () => {
      addToast('トラックを追加しました', 'success')
      utils.bgm.getAll.invalidate() // 即時refetch
    },
    onError: (error) => {
      addToast(error.message, 'error')
    }
  })

  const handleSubmit = async (data: CreateBgmTrack) => {
    await createMutation.mutateAsync(data)
  }

  return <form onSubmit={handleSubmit}>{/* Fields */}</form>
}
```

### Pattern 4: File Upload（input type="file"）
**What:** `<input type="file" />`でファイル選択後、FileReaderでBase64変換
**When to use:** MP3ファイルアップロード
**Example:**
```typescript
// Source: Standard File API pattern
const [fileBase64, setFileBase64] = useState<string | null>(null)
const [fileError, setFileError] = useState<string | null>(null)

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // ファイルサイズチェック（10MB）
  if (file.size > 10 * 1024 * 1024) {
    setFileError('ファイルサイズは10MB以下にしてください')
    return
  }

  // Base64変換
  const reader = new FileReader()
  reader.onload = () => {
    const base64 = (reader.result as string).split(',')[1] // Data URLスキーム削除
    setFileBase64(base64)
    setFileError(null)
  }
  reader.readAsDataURL(file)
}

return <input type="file" accept="audio/mpeg" onChange={handleFileChange} />
```

### Pattern 5: Color Picker（input type="color"）
**What:** `<input type="color" />`でOS標準カラーピッカー使用
**When to use:** トラックの色選択
**Example:**
```typescript
// Source: Standard HTML5 color input
const [color, setColor] = useState('#3b82f6')

return (
  <div className="flex items-center gap-2">
    <input
      type="color"
      value={color}
      onChange={(e) => setColor(e.target.value)}
      className="w-10 h-10 rounded cursor-pointer"
    />
    <span className="text-sm text-cf-text">{color}</span>
  </div>
)
```

### Anti-Patterns to Avoid
- **楽観的UI（optimistic updates）の過度な使用:** トラック追加/編集/削除は即時refetchで十分。楽観的更新は実装複雑性が増す割に、UIスピードへの効果が少ない（ファイルアップロードを含む処理はそもそも遅い）
- **ドラッグ&ドロップの実装:** 実装コストに見合わない。ボタンのみで十分。
- **form内エラー表示:** トースト通知で一元化。LoginDialogの`bg-red-400/10`パターンは不使用。
- **スケルトンローディング:** `loading`状態でシンプルな表示で十分。`<div className="text-cf-subtext">Loading...</div>`レベルでOK。

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| モーダルアニメーション | カスタムCSSアニメーション | Framer Motion `AnimatePresence` | 既存パターンの一貫性、簡単な実装 |
| トースト通知 | 自作Notification | Zustand `useUiStore` | 既存実装あり、グローバル状態管理 |
| ファイルBase64変換 | 手動実装 | FileReader API | 標準API、1行で変換可能 |
| フォームバリデーション | 自作バリデーション | Zodスキーマ（tRPC input） | tRPC側で既にバリデーション済み |
| 色選択UI | 自作カラーパレット | `<input type="color" />` | OS標準、アクセシビリティ確保 |

**Key insight:** このプロジェクトにはすでに成功したパターンが多数存在する。新しいパターンを発明するのではなく、既存の`LoginDialog.tsx`、`TodoList.tsx`、`useUiStore`などのパターンを再利用することで、実装速度を上げて一貫性を保つことができる。

## Common Pitfalls

### Pitfall 1: ファイルサイズチェックのタイミング
**What goes wrong:** サーバー側でのみチェックを行い、クライアント側でフィードバックがない
**Why it happens:** tRPC mutation内でのチェックに依存しすぎる
**How to avoid:** ファイル選択時（`onChange`）に即時チェックし、エラーを表示
**Warning signs:** `handleFileChange`内にサイズチェックがない

### Pitfall 2: Base64エンコーディングの不整合
**What goes wrong:** Data URLスキーム（`data:audio/mpeg;base64,`）を含めた文字列を送信し、サーバー側でデコードエラー
**Why it happens:** `FileReader.readAsDataURL()`が返す値をそのまま使用
**How to avoid:** Base64部分のみ抽出（`split(',')[1]`）
**Warning signs:** サーバー側で`atob()`失敗

### Pitfall 3: refetch忘れによるUI不一致
**What goes wrong:** 追加/編集/削除後、リストが更新されない
**Why it happens:** mutationの`onSuccess`で`utils.bgm.getAll.invalidate()`呼び出し忘れ
**How to avoid:** 各mutation定義時に`onSuccess`コールバックを必ず実装
**Warning signs:** `useMutation`に`onSuccess`がない

### Pitfall 4: Escapeキーイベントリスナーの重複
**What goes wrong:** モーダルを開くたびにイベントリスナーが追加され、メモリリーク
**Why it happens:** `useEffect`のクリーンアップ関数を実装しない
**How to avoid:** `useEffect`のreturnで`removeEventListener`を必ず実行
**Warning signs:** `useEffect`にreturn句がない

### Pitfall 5: isAdminチェックの不整合
**What goes wrong:** 非管理者にも管理ボタンが表示される
**Why it happens:** `useAuth()`の`isAdmin`を使用しない
**How to avoid:** `Header.tsx`で`{isAdmin && <AdminButton />}`を必ず実装
**Warning signs:** 管理ボタン表示条件に`isAdmin`がない

### Pitfall 6: 色プレビューの実装漏れ
**What goes wrong:** 選択した色が視覚的に確認できない
**Why it happens:** 色選択UIとプレビュー表示を分けて実装
**How to avoid:** 色選択inputと同じ色の`div`を隣接して配置
**Warning signs:** 色選択UIのみでプレビューがない

## Code Examples

Verified patterns from official sources:

### Admin Modal基本構造
```typescript
// Source: src/components/dialogs/LoginDialog.tsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { tapAnimation } from '@/lib/animation'

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list')

  useEffect(() => {
    if (!isOpen) {
      setMode('list') // リセット
    }
  }, [isOpen])

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
        <div
          className="fixed inset-0 z-widget-modal flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="widget p-6 w-full max-w-2xl m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-cf-text">BGM管理</h3>
              <motion.button
                {...tapAnimation}
                onClick={onClose}
                className="text-cf-subtext hover:text-cf-text transition-colors cursor-pointer"
              >
                <X size={20} />
              </motion.button>
            </div>

            {mode === 'list' && <TrackList onAdd={() => setMode('add')} />}
            {mode === 'add' && <AddTrackForm onBack={() => setMode('list')} />}
            {mode === 'edit' && <EditTrackForm onBack={() => setMode('list')} />}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
```

### TrackList + TrackItem
```typescript
// Source: src/components/todos/TodoList.tsx, src/components/todos/TodoItem.tsx
import { AnimatePresence, motion } from 'framer-motion'
import { Edit2, Trash2, Plus } from 'lucide-react'
import { slideInVariants, tapAnimation, hoverAnimation } from '@/lib/animation'
import { trpc } from '@/lib/trpc'

export function TrackList({ onAdd }: { onAdd: () => void }) {
  const { data: tracks, isLoading } = trpc.bgm.getAll.useQuery()

  if (isLoading) {
    return <div className="text-cf-subtext">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-cf-text">トラック一覧</h4>
        <motion.button
          {...tapAnimation}
          {...hoverAnimation}
          onClick={onAdd}
          className="flex items-center gap-2 px-3 py-1.5 bg-cf-primary text-white rounded-lg text-sm"
        >
          <Plus size={16} />
          追加
        </motion.button>
      </div>

      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="text-cf-subtext text-center py-8">No tracks yet</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tracks.map((track) => (
              <TrackItem key={track.id} track={track} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function TrackItem({ track }: { track: BgmTrack }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  return (
    <>
      <motion.div
        variants={slideInVariants}
        initial="visible"
        animate="visible"
        className="group flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:border-cf-primary/30 transition-colors"
      >
        {/* Color preview */}
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: track.color || '#3b82f6' }}
        />

        {/* Track info */}
        <div className="flex-1">
          <p className="text-sm font-medium text-cf-text">{track.title}</p>
          <p className="text-xs text-cf-subtext">{track.artist || 'Unknown'}</p>
        </div>

        {/* Tier badge */}
        <span className="text-xs bg-cf-primary/20 text-cf-primary px-2 py-0.5 rounded">
          {track.tier}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            {...tapAnimation}
            onClick={() => setShowEditDialog(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-cf-subtext hover:text-cf-text"
          >
            <Edit2 size={16} />
          </motion.button>
          <motion.button
            {...tapAnimation}
            onClick={() => setShowDeleteConfirm(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-cf-subtext hover:text-cf-danger"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </motion.div>

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          track={track}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}

      {showEditDialog && (
        <EditTrackDialog
          track={track}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </>
  )
}
```

### AddTrackForm（ファイルアップロード）
```typescript
// Source: Standard File API + tRPC mutation pattern
import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { useUiStore } from '@/core/store/ui'
import type { CreateBgmTrack } from '@/app/routers/_shared'

export function AddTrackForm({ onBack }: { onBack: () => void }) {
  const addToast = useUiStore(state => state.addToast)
  const utils = trpc.useUtils()

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [tier, setTier] = useState<'free' | 'premium'>('free')
  const [fileBase64, setFileBase64] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const createMutation = trpc.bgm.create.useMutation({
    onSuccess: () => {
      addToast('トラックを追加しました', 'success')
      utils.bgm.getAll.invalidate()
      onBack()
    },
    onError: (error) => {
      addToast(error.message, 'error')
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // サイズチェック
    if (file.size > 10 * 1024 * 1024) {
      setFileError('ファイルサイズは10MB以下にしてください')
      setFileBase64(null)
      return
    }

    // MP3チェック
    if (file.type !== 'audio/mpeg') {
      setFileError('MP3ファイルを選択してください')
      setFileBase64(null)
      return
    }

    // Base64変換
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setFileBase64(base64)
      setFileError(null)
    }
    reader.onerror = () => {
      setFileError('ファイルの読み込みに失敗しました')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileBase64) {
      setFileError('ファイルを選択してください')
      return
    }

    const data: CreateBgmTrack = {
      fileBase64,
      title,
      artist,
      color,
      tier,
    }

    await createMutation.mutateAsync(data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-cf-subtext">曲名</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
          placeholder="_focus_time"
        />
      </div>

      {/* Artist */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-cf-subtext">アーティスト</label>
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
          placeholder="Lofi Records"
        />
      </div>

      {/* Color */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-cf-subtext">色</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <span className="text-sm text-cf-text">{color}</span>
        </div>
      </div>

      {/* Tier */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-cf-subtext">Tier</label>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as 'free' | 'premium')}
          className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
        >
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {/* File Upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-cf-subtext">MP3ファイル（10MB以下）</label>
        <input
          type="file"
          accept="audio/mpeg"
          onChange={handleFileChange}
          className="text-sm text-cf-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cf-primary file:text-white hover:file:bg-cf-primary/90 cursor-pointer"
        />
        {fileError && (
          <p className="text-red-400 text-sm">{fileError}</p>
        )}
        {fileBase64 && !fileError && (
          <p className="text-cf-success text-sm">ファイル選択済み</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-2">
        <motion.button
          {...tapAnimation}
          type="button"
          onClick={onBack}
          disabled={createMutation.isPending}
          className="flex-1 bg-cf-surface hover:bg-cf-surface1 text-cf-text px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          戻る
        </motion.button>
        <motion.button
          {...tapAnimation}
          type="submit"
          disabled={createMutation.isPending || !fileBase64}
          className="flex-1 bg-cf-primary hover:bg-cf-primary/90 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {createMutation.isPending ? '追加中...' : '追加'}
        </motion.button>
      </div>
    </form>
  )
}
```

### EditTrackDialog（更新フォーム）
```typescript
// Source: tRPC update mutation pattern
import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { useUiStore } from '@/core/store/ui'
import type { UpdateBgmTrack } from '@/app/routers/_shared'

export function EditTrackDialog({
  track,
  onClose,
}: {
  track: BgmTrack
  onClose: () => void
}) {
  const addToast = useUiStore(state => state.addToast)
  const utils = trpc.useUtils()

  const [title, setTitle] = useState(track.title)
  const [artist, setArtist] = useState(track.artist || '')
  const [color, setColor] = useState(track.color || '#3b82f6')
  const [tier, setTier] = useState<'free' | 'premium'>(track.tier)

  const updateMutation = trpc.bgm.update.useMutation({
    onSuccess: () => {
      addToast('トラックを更新しました', 'success')
      utils.bgm.getAll.invalidate()
      onClose()
    },
    onError: (error) => {
      addToast(error.message, 'error')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data: UpdateBgmTrack = {
      id: track.id,
      title,
      artist,
      color,
      tier,
    }

    await updateMutation.mutateAsync(data)
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-widget-modal flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="widget p-6 w-full max-w-md m-4"
        >
          <h3 className="text-lg font-bold text-cf-text mb-4">トラック編集</h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Same fields as AddTrackForm, without file upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-cf-subtext">曲名</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
              />
            </div>

            {/* ... other fields ... */}

            <div className="flex gap-2">
              <motion.button
                {...tapAnimation}
                type="button"
                onClick={onClose}
                disabled={updateMutation.isPending}
                className="flex-1 bg-cf-surface hover:bg-cf-surface1 text-cf-text px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                キャンセル
              </motion.button>
              <motion.button
                {...tapAnimation}
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 bg-cf-primary hover:bg-cf-primary/90 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {updateMutation.isPending ? '更新中...' : '更新'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
```

### DeleteConfirmDialog
```typescript
// Source: src/components/dialogs/MigrateDialog.tsx（確認ダイアログパターン）
import { trpc } from '@/lib/trpc'
import { useUiStore } from '@/core/store/ui'

export function DeleteConfirmDialog({
  track,
  onClose,
}: {
  track: BgmTrack
  onClose: () => void
}) {
  const addToast = useUiStore(state => state.addToast)
  const utils = trpc.useUtils()

  const deleteMutation = trpc.bgm.delete.useMutation({
    onSuccess: () => {
      addToast('トラックを削除しました', 'success')
      utils.bgm.getAll.invalidate()
      onClose()
    },
    onError: (error) => {
      addToast(error.message, 'error')
    }
  })

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ id: track.id })
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-widget-modal flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="widget p-6 w-full max-w-md m-4"
        >
          <h3 className="text-lg font-bold text-cf-text mb-2">確認</h3>
          <p className="text-cf-subtext mb-6">
            「{track.title}」を削除しますか？
          </p>

          <div className="flex gap-2">
            <motion.button
              {...tapAnimation}
              onClick={onClose}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-cf-surface hover:bg-cf-surface1 text-cf-text px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              キャンセル
            </motion.button>
            <motion.button
              {...tapAnimation}
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-cf-danger hover:bg-cf-danger/90 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleteMutation.isPending ? '削除中...' : '削除'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
```

### Headerへの管理ボタン追加
```typescript
// Source: src/components/layout/Header.tsx
import { useAuth } from '@/hooks/useAuth'
import { Settings } from 'lucide-react'
import { AdminModal } from '@/components/bgm/AdminModal'

export function Header({ todayFocusMinutes = 0 }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth()
  const [showAdminModal, setShowAdminModal] = useState(false)

  return (
    <>
      <header className="glass rounded-xl mx-4 mt-4 flex items-center justify-between px-8 py-4">
        {/* ... existing content ... */}

        {/* Right: Focus Time + User + Admin Button */}
        <div className="flex items-center gap-4">
          {/* Focus Time */}
          <div className="flex flex-col items-end mr-2">
            <span className="text-xs text-cf-subtext">Today's Focus</span>
            <span className="text-sm font-bold text-cf-primary">
              {todayFocusMinutes > 0 ? formatFocusTime(todayFocusMinutes) : '—'}
            </span>
          </div>

          {/* Admin Button（adminのみ） */}
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

          {/* User Avatar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={user ? logout : () => setShowLoginDialog(true)}
            className="size-10 rounded-full border-2 border-cf-primary/30 overflow-hidden flex items-center justify-center bg-cf-surface hover:border-cf-primary/60 transition-colors cursor-pointer"
          >
            {user?.image ? (
              <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user ? <UserCircle className="text-cf-text" size={20} /> : <LogIn className="text-cf-text" size={20} />
            )}
          </motion.button>
        </div>
      </header>

      {/* Admin Modal */}
      {isAdmin && (
        <AdminModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
        />
      )}

      {/* Login Dialog */}
      {/* ... existing ... */}
    </>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 手動CSSアニメーション | Framer Motion | 2024年頃 | 宣言的アニメーション、パフォーマンス向上 |
| 自作通知システム | Zustand + toast | プロジェクト初期 | グローバル状態管理、簡単な実装 |
| ページ遷移 | モーダルUI | 2020年頃 | コンテキスト維持、UX向上 |

**Deprecated/outdated:**
- **createPortalなしのモーダル:** React 18以降は`createPortal`使用が標準
- **class-components:** React 19では関数コンポーネントが標準

## Open Questions

なし。すべての技術的決定事項は既存コードベースのパターンで解決可能。

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + Testing Library |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- src/components/bgm/AdminModal.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Headerに管理ボタン表示（adminのみ） | component | `npm test -- src/components/layout/Header.test.ts` | ❌ Wave 0 |
| UI-02 | BGM管理モーダル表示 | component | `npm test -- src/components/bgm/AdminModal.test.ts` | ❌ Wave 0 |
| UI-03 | トラック一覧表示 | component | `npm test -- src/components/bgm/TrackList.test.ts` | ❌ Wave 0 |
| UI-04 | ファイルアップロード機能 | integration | `npm test -- src/components/bgm/AddTrackForm.test.ts` | ❌ Wave 0 |
| UI-05 | 曲名・アーティスト・色編集 | integration | `npm test -- src/components/bgm/EditTrackDialog.test.ts` | ❌ Wave 0 |
| UI-06 | 削除確認ダイアログ | component | `npm test -- src/components/bgm/DeleteConfirmDialog.test.ts` | ❌ Wave 0 |
| UI-07 | ローディング・エラー状態表示 | component | `npm test -- src/components/bgm/AddTrackForm.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- src/components/bgm/<ComponentName>.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/bgm/AdminModal.test.tsx` — AdminModalコンポーネント
- [ ] `src/components/bgm/TrackList.test.tsx` — TrackListコンポーネント
- [ ] `src/components/bgm/TrackItem.test.tsx` — TrackItemコンポーネント
- [ ] `src/components/bgm/AddTrackForm.test.tsx` — AddTrackFormコンポーネント
- [ ] `src/components/bgm/EditTrackDialog.test.tsx` — EditTrackDialogコンポーネント
- [ ] `src/components/bgm/DeleteConfirmDialog.test.tsx` — DeleteConfirmDialogコンポーネント
- [ ] `src/components/layout/Header.test.tsx` — Headerコンポーネント（管理ボタン表示テスト追加）

Note: 既存の`src/test/setup.ts`でTesting Libraryのセットアップ済み。localStorage mockも含まれているため、Zustand storeのテストも可能。

## Sources

### Primary (HIGH confidence)
- `src/components/dialogs/LoginDialog.tsx` — createPortal + AnimatePresenceパターン
- `src/components/dialogs/MigrateDialog.tsx` — 確認ダイアログパターン
- `src/components/todos/TodoList.tsx` — リスト表示パターン
- `src/components/todos/TodoItem.tsx` — リストアイテムパターン
- `src/hooks/useAuth.ts` — isAdmin関数
- `src/app/routers/bgm.ts` — tRPC mutations実装
- `src/core/store/ui.ts` — useUiStore実装
- `src/lib/animation.ts` — Framer Motionアニメーション定義

### Secondary (MEDIUM confidence)
- Framer Motion公式ドキュメント — AnimatePresence, motion.div API
- React公式ドキュメント — createPortal, useEffectクリーンアップ
- tRPC公式ドキュメント — useMutation, utils.invalidate

### Tertiary (LOW confidence)
なし。すべてのパターンはプロジェクト内の既存コードで検証済み。

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - すべて既存パッケージ、バージョン確認済み
- Architecture: HIGH - 既存コードパターンの完全再利用
- Pitfalls: HIGH - 既存コードの課題から抽出

**Research date:** 2026-03-21
**Valid until:** 30日（安定した技術スタックのため）
