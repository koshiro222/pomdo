import { useState } from 'react'
import { motion } from 'framer-motion'
import { KeyRound, AlertCircle, CheckCircle } from 'lucide-react'
import { authClient } from '@/lib/auth'
import { tapAnimation } from '@/lib/animation'

export function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // トークンなし or エラー付きリダイレクト
  const urlError = new URLSearchParams(window.location.search).get('error')

  if (urlError || !token) {
    return (
      <div className="font-display bg-cf-background text-cf-text min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="widget p-8 w-full max-w-md mx-4 text-center"
        >
          <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
          <h1 className="text-xl font-bold text-cf-text mb-2">リンクが無効です</h1>
          <p className="text-cf-subtext text-sm mb-6">
            パスワードリセットリンクの有効期限が切れているか、無効です。
            <br />
            再度リセット申請を行ってください。
          </p>
          <motion.a
            {...tapAnimation}
            href="/"
            className="inline-block w-full rounded-lg bg-cf-primary px-4 py-3 text-sm font-medium text-white hover:bg-cf-primary/90 transition-colors cursor-pointer"
          >
            ホームに戻る
          </motion.a>
        </motion.div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="font-display bg-cf-background text-cf-text min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="widget p-8 w-full max-w-md mx-4 text-center"
        >
          <CheckCircle className="mx-auto mb-4 text-cf-primary" size={48} />
          <h1 className="text-xl font-bold text-cf-text mb-2">パスワードを変更しました</h1>
          <p className="text-cf-subtext text-sm mb-6">
            新しいパスワードでログインしてください。
          </p>
          <motion.a
            {...tapAnimation}
            href="/"
            className="inline-block w-full rounded-lg bg-cf-primary px-4 py-3 text-sm font-medium text-white hover:bg-cf-primary/90 transition-colors cursor-pointer"
          >
            ホームに戻る
          </motion.a>
        </motion.div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }
    setError(null)
    setLoading(true)
    const { error } = await authClient.resetPassword({ newPassword, token })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'パスワードのリセットに失敗しました')
    } else {
      setDone(true)
    }
  }

  return (
    <div className="font-display bg-cf-background text-cf-text min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="widget p-8 w-full max-w-md mx-4"
      >
        <div className="flex items-center gap-3 mb-6">
          <KeyRound className="text-cf-primary" size={24} />
          <h1 className="text-xl font-bold text-cf-text">新しいパスワードを設定</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-cf-subtext">新しいパスワード</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
              placeholder="8文字以上"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-cf-subtext">パスワード（確認）</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
              placeholder="8文字以上"
            />
          </div>
          <motion.button
            {...tapAnimation}
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cf-primary px-4 py-3 text-sm font-medium text-white hover:bg-cf-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? '更新中…' : 'パスワードを更新'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}
