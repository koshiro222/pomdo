import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { TRPCProvider } from './lib/trpc'
import { initializeTheme } from './lib/theme'
import { Sentry } from './lib/sentry'

initializeTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<main className="page-shell loading-state"><p>画面の読み込みに失敗しました。</p></main>}>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
