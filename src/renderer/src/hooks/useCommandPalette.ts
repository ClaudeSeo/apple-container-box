/**
 * Command Palette 훅
 * - 명령어 목록 관리
 * - 글로벌 키보드 단축키
 * - 최근 사용 명령어 기록
 */

import { useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  HardDrive,
  Image,
  LayoutDashboard,
  Network,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Square,
  RotateCcw,
  Download,
  type LucideIcon
} from 'lucide-react'
import { useUIStore, type ActiveView } from '@/stores'
import { useContainerStore } from '@/stores'

/** 명령어 정의 */
export interface Command {
  id: string
  label: string
  group: string
  icon?: LucideIcon
  shortcut?: string
  keywords?: string[]
  action: () => void | Promise<void>
}

/** 최근 사용 명령어 저장 키 */
const RECENT_COMMANDS_KEY = 'apple-container-box:recent-commands'
const MAX_RECENT_COMMANDS = 5

/** 최근 사용 명령어 가져오기 */
function getRecentCommands(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_COMMANDS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

/** 최근 사용 명령어 저장 */
function saveRecentCommand(commandId: string): void {
  try {
    const recent = getRecentCommands().filter((id) => id !== commandId)
    recent.unshift(commandId)
    localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT_COMMANDS)))
  } catch {
    // localStorage 오류 무시
  }
}

/**
 * Command Palette 훅
 * - Cmd+K 토글, 동적 명령어 목록, 최근 사용 추적
 */
export function useCommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveView,
    toggleSidebar,
    selectedContainerId
  } = useUIStore()
  const { containers } = useContainerStore()

  // 선택된 컨테이너
  const selectedContainer = useMemo(
    () => containers.find((c) => c.id === selectedContainerId),
    [containers, selectedContainerId]
  )

  // 명령어 실행 래퍼 (최근 사용 기록)
  const executeCommand = useCallback(
    (commandId: string, action: () => void | Promise<void>) => {
      setCommandPaletteOpen(false)
      saveRecentCommand(commandId)
      action()
    },
    [setCommandPaletteOpen]
  )

  // 네비게이션 명령어
  const navigationCommands: Command[] = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        label: 'Go to Dashboard',
        group: 'Navigation',
        icon: LayoutDashboard,
        shortcut: 'Cmd+1',
        keywords: ['home', 'main', 'overview'],
        action: () => setActiveView('dashboard')
      },
      {
        id: 'nav-containers',
        label: 'Go to Containers',
        group: 'Navigation',
        icon: Box,
        shortcut: 'Cmd+2',
        keywords: ['docker', 'list'],
        action: () => setActiveView('containers')
      },
      {
        id: 'nav-images',
        label: 'Go to Images',
        group: 'Navigation',
        icon: Image,
        shortcut: 'Cmd+3',
        keywords: ['docker', 'pull'],
        action: () => setActiveView('images')
      },
      {
        id: 'nav-volumes',
        label: 'Go to Volumes',
        group: 'Navigation',
        icon: HardDrive,
        shortcut: 'Cmd+4',
        keywords: ['storage', 'disk'],
        action: () => setActiveView('volumes')
      },
      {
        id: 'nav-networks',
        label: 'Go to Networks',
        group: 'Navigation',
        icon: Network,
        shortcut: 'Cmd+5',
        keywords: ['bridge', 'subnet'],
        action: () => setActiveView('networks')
      },
      {
        id: 'nav-settings',
        label: 'Go to Settings',
        group: 'Navigation',
        icon: Settings,
        shortcut: 'Cmd+,',
        keywords: ['preferences', 'config'],
        action: () => setActiveView('settings')
      }
    ],
    [setActiveView]
  )

  // 액션 명령어
  const actionCommands: Command[] = useMemo(
    () => [
      {
        id: 'action-new-container',
        label: 'Create Container...',
        group: 'Actions',
        icon: Plus,
        shortcut: 'Cmd+N',
        keywords: ['new', 'run'],
        action: () => {
          setActiveView('containers')
          // ContainerCreate 다이얼로그는 Containers 페이지에서 열림
        }
      },
      {
        id: 'action-pull-image',
        label: 'Pull Image...',
        group: 'Actions',
        icon: Download,
        keywords: ['download', 'docker'],
        action: () => {
          setActiveView('images')
          // ImagePullDialog는 Images 페이지에서 열림
        }
      },
      {
        id: 'action-toggle-sidebar',
        label: 'Toggle Sidebar',
        group: 'Actions',
        icon: Box,
        shortcut: 'Cmd+B',
        keywords: ['collapse', 'expand', 'hide'],
        action: () => toggleSidebar()
      },
      {
        id: 'action-refresh',
        label: 'Refresh',
        group: 'Actions',
        icon: RefreshCw,
        shortcut: 'Cmd+R',
        keywords: ['reload', 'update'],
        action: () => window.location.reload()
      }
    ],
    [setActiveView, toggleSidebar]
  )

  // 컨테이너 명령어 (동적 생성)
  const containerCommands: Command[] = useMemo(() => {
    const commands: Command[] = []

    // Running 컨테이너: Stop, Restart
    containers
      .filter((c) => c.status === 'running')
      .forEach((container) => {
        commands.push({
          id: `container-stop-${container.id}`,
          label: `Stop ${container.name}`,
          group: 'Containers',
          icon: Square,
          keywords: [container.name, container.image, 'halt'],
          action: async () => {
            await window.electronAPI.containers.stop(container.id)
          }
        })
        commands.push({
          id: `container-restart-${container.id}`,
          label: `Restart ${container.name}`,
          group: 'Containers',
          icon: RotateCcw,
          keywords: [container.name, container.image, 'reboot'],
          action: async () => {
            await window.electronAPI.containers.restart(container.id)
          }
        })
      })

    // Stopped 컨테이너: Start
    containers
      .filter((c) => c.status === 'stopped')
      .forEach((container) => {
        commands.push({
          id: `container-start-${container.id}`,
          label: `Start ${container.name}`,
          group: 'Containers',
          icon: Play,
          keywords: [container.name, container.image, 'run'],
          action: async () => {
            await window.electronAPI.containers.start(container.id)
          }
        })
      })

    return commands
  }, [containers])

  // 선택된 컨테이너 명령어 (R, S 단축키용)
  const selectedContainerCommands: Command[] = useMemo(() => {
    if (!selectedContainer) return []

    const commands: Command[] = []

    if (selectedContainer.status === 'running') {
      commands.push({
        id: 'selected-stop',
        label: `Stop ${selectedContainer.name}`,
        group: 'Selected Container',
        icon: Square,
        shortcut: 'S',
        action: async () => {
          await window.electronAPI.containers.stop(selectedContainer.id)
        }
      })
      commands.push({
        id: 'selected-restart',
        label: `Restart ${selectedContainer.name}`,
        group: 'Selected Container',
        icon: RotateCcw,
        shortcut: 'R',
        action: async () => {
          await window.electronAPI.containers.restart(selectedContainer.id)
        }
      })
    } else if (selectedContainer.status === 'stopped') {
      commands.push({
        id: 'selected-start',
        label: `Start ${selectedContainer.name}`,
        group: 'Selected Container',
        icon: Play,
        shortcut: 'S',
        action: async () => {
          await window.electronAPI.containers.start(selectedContainer.id)
        }
      })
    }

    return commands
  }, [selectedContainer])

  // 전체 명령어 목록
  const allCommands: Command[] = useMemo(
    () => [...navigationCommands, ...actionCommands, ...containerCommands, ...selectedContainerCommands],
    [navigationCommands, actionCommands, containerCommands, selectedContainerCommands]
  )

  // 최근 사용 명령어
  const recentCommands: Command[] = useMemo(() => {
    const recentIds = getRecentCommands()
    return recentIds.map((id) => allCommands.find((cmd) => cmd.id === id)).filter((cmd): cmd is Command => !!cmd)
  }, [allCommands])

  return {
    open: commandPaletteOpen,
    setOpen: setCommandPaletteOpen,
    commands: allCommands,
    recentCommands,
    navigationCommands,
    actionCommands,
    containerCommands,
    selectedContainerCommands,
    executeCommand,
    selectedContainer
  }
}

/**
 * 글로벌 키보드 단축키 훅
 * - Cmd+K: Command Palette
 * - Cmd+B: Sidebar 토글
 * - Cmd+,: Settings
 * - Cmd+1~5: 뷰 전환
 * - Escape: 모달 닫기
 * - R, S: 선택된 컨테이너 액션
 */
export function useGlobalKeyboardShortcuts() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveView,
    toggleSidebar,
    selectedContainerId,
    setSelectedContainer,
    detailPanelVisible
  } = useUIStore()
  const { containers } = useContainerStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isMeta = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      // Cmd+K: Command Palette 토글
      if (isMeta && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
        return
      }

      // Cmd+B: Sidebar 토글
      if (isMeta && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
        return
      }

      // Cmd+,: Settings
      if (isMeta && e.key === ',') {
        e.preventDefault()
        setActiveView('settings')
        return
      }

      // Cmd+1~5: 뷰 전환
      if (isMeta && e.key >= '1' && e.key <= '5') {
        e.preventDefault()
        const views: ActiveView[] = ['dashboard', 'containers', 'images', 'volumes', 'networks']
        const index = parseInt(e.key) - 1
        if (views[index]) {
          setActiveView(views[index])
        }
        return
      }

      // Escape: 모달/팔레트/선택 해제
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          setCommandPaletteOpen(false)
        } else if (selectedContainerId) {
          setSelectedContainer(null)
        }
        return
      }

      // Input 포커스 중이면 나머지 단축키 무시
      if (isInputFocused) return

      // 선택된 컨테이너가 있을 때만 동작하는 단축키
      if (selectedContainerId && !commandPaletteOpen) {
        const container = containers.find((c) => c.id === selectedContainerId)
        if (!container) return

        // R: Restart
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault()
          if (container.status === 'running') {
            window.electronAPI.containers.restart(container.id)
          }
          return
        }

        // S: Stop/Start 토글
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault()
          if (container.status === 'running') {
            window.electronAPI.containers.stop(container.id)
          } else if (container.status === 'stopped') {
            window.electronAPI.containers.start(container.id)
          }
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveView,
    toggleSidebar,
    selectedContainerId,
    setSelectedContainer,
    detailPanelVisible,
    containers
  ])
}
