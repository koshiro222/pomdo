import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const loadedEnvironment = loadEnv(mode, process.cwd(), '')
  const turnstileSiteKey =
    process.env.VITE_TURNSTILE_SITE_KEY?.trim() || loadedEnvironment.VITE_TURNSTILE_SITE_KEY?.trim()

  if (mode === 'production' && !turnstileSiteKey?.trim()) {
    throw new Error(
      'VITE_TURNSTILE_SITE_KEY が未設定のため production ビルドを実行できません。' +
        ' .env.local を設定するか、npm run deploy:preview を使用してください。',
    )
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8788',
          changeOrigin: true,
        },
      },
    },
  }
})
