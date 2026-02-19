import { Suspense, lazy } from 'react'
import { Toaster } from '@/components/ui/toaster'

/**
 * 루트 앱 컴포넌트
 * - 레이아웃 구성 (Task 9에서 구현)
 * - 전역 상태 관리 (Zustand)
 * - Command Palette, Toast 등 전역 UI
 */

// Lazy load pages (Task 10, 11, 12에서 구현 예정)
const AppLayout = lazy(() => import('@/components/layout/AppLayout'))

function App(): JSX.Element {
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
        <AppLayout />
      </Suspense>
      <Toaster />
    </div>
  )
}

export default App
