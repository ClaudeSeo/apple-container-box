import type React from 'react'

// React 19 호환성: 전역 JSX 네임스페이스 재선언
declare global {
  namespace JSX {
    type Element = React.JSX.Element
    type IntrinsicElements = React.JSX.IntrinsicElements
    type IntrinsicAttributes = React.JSX.IntrinsicAttributes
    type ElementAttributesProperty = React.JSX.ElementAttributesProperty
    type ElementChildrenAttribute = React.JSX.ElementChildrenAttribute
    type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>
    type IntrinsicClassAttributes<T> = React.JSX.IntrinsicClassAttributes<T>
  }
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string
  readonly MODE: 'development' | 'production'
  readonly DEV: boolean
  readonly PROD: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ImportMeta {
  readonly env: ImportMetaEnv
}

/**
 * IPC 이벤트 리스너 타입
 */
type IPCListener<T> = (data: T) => void

/**
 * 구독 해제 함수
 */
type Unsubscribe = () => void

/**
 * Electron preload API 타입 선언
 * preload 스크립트에서 contextBridge로 노출된 API
 */
declare global {
  interface Window {
    electronAPI: {
      containers: {
        list: (options?: { all?: boolean }) => Promise<import('./types').Container[]>
        run: (options: import('./types').ContainerRunOptions) => Promise<{ id: string }>
        stop: (id: string, timeout?: number) => Promise<void>
        start: (id: string) => Promise<void>
        restart: (id: string, timeout?: number) => Promise<void>
        remove: (id: string, force?: boolean) => Promise<void>
        inspect: (id: string) => Promise<import('./types').Container>
        logs: (id: string, options?: { tail?: number; timestamps?: boolean }) => Promise<string>
        exec: (id: string, command: string[]) => Promise<{ output: string }>
      }

      images: {
        list: () => Promise<import('./types').Image[]>
        pull: (image: string) => Promise<void>
        remove: (id: string, force?: boolean) => Promise<void>
        inspect: (id: string) => Promise<unknown>
        build: (options: import('./types').ImageBuildOptions) => Promise<{ id: string }>
      }

      volumes: {
        list: () => Promise<import('./types').Volume[]>
        create: (name: string, driver?: string) => Promise<import('./types').Volume>
        remove: (name: string, force?: boolean) => Promise<void>
        inspect: (name: string) => Promise<unknown>
        prune: () => Promise<import('./types').VolumePruneResult>
      }

      networks: {
        list: () => Promise<import('./types').Network[]>
        create: (
          name: string,
          driver?: string,
          subnet?: string
        ) => Promise<import('./types').Network>
        remove: (id: string, force?: boolean) => Promise<void>
        inspect: (id: string) => Promise<import('./types').Network>
        connect: (
          network: string,
          container: string,
          options?: { ip?: string; alias?: string[] }
        ) => Promise<void>
        disconnect: (network: string, container: string, force?: boolean) => Promise<void>
      }

      streams: {
        onLogs: (containerId: string, callback: IPCListener<{ line: string }>) => Unsubscribe
        onStats: (
          containerId: string,
          callback: IPCListener<{
            cpuPercent: number
            memoryUsage: number
            memoryLimit: number
            networkRx: number
            networkTx: number
            timestamp: number
          }>
        ) => Unsubscribe
        onExec: (
          sessionId: string,
          callback: IPCListener<{ output: string }>,
          onError?: (data: { message: string }) => void,
          onClose?: (data: { code: number | null }) => void
        ) => Unsubscribe
        sendExecInput: (sessionId: string, data: string) => void
        resizeExec: (sessionId: string, cols: number, rows: number) => void
        onPullProgress: (
          callback: IPCListener<{
            image: string
            status: string
            current?: number
            total?: number
          }>
        ) => Unsubscribe
        startExec: (containerId: string, command: string[], cols?: number, rows?: number) => Promise<{ sessionId: string }>
      }

      system: {
        checkCLI: () => Promise<{
          available: boolean
          path?: string
          version?: string
          error?: string
          isMock?: boolean
        }>
        getInfo: () => Promise<import('./types').SystemInfo>
        getVersion: () => Promise<import('./types').CLIVersion>
        prune: (options?: { volumes?: boolean }) => Promise<import('./types').PruneResult>
        getResources: () => Promise<import('./types').SystemResources>
        onCLIStatus: (
          callback: IPCListener<{ connected: boolean; path?: string; error?: string }>
        ) => Unsubscribe
      }

      settings: {
        get: () => Promise<import('./types').AppSettings>
        set: (
          settings: Partial<import('./types').AppSettings>
        ) => Promise<import('./types').AppSettings>
        reset: () => Promise<import('./types').AppSettings>
        onChanged: (callback: IPCListener<import('./types').AppSettings>) => Unsubscribe
      }

      tray: {
        onRefreshContainers: (callback: () => void) => Unsubscribe
      }

      window: {
        minimize: () => Promise<void>
        maximize: () => Promise<void>
        close: () => Promise<void>
        isMaximized: () => Promise<boolean>
        onStateChange: (callback: IPCListener<{ maximized: boolean }>) => Unsubscribe
      }

      notifications: {
        onNotification: (
          callback: IPCListener<{
            type: 'info' | 'success' | 'warning' | 'error'
            title: string
            message: string
            timestamp: number
          }>
        ) => Unsubscribe
      }
    }
  }
}

export {}
