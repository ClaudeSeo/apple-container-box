# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**apple-container-box** is a macOS-only Electron desktop app that provides a GUI for managing containers via the Apple Container CLI (`container`). It targets macOS 26+ on Apple Silicon (arm64) and serves as a Docker Desktop alternative for the Apple Container ecosystem.

## Commands

```bash
# Development
npm run dev           # Start Electron app with hot reload (electron-vite)

# Build
npm run build         # Build for production
npm run package       # Build and package as macOS .dmg/.zip (arm64)

# Type checking (run both to cover all code)
npm run typecheck     # Check both node and web TypeScript configs
npm run typecheck:node  # Check src/main/ and src/preload/
npm run typecheck:web   # Check src/renderer/src/

# Linting
npm run lint          # ESLint with auto-fix

# Testing (vitest)
npm run test          # Run tests once
npm run test:watch    # Watch mode
```

## Architecture

The app follows the standard Electron process model with three layers:

```
Renderer (React UI)
    ↕ contextBridge (preload/index.ts)
Main Process (Node.js)
    ↕ child_process.spawn
Apple Container CLI (/usr/local/bin/container or /opt/homebrew/bin/container)
```

### Main Process Layer Architecture

Within the Main Process, a 3-tier architecture is applied per domain:

```
IPC Handler (ipc/*.handler.ts)   ← validates input, calls service
    ↓
Service (services/*.service.ts)  ← business logic, adapter orchestration
    ↓
CLI Adapter (cli/real-cli.adapter.ts or cli/mock-cli.adapter.ts)
```

### Source Layout

```
src/
  main/          # Electron Main Process (Node.js runtime)
    cli/         # CLI adapter interface + implementations
      adapter.interface.ts   # ContainerCLIAdapter interface
      real-cli.adapter.ts    # Spawns actual `container` CLI binary
      mock-cli.adapter.ts    # In-memory mock for dev/test
      cli-factory.ts         # Singleton factory (Real vs Mock selection)
      parser.ts              # CLI output parsers
      validator.ts           # Input whitelist validators
      types.ts               # CLI-specific types
    ipc/         # IPC handler registration (one file per domain)
    services/    # Business logic (container, image, volume, network, stream, system)
    store/       # electron-store wrapper (settings persistence)
    tray/        # System tray icon and menu
    utils/       # constants.ts, logger.ts
  preload/       # contextBridge API exposed to Renderer
  renderer/src/  # React 18 frontend
    types/       # Shared TypeScript types (container, image, volume, network, ipc, settings)
    stores/      # Zustand stores (container, settings, ui)
    hooks/       # React hooks (useContainers, useImages, useVolumes, etc.)
    pages/       # Page-level components (Containers, Images, Volumes, Networks, Settings)
    components/  # UI components (containers/, images/, volumes/, networks/, dashboard/, layout/, common/, ui/)
    assets/      # Global CSS (Tailwind)
    lib/         # Shared utilities (cn helper, format, constants)
```

### Key Contracts

- **IPC channels**: Fully typed in `src/renderer/src/types/ipc.ts`. `IPCInvokeChannels` defines request-response pairs; `IPCOnChannels` defines push events from Main to Renderer.
- **CLI adapter**: `src/main/cli/adapter.interface.ts` defines `ContainerCLIAdapter` — the interface both the real CLI wrapper and any mock must implement.
- **Input validation**: `src/main/cli/validator.ts` enforces whitelist-based validation before all CLI calls. Use `validateName()`, `validateImageRef()`, `validatePortMapping()`, etc. — never pass raw user input to child_process.
- **Constants**: Polling intervals, window sizes, IPC channel prefixes, and electron-store keys are all defined in `src/main/utils/constants.ts`.
- **Settings store**: `src/main/store/settings.store.ts` wraps electron-store and is the only place Main Process reads/writes persisted settings.

### TypeScript Configs

Two separate compilation contexts — **do not cross-import**:
- `tsconfig.node.json` → `src/main/**` and `src/preload/**` (Node.js types)
- `tsconfig.web.json` → `src/renderer/src/**` (DOM/browser types)

The `@` alias resolves to `src/renderer/src/` (renderer only).

### IPC Pattern

Main Process exposes typed handlers via `ipcMain.handle()`. Renderer calls via the preload bridge. Event streams (logs, stats, pull progress) use `ipcMain.emit` / `webContents.send` on the `IPCOnChannels`.

### CLI Integration Notes

- CLI binary: `container` (Apple Container CLI), defaulting to `/usr/local/bin/container` or `/opt/homebrew/bin/container`
- **Mock mode**: Set `CONTAINER_BOX_MOCK=true` to force MockContainerCLI (useful for UI dev without Apple Container installed). If CLI is unavailable at startup, Mock is used automatically as a fallback.
- Container list polled every 2s (`POLLING_INTERVAL_CONTAINER`)
- Stats polled every 1s per active container (`POLLING_INTERVAL_STATS`)
- Logs streamed via `child_process.spawn` stdout → IPC → Renderer (max `LOG_BUFFER_MAX_LINES = 10000`)
- System tray icon is optional (controlled by `showTrayIcon` setting); managed in `src/main/tray/`

### UI Stack

- **Component library**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **State management**: Zustand
- **Charts**: Recharts
- **Terminal emulator**: xterm.js (`@xterm/xterm`)
- **Command palette**: cmdk (`CommandPalette.tsx` — keyboard-driven search across containers/images/actions)
- **Layout**: 3-pane Command Center (Sidebar / Main Content / Detail Panel) with `react-resizable-panels`
- **Notifications**: `sonner` for in-app toasts
- **Settings persistence**: `electron-store`
- **Logging**: `electron-log` via `src/main/utils/logger.ts` — use `logger.scope('ModuleName')` for scoped logs

## Coding Style

- **TypeScript strict mode** is on for both contexts: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are enforced — unused variables cause compilation errors.
- `any` type: avoid (ESLint warns). Use `unknown` with narrowing instead.
- `console.log` in source is a lint warning — use `logger` from `src/main/utils/logger.ts` in Main Process. In Renderer, use scoped console or a dedicated logging util.
- Renderer components import shared types via `@/types` (the `@` alias). Never import from `src/main/` in the Renderer.
- Comments in Korean are acceptable for domain logic; English for logs and error messages (per project coding-rules).

## Test Strategy

- **Framework**: vitest (configured via `vite.config.ts`)
- **Run a single test file**: `npx vitest run <path-to-test-file>`
- **Run tests matching a pattern**: `npx vitest run -t "test name pattern"`
- Main Process logic (CLI adapter, validator, IPC handlers) should be unit-tested with mocked `child_process`.
- The `ContainerCLIAdapter` interface enables easy mock substitution in tests.
- Use `resetCLIAdapter()` from `src/main/cli/cli-factory.ts` between tests to reset the singleton.

## Security

- Always use the validators in `src/main/cli/validator.ts` before constructing CLI arguments.
- CLI commands must be spawned with argument arrays (never shell strings) to prevent command injection.
- Sensitive env var keys (`PASSWORD`, `SECRET`, `TOKEN`) must be masked in the UI.
- Electron security: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — Renderer accesses Node.js only through the preload bridge.
- CSP is enforced via `setupCSP()` in `src/main/index.ts` (stricter in production, allows `unsafe-inline` scripts only in dev).
