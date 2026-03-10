import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { authClient } from '@/lib/auth'
import { GoogleIcon } from '@/components/auth/LoginButton'
import { X } from 'lucide-react'
import { tapAnimation } from '@/lib/animation'

interface LoginDialogProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'top' | 'signin' | 'signup' | 'verify_sent'

export function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
  const { login } = useAuth()
  const [mode, setMode] = useState<Mode>('top')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // ダイアログが閉じたらフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setMode('top')
      setEmail('')
      setPassword('')
      setName('')
      setError(null)
      setLoading(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await authClient.signIn.email({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'サインインに失敗しました')
    } else {
      onClose()
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
      callbackURL: '/',
    })
    setLoading(false)
    if (error) {
      setError(error.message ?? '登録に失敗しました')
    } else {
      setMode('verify_sent')
    }
  }

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
            className="widget p-6 w-full max-w-md m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-cf-text">
                {mode === 'signup' ? 'アカウント作成' : mode === 'verify_sent' ? '確認メール送信済み' : 'ログイン'}
              </h3>
              <motion.button
                {...tapAnimation}
                onClick={onClose}
                className="text-cf-subtext hover:text-cf-text transition-colors cursor-pointer"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* メール確認待ち画面 */}
            {mode === 'verify_sent' && (
              <div className="text-center">
                <p className="text-cf-text mb-2">確認メールを送信しました。</p>
                <p className="text-cf-subtext text-sm mb-6">
                  メール内のリンクをクリックして認証を完了してください。
                </p>
                <motion.button
                  {...tapAnimation}
                  onClick={onClose}
                  className="w-full rounded-lg bg-cf-primary px-4 py-3 text-sm font-medium text-white hover:bg-cf-primary/90 transition-colors cursor-pointer"
                >
                  閉じる
                </motion.button>
              </div>
            )}

            {/* トップ画面（Google + Email選択） */}
            {mode === 'top' && (
              <>
                <p className="text-cf-subtext mb-6 text-sm">
                  サインインしてTodoと進捗をデバイス間で同期します。
                </p>

                <div className="flex flex-col gap-3">
                  <motion.button
                    {...tapAnimation}
                    whileHover={{ scale: 1.02 }}
                    onClick={login}
                    className="w-full flex items-center justify-center gap-3 rounded-lg bg-cf-primary px-4 py-3 text-sm font-medium text-white hover:bg-cf-primary/90 transition-colors cursor-pointer"
                  >
                    <GoogleIcon />
                    Google でログイン
                  </motion.button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-cf-border" />
                    <span className="text-xs text-cf-subtext">または</span>
                    <div className="flex-1 h-px bg-cf-border" />
                  </div>

                  <motion.button
                    {...tapAnimation}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setMode('signin')}
                    className="w-full rounded-lg border border-cf-border px-4 py-3 text-sm font-medium text-cf-text hover:bg-cf-surface transition-colors cursor-pointer"
                  >
                    メールアドレスでログイン
                  </motion.button>

                  <button
                    onClick={() => setMode('signup')}
                    className="text-xs text-cf-subtext hover:text-cf-text transition-colors cursor-pointer text-center"
                  >
                    アカウントをお持ちでない方は<span className="text-cf-primary underline">新規登録</span>
                  </button>
                </div>
              </>
            )}

            {/* Email サインイン */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                {error && (
                  <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-cf-subtext">メールアドレス</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-cf-subtext">パスワード</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <motion.button
                  {...tapAnimation}
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-cf-primary px-4 py-3 text-sm font-medium text-white hover:bg-cf-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading ? 'ログイン中…' : 'ログイン'}
                </motion.button>
                <div className="flex items-center justify-between text-xs text-cf-subtext">
                  <button
                    type="button"
                    onClick={() => { setMode('top'); setError(null) }}
                    className="hover:text-cf-text transition-colors cursor-pointer"
                  >
                    ← 戻る
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null) }}
                    className="hover:text-cf-text transition-colors cursor-pointer"
                  >
                    新規登録はこちら
                  </button>
                </div>
              </form>
            )}

            {/* Email サインアップ */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                {error && (
                  <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-cf-subtext">表示名</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
                    placeholder="山田 太郎"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-cf-subtext">メールアドレス</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-cf-subtext">パスワード</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  {loading ? '登録中…' : 'アカウント作成'}
                </motion.button>
                <div className="flex items-center justify-between text-xs text-cf-subtext">
                  <button
                    type="button"
                    onClick={() => { setMode('top'); setError(null) }}
                    className="hover:text-cf-text transition-colors cursor-pointer"
                  >
                    ← 戻る
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null) }}
                    className="hover:text-cf-text transition-colors cursor-pointer"
                  >
                    ログインはこちら
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
