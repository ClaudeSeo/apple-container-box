# Container Box

> macOS-only GUI for the Apple Container CLI — a Docker Desktop alternative for Apple Silicon.

## Overview

Container Box is an Electron desktop app that wraps the Apple Container CLI (`container`) in a keyboard-first command-center interface. It targets macOS 26+ on Apple Silicon (arm64) and keeps all container execution in the Electron Main process with typed IPC contracts and whitelist-validated CLI arguments.

## Features

- **Command Center UI** — 3-pane resizable layout (Sidebar / Main Content / Detail Panel)
- **Dashboard** — live cluster overview with charts and stats polling
- **Container management** — list, run/start, inspect, stop, remove with log streaming
- **Image management** — browse, inspect, pull progress, remove
- **Volume & Network management** — dedicated views for each resource type
- **Live terminal** — embedded xterm.js log viewer per container
- **Command palette** — `⌘K` keyboard-driven search across containers, images, and actions
- **System tray** — optional background tray icon with quick actions
- **Persistent settings** — per-app preferences via `electron-store`
- **Mock CLI mode** — full UI development without the Apple Container CLI installed

## Requirements

| Requirement         | Version               |
| ------------------- | --------------------- |
| macOS               | 26+                   |
| Architecture        | Apple Silicon (arm64) |
| Node.js             | 20+                   |
| npm                 | 10+                   |
| Apple Container CLI | 0.9.0+                |

## Getting Started

```bash
# Install dependencies
npm install

# Start development app (hot reload via electron-vite)
npm run dev

# Run in mock mode — no local container CLI required
CONTAINER_BOX_MOCK=true npm run dev
```

## Commands

```bash
# Build
npm run build         # Production build
npm run package       # Package as macOS .dmg / .zip (arm64)

# Type checking
npm run typecheck     # Both node and web configs
npm run typecheck:node
npm run typecheck:web

# Quality
npm run lint          # ESLint with auto-fix
npm run test          # Run vitest once
npm run test:watch    # Vitest watch mode
```

## Architecture

### Process Model

```text
Renderer (React 19)
    ↕  contextBridge  (preload/index.ts)
Main Process (Node.js)
    ↕  child_process.spawn
Apple Container CLI (/usr/local/bin/container)
```

### Main Process — 3-Tier per Domain

```text
IPC Handler   (src/main/ipc/*.handler.ts)   ← input validation
     ↓
Service       (src/main/services/*.service.ts) ← business logic
     ↓
CLI Adapter   (src/main/cli/real-cli.adapter.ts)  ← spawn + parse
```

### Apple Container CLI Integration

- **Real adapter** — executes `container` binary via argument arrays (no shell strings)
- **Mock adapter** — in-memory responses for UI dev and unit tests
- **Factory** — chooses real or mock at startup; falls back to mock if CLI is missing
- **Validators** — `src/main/cli/validator.ts` whitelists names, image refs, port mappings before every call

Binary resolution order: `/usr/local/bin/container` → `/opt/homebrew/bin/container` → mock fallback

### CLI Commands Used

```bash
# Containers
container ls
container run --name <name> <image>
container logs <name>
container inspect <name>
container stop <name>
container rm <name>

# Images
container images ls
container images inspect <ref>
container images pull <ref>
container images rm <ref>

# Volumes
container volumes ls
container volumes inspect <name>
container volumes rm <name>

# Networks
container networks ls
container networks inspect <name>

# System
container system info
```

## Tech Stack

| Layer         | Technology                            |
| ------------- | ------------------------------------- |
| App framework | Electron 40                           |
| Build tool    | electron-vite 5                       |
| UI framework  | React 19                              |
| Language      | TypeScript 5 (strict)                 |
| Styling       | Tailwind CSS 4 + shadcn/ui (Radix UI) |
| State         | Zustand 5                             |
| Terminal      | xterm.js 6                            |
