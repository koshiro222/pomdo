import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export function VerifyEmailPage() {
  return (
    <div className="font-display bg-cf-background text-cf-text min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="widget p-8 w-full max-w-md mx-4 text-center"
      >
        <CheckCircle className="mx-auto mb-4 text-cf-primary" size={48} />
        <h1 className="text-xl font-bold text-cf-text mb-2">メールアドレスが確認されました</h1>
        <p className="text-cf-subtext text-sm mb-6">
          認証が完了しました。ログインしてPomodoを使い始めましょう。
        </p>
        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href="/"
          className="inline-block w-full rounded-lg bg-cf-primary px-4 py-3 text-sm font-medium text-white hover:bg-cf-primary/90 transition-colors cursor-pointer"
        >
          ホームに戻る
        </motion.a>
      </motion.div>
    </div>
  )
}
