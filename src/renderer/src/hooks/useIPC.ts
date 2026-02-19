import { useState, useEffect, useCallback, useRef } from 'react'

interface UseIPCResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * IPC invoke 훅 - Main 프로세스 API 호출
 * electronAPI를 통해 타입 안전한 API 호출 권장
 * 이 훅은 레거시 채널 기반 호출을 위해 유지
 * @param invoker 호출 함수
 * @param deps 의존성 배열
 * @param options 옵션 (enabled, onSuccess, onError)
 */
export function useIPC<T>(
  invoker: () => Promise<T>,
  deps: unknown[] = [],
  options?: {
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  }
): UseIPCResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { enabled = true, onSuccess, onError } = options ?? {}
  const invokerRef = useRef(invoker)
  invokerRef.current = invoker

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await invokerRef.current()
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [onSuccess, onError])

  useEffect(() => {
    if (enabled) {
      fetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetch, ...deps])

  return { data, loading, error, refetch: fetch }
}

/**
 * IPC 이벤트 구독 훅 - Main 프로세스 이벤트 수신
 * electronAPI.streams 사용 권장
 * @param subscriber 구독 함수 (unsubscribe 함수 반환)
 * @param handler 이벤트 핸들러
 */
export function useIPCEvent<T>(
  subscriber: (handler: (data: T) => void) => (() => void) | undefined,
  handler: (data: T) => void
): void {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const unsubscribe = subscriber((data) => handlerRef.current(data))

    return () => {
      unsubscribe?.()
    }
  }, [subscriber])
}

/**
 * IPC 폴링 훅 - 주기적으로 Main 프로세스 API 호출
 * @param invoker 호출 함수
 * @param interval 폴링 간격 (ms)
 * @param deps 의존성 배열
 * @param options 옵션
 */
export function useIPCPolling<T>(
  invoker: () => Promise<T>,
  interval: number,
  deps: unknown[] = [],
  options?: {
    enabled?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  }
): UseIPCResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { enabled = true, onSuccess, onError } = options ?? {}
  const invokerRef = useRef(invoker)
  invokerRef.current = invoker

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await invokerRef.current()
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [onSuccess, onError])

  useEffect(() => {
    if (!enabled) return

    fetch()
    const id = setInterval(fetch, interval)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fetch, interval, ...deps])

  return { data, loading, error, refetch: fetch }
}

/**
 * IPC mutation 훅 - 단발성 API 호출 (수동 트리거)
 * @param mutator 호출 함수
 */
export function useIPCMutation<TArgs extends unknown[], TResult>(
  mutator: (...args: TArgs) => Promise<TResult>
): {
  mutate: (...args: TArgs) => Promise<TResult>
  loading: boolean
  error: Error | null
  reset: () => void
} {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const mutatorRef = useRef(mutator)
  mutatorRef.current = mutator

  const mutate = useCallback(async (...args: TArgs): Promise<TResult> => {
    setLoading(true)
    setError(null)

    try {
      const result = await mutatorRef.current(...args)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setError(null)
  }, [])

  return { mutate, loading, error, reset }
}
