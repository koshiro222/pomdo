import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppPage } from '../components/app/AppPage'
import { LandingPage } from '../components/landing/LandingPage'
import { LegalPage } from '../components/legal/LegalPage'
import { ReviewPage } from '../components/review/ReviewPage'
import { SettingsPage } from '../components/settings/SettingsPage'

const router = createBrowserRouter([
  { path: '/', Component: LandingPage },
  { path: '/app', Component: AppPage },
  { path: '/app/review', Component: ReviewPage },
  { path: '/app/settings', Component: SettingsPage },
  { path: '/about', element: <LegalPage section="about" /> },
  { path: '/legal', Component: LegalPage },
  { path: '/legal/terms', element: <LegalPage section="terms" /> },
  { path: '/legal/privacy', element: <LegalPage section="privacy" /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
