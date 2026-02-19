/**
 * Command Palette 컴포넌트 (Cmd+K)
 * - 빠른 네비게이션과 액션 실행
 * - 동적 컨테이너 명령어
 * - 최근 사용 명령어 표시
 * - Fuzzy search 지원
 */

import { useCallback } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from '@/components/ui/command'
import { useCommandPalette, useGlobalKeyboardShortcuts } from '@/hooks/useCommandPalette'
import type { Command } from '@/hooks/useCommandPalette'

export function CommandPalette(): JSX.Element {
  // 글로벌 키보드 단축키 활성화
  useGlobalKeyboardShortcuts()

  const {
    open,
    setOpen,
    recentCommands,
    navigationCommands,
    actionCommands,
    containerCommands,
    selectedContainerCommands,
    executeCommand
  } = useCommandPalette()

  // 명령어 선택 핸들러
  const handleSelect = useCallback(
    (command: Command) => {
      executeCommand(command.id, command.action)
    },
    [executeCommand]
  )

  // 명령어 아이템 렌더링
  const renderCommandItem = useCallback(
    (command: Command) => {
      const Icon = command.icon
      return (
        <CommandItem
          key={command.id}
          value={`${command.label} ${command.keywords?.join(' ') || ''}`}
          onSelect={() => handleSelect(command)}
        >
          {Icon && <Icon className="mr-2 h-4 w-4" />}
          <span>{command.label}</span>
          {command.shortcut && <CommandShortcut>{command.shortcut}</CommandShortcut>}
        </CommandItem>
      )
    },
    [handleSelect]
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* 최근 사용 명령어 */}
        {recentCommands.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentCommands.map(renderCommandItem)}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* 선택된 컨테이너 액션 */}
        {selectedContainerCommands.length > 0 && (
          <>
            <CommandGroup heading="Selected Container">
              {selectedContainerCommands.map(renderCommandItem)}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* 네비게이션 */}
        <CommandGroup heading="Navigation">
          {navigationCommands.map(renderCommandItem)}
        </CommandGroup>

        <CommandSeparator />

        {/* 액션 */}
        <CommandGroup heading="Actions">
          {actionCommands.map(renderCommandItem)}
        </CommandGroup>

        {/* 컨테이너 명령어 (있을 경우만) */}
        {containerCommands.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Containers">
              {containerCommands.slice(0, 10).map(renderCommandItem)}
              {containerCommands.length > 10 && (
                <CommandItem disabled className="text-muted-foreground">
                  ... and {containerCommands.length - 10} more containers
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
