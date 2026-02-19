# Apple Container Box

## Overview

Apple Container Box is a macOS-only Electron desktop app for managing Apple containers through a GUI instead of raw terminal workflows. It targets Apple Silicon (arm64) on macOS 26+ and is positioned as a focused Docker Desktop alternative for the Apple Container ecosystem.

The app keeps container execution in the Electron Main process, uses typed IPC contracts between processes, and validates user input before invoking the `container` CLI.

## Features

- Container lifecycle operations from a desktop command-center UI (list, run/start, inspect, stop, remove)
- Dedicated management views for images, networks, and volumes
- Live operational visibility with log streaming and container stats polling
- Keyboard-first workflows via command palette support
- Optional system tray integration for background usage
- Persistent desktop settings through `electron-store`
- Mock CLI mode for development when Apple Container CLI is unavailable

## Apple Container CLI Integrations

Apple Container Box integrates with Apple Container CLI through a strict adapter layer:

- Real adapter executes the installed `container` binary with `child_process.spawn` argument arrays
- Mock adapter provides in-memory responses for UI development and testing
- Adapter factory chooses real or mock mode at startup
- Whitelist validators sanitize names, image references, and mappings before command execution

CLI binary resolution and fallback behavior:

- Preferred binary paths: `/usr/local/bin/container` and `/opt/homebrew/bin/container`
- If the CLI is missing at startup, the app automatically falls back to mock mode
- Mock mode can be forced with `CONTAINER_BOX_MOCK=true`

Realistic command surface used by the app includes operations such as:

```bash
# Containers
container ls
container run --name web nginx:latest
container logs web
container inspect web
container stop web
container rm web

# Images
container images ls
container images inspect nginx:latest
container images rm nginx:latest

# System
container system info
```

## Requirements

- macOS 26 or later
- Apple Silicon (arm64)
- Node.js 20+
- npm 10+
- Apple Container CLI (`container`) for real runtime execution

## Usage

```bash
# Install dependencies
npm install

# Start development app (electron-vite)
npm run dev

# Build production artifacts
npm run build

# Package macOS app (.dmg / .zip, arm64)
npm run package

# Quality checks
npm run typecheck
npm run typecheck:node
npm run typecheck:web
npm run lint
npm run test

# Run in forced mock mode (no local container CLI required)
CONTAINER_BOX_MOCK=true npm run dev
```

## Architecture

Process flow:

```text
Renderer (React UI)
    <-> contextBridge (preload/index.ts)
Main Process (Node.js)
    <-> child_process.spawn
Apple Container CLI (container)
```

Main-process internal flow (per domain):

```text
IPC Handler -> Service -> CLI Adapter
```

- Typed IPC channels define invoke/request-response and push-event contracts
- Electron security defaults are enforced: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- Renderer cannot access Node APIs directly; all privileged actions pass through preload + Main
- Runtime behavior is centralized with shared constants and a settings store wrapper
