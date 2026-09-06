import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AccountsPage } from './features/accounts/AccountsPage'
import { LoginPage } from './features/auth/LoginPage'
import { FilesPage } from './features/files/FilesPage'
import { LogsPage } from './features/logs/LogsPage'
import { NetworkingPage } from './features/networking/NetworkingPage'
import { OverviewPage } from './features/overview/OverviewPage'
import { ServicesPage } from './features/services/ServicesPage'
import { StoragePage } from './features/storage/StoragePage'
import { TerminalPage } from './features/terminal/TerminalPage'
import { UpdatesPage } from './features/updates/UpdatesPage'
import { useAuth } from './stores/auth'
import { useUi } from './stores/ui'
import { useEffect } from 'react'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function Guard({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const hydrate = useAuth((s) => s.hydrate)
  const theme = useUi((s) => s.theme)

  useEffect(() => {
    hydrate()
    document.documentElement.dataset.theme = theme
  }, [hydrate, theme])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <Guard>
                <Layout />
              </Guard>
            }
          >
            <Route path="/" element={<OverviewPage />} />
            <Route path="/storage" element={<StoragePage />} />
            <Route path="/networking" element={<NetworkingPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/terminal" element={<TerminalPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
