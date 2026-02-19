import { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'

interface UseContainerLogsOptions {
  maxLines?: number
  autoScroll?: boolean
}

interface UseContainerLogsResult {
  terminalRef: React.RefObject<Terminal | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  isStreaming: boolean
  startLogs: () => void
  stopLogs: () => void
  clearLogs: () => void
  toggleAutoScroll: () => void
  autoScroll: boolean
}

/**
 * 컨테이너 로그 스트리밍 훅
 * - xterm.js 기반 로그 뷰어
 * - 실시간 스트리밍
 */
export function useContainerLogs(
  containerId: string | null,
  options: UseContainerLogsOptions = {}
): UseContainerLogsResult {
  const { maxLines = 10000, autoScroll: initialAutoScroll = true } = options

  const terminalRef = useRef<Terminal | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const lineCountRef = useRef(0)
  const isStreamingRef = useRef(false)
  const autoScrollRef = useRef(initialAutoScroll)

  const [isStreaming, setIsStreaming] = useState(false)
  const [autoScroll, setAutoScroll] = useState(initialAutoScroll)

  // 터미널 초기화
  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      theme: {
        background: '#0d0d14',
        foreground: '#e5e7eb',
        cursor: '#6366f1',
        selectionBackground: '#6366f140'
      },
      fontFamily: 'SF Mono, JetBrains Mono, Menlo, Monaco, monospace',
      fontSize: 12,
      lineHeight: 1.4,
      scrollback: maxLines,
      cursorBlink: false,
      disableStdin: true,
      convertEol: true
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)
    terminal.open(containerRef.current)
    fitAddon.fit()

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
  }, [maxLines])

  const startLogs = useCallback(() => {
    if (!containerId || isStreamingRef.current) return

    // 스트림 구독
    unsubscribeRef.current = window.electronAPI.streams.onLogs(containerId, (data) => {
      if (!terminalRef.current) return

      terminalRef.current.write(data.line)
      lineCountRef.current++

      // 자동 스크롤
      if (autoScrollRef.current) {
        terminalRef.current.scrollToBottom()
      }
    })

    isStreamingRef.current = true
    setIsStreaming(true)
  }, [containerId])

  const stopLogs = useCallback(() => {
    if (!isStreamingRef.current) return

    unsubscribeRef.current?.()
    unsubscribeRef.current = null
    isStreamingRef.current = false
    setIsStreaming(false)
  }, [])

  const clearLogs = useCallback(() => {
    terminalRef.current?.clear()
    lineCountRef.current = 0
  }, [])

  const toggleAutoScroll = useCallback(() => {
    setAutoScroll((prev) => {
      autoScrollRef.current = !prev
      return !prev
    })
  }, [])

  // 컨테이너 변경 시 로그 스트림 시작/중지
  useEffect(() => {
    if (containerId) {
      startLogs()
    }
    return () => {
      // stopLogs()는 isStreaming 상태에 의존 → stale closure 방지를 위해 직접 cleanup
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      isStreamingRef.current = false
      setIsStreaming(false)
    }
  }, [containerId, startLogs])

  return {
    terminalRef,
    containerRef,
    isStreaming,
    startLogs,
    stopLogs,
    clearLogs,
    toggleAutoScroll,
    autoScroll
  }
}
