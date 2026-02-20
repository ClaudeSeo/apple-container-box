import { Suspense, lazy, useState, useCallback } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { useCLIStatus } from '@/hooks/useSettings'

const AppLayout = lazy(() => import('@/components/layout/AppLayout'))
const OnboardingScreen = lazy(() => import('@/components/onboarding/OnboardingScreen'))

function App(): JSX.Element {
  const { status, loading, refetch } = useCLIStatus()
  const [demoMode, setDemoMode] = useState(false)
  const handleDemoMode = useCallback(() => setDemoMode(true), [])

  // 재확인 중에도 OnboardingScreen을 유지하기 위해 loading 조건 제거
  const showOnboarding = status !== null && !status.available && !demoMode

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        }
      >
        {status === null && loading ? (
          // 초기 로딩 (아직 status 없음): 스피너
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : showOnboarding ? (
          <OnboardingScreen onDemoMode={handleDemoMode} onRecheck={refetch} checking={loading} />
        ) : (
          <AppLayout />
        )}
      </Suspense>
      <Toaster />
    </div>
  )
}

export default App
