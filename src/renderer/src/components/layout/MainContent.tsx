import { Suspense, lazy } from 'react'
import { useUIStore, type ActiveView } from '@/stores'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

// Lazy load 페이지 컴포넌트 (Task 10, 12에서 구현)
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Containers = lazy(() => import('@/pages/Containers'))
const Images = lazy(() => import('@/pages/Images'))
const Volumes = lazy(() => import('@/pages/Volumes'))
const Networks = lazy(() => import('@/pages/Networks'))
const SettingsPage = lazy(() => import('@/pages/Settings'))

/**
 * 메인 콘텐츠 영역 컴포넌트
 * - 현재 activeView에 따른 페이지 렌더링
 * - 에러 바운더리 및 서스펜스 처리
 */
export function MainContent(): JSX.Element {
  const { activeView } = useUIStore()

  return (
    <main className="flex flex-1 flex-col overflow-hidden pt-10 glass-content">
      <ErrorBoundary>
        <Suspense fallback={<PageLoading />}>
          <PageRenderer view={activeView} />
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}

function PageLoading(): JSX.Element {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

function PageRenderer({ view }: { view: ActiveView }): JSX.Element {
  switch (view) {
    case 'dashboard':
      return <Dashboard />
    case 'containers':
      return <Containers />
    case 'images':
      return <Images />
    case 'volumes':
      return <Volumes />
    case 'networks':
      return <Networks />
    case 'settings':
      return <SettingsPage />
    default:
      return <Dashboard />
  }
}
