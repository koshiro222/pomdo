import { AppRouter } from './app/router'
import { ThemePreferenceProvider } from './components/theme/ThemePreferenceProvider'

export default function App() {
  return <ThemePreferenceProvider><AppRouter /></ThemePreferenceProvider>
}
