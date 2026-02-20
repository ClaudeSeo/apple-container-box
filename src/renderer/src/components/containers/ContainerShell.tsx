import { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import '@xterm/xterm/css/xterm.css'

interface ContainerShellProps {
  containerId: string
}

/**
 * 컨테이너 인터랙티브 쉘 컴포넌트
 * - xterm.js 기반 터미널
 * - container exec -it 세션
 */
export function ContainerShell({ containerId }: ContainerShellProps): JSX.Element {
  const terminalRef = useRef<Terminal | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // 터미널 초기화
  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      theme: {
        background: '#0a0c10',
        foreground: '#f2f2f2',
        cursor: '#007AFF',
        selectionBackground: 'rgba(0, 122, 255, 0.25)'
      },
      fontFamily: 'SF Mono, JetBrains Mono, Menlo, Monaco, monospace',
      fontSize: 12,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block'
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)
    terminal.open(containerRef.current)
    fitAddon.fit()

    // 입력 핸들러
    terminal.onData((data) => {
      if (sessionIdRef.current) {
        window.electronAPI.streams.sendExecInput(sessionIdRef.current, data)
      }
    })

    // 터미널 리사이즈 핸들러
    terminal.onResize(({ cols, rows }) => {
      if (sessionIdRef.current) {
        window.electronAPI.streams.resizeExec(sessionIdRef.current, cols, rows)
      }
    })

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    // 리사이즈 핸들러
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [])

  // 세션 시작
  const startSession = useCallback(async () => {
    if (isConnecting || isConnected) return
    setIsConnecting(true)

    try {
      fitAddonRef.current?.fit()
      const cols = terminalRef.current?.cols || 80
      const rows = terminalRef.current?.rows || 24
      const { sessionId } = await window.electronAPI.streams.startExec(
        containerId,
        ['/bin/sh'],
        cols,
        rows
      )

      sessionIdRef.current = sessionId

      // 출력 스트림 구독
      unsubscribeRef.current = window.electronAPI.streams.onExec(
        sessionId,
        (data) => {
          if (terminalRef.current) {
            terminalRef.current.write(data.output)
          }
        },
        (error) => {
          terminalRef.current?.writeln(
            `\r\n\x1b[31mShell error: ${error.message}\x1b[0m`
          )
          setIsConnected(false)
        },
        (close) => {
          terminalRef.current?.writeln(
            `\r\n\x1b[33mSession ended (exit code: ${close.code ?? 'unknown'})\x1b[0m`
          )
          setIsConnected(false)
        }
      )

      setIsConnected(true)
      terminalRef.current?.focus()
    } catch (err) {
      terminalRef.current?.writeln(
        `\r\n\x1b[31mFailed to start shell: ${err instanceof Error ? err.message : 'Unknown error'}\x1b[0m`
      )
    } finally {
      setIsConnecting(false)
    }
  }, [containerId, isConnecting, isConnected])

  // 세션 종료
  const stopSession = useCallback(() => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    sessionIdRef.current = null
    setIsConnected(false)
  }, [])

  // 컴포넌트 마운트 시 자동 연결
  useEffect(() => {
    startSession()
    return () => {
      stopSession()
    }
  }, [containerId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-full flex-col">
      {/* 툴바 */}
      <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${isConnected ? 'bg-status-running' : 'bg-status-stopped'}`}
          />
          <span className="text-xs text-muted-foreground">
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              stopSession()
              setTimeout(startSession, 100)
            }}
            disabled={isConnecting}
            title="Reconnect"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 터미널 */}
      <div ref={containerRef} className="flex-1 bg-[#0a0c10]" />
    </div>
  )
}
