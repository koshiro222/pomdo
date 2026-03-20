import { useState } from 'react'
import { motion } from 'framer-motion'
import { trpc } from '@/lib/trpc'
import { useUiStore } from '@/core/store/ui'
import { tapAnimation } from '@/lib/animation'

export interface AddTrackFormProps {
  onBack: () => void
}

export function AddTrackForm({ onBack }: AddTrackFormProps) {
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

    // サイズチェック（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setFileError('ファイルサイズは10MB以下にしてください')
      setFileBase64(null)
      return
    }

    // タイプチェック（MP3のみ）
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

    await createMutation.mutateAsync({
      fileBase64,
      title,
      artist,
      color,
      tier,
    })
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
        <label htmlFor="color" className="text-xs text-cf-subtext">色</label>
        <div className="flex items-center gap-2">
          <input
            id="color"
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
        <label htmlFor="tier" className="text-xs text-cf-subtext">Tier</label>
        <select
          id="tier"
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
        <label htmlFor="file" className="text-xs text-cf-subtext">MP3ファイル（10MB以下）</label>
        <input
          id="file"
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
