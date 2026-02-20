import { Box, RefreshCw, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface OnboardingScreenProps {
  onDemoMode: () => void
  onRecheck: () => void
  checking: boolean
}

export default function OnboardingScreen({ onDemoMode, onRecheck, checking }: OnboardingScreenProps): JSX.Element {
  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* macOS 트래픽 라이트 drag 영역 */}
      <div className="drag-region h-9 flex-shrink-0" />

      {/* 중앙 콘텐츠 */}
      <div className="flex flex-1 items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center max-w-sm w-full px-4">
          {/* 앱 아이콘 */}
          <div className={cn(
            'flex items-center justify-center',
            'h-20 w-20 rounded-full bg-card border border-white/[0.06]',
            'mb-5'
          )}>
            <Box className="h-16 w-16 text-foreground" />
          </div>

          {/* 제목 */}
          <h1 className="text-xl font-semibold text-foreground">Container Box</h1>

          {/* 부제 */}
          <p className="text-sm text-muted-foreground mt-2">
            Apple Container CLI is required
          </p>

          {/* 설치 안내 Card */}
          <Card className="w-full mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Installation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>Requires macOS 26 (Tahoe) or later.</p>
              <p>Install via Homebrew or download the package from GitHub.</p>
              <pre className="bg-muted rounded px-3 py-2 font-mono text-xs text-foreground select-all">
                brew install container
              </pre>
            </CardContent>
          </Card>

          {/* 버튼 영역 */}
          <div className="flex flex-col gap-3 w-full mt-6">
            <Button
              variant="default"
              onClick={onRecheck}
              className="w-full"
              disabled={checking}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', checking && 'animate-spin')} />
              {checking ? 'Checking…' : 'Recheck CLI'}
            </Button>

            <Button
              variant="ghost"
              onClick={onDemoMode}
              className="w-full text-muted-foreground"
            >
              Continue in Demo Mode
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
