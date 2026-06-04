# scripts/ — Build & Packaging Scripts

## Overview

Build, packaging, and release automation scripts for OpenPi.

## Key Files

| File | Purpose |
|---|---|
| `smoke-electron.mjs` | Launch Electron app for N seconds, verify it stays alive. Used in CI and manual verification. |
| `pack-win.sh` | Build Windows portable exe from WSL2. See below for critical constraints. |
| `release.mjs` | Version bump, git tag, and release note management. |
| `extract-release-notes.mjs` | Extract matching version section from CHANGELOG.md. |
| `update-brew.mjs` | Update Homebrew cask after release. |

## pack-win.sh — Windows Packaging from WSL

### Why This Script Exists

Building a Windows exe from WSL2 is non-trivial because of native C++ dependencies. Four approaches were tested:

| Approach | Result | Reason |
|---|---|---|
| WSL cross-compile (`electron-builder --win`) | ❌ FAILS | `better-sqlite3` .node stays ELF format even after `install-app-deps --platform win32` |
| PowerShell + UNC path (`\\wsl.localhost\`) | ❌ FAILS | `npm ci` rmdir fails with ENOTEMPTY on UNC paths |
| PowerShell + `pushd` UNC mapping | ❌ FAILS | Same ENOTEMPTY error; CWD reverts to `C:\Windows` |
| **Copy to Windows local + PowerShell** | ✅ WORKS | Only approach that produces working exe with correct native modules |

### Flow

```
WSL: npm run build (electron-vite)
  → Copy out/, package*.json, electron-builder.json, icons/, CHANGELOG.md to C:\temp\openpi-build
    → Windows PowerShell: npm ci (installs Windows native modules)
      → Windows PowerShell: npx electron-builder --win portable --publish never
        → Copy exe back to WSL release/
```

### Native Dependencies

Three types of native deps, each handled differently:

| Package | Type | Windows Resolution |
|---|---|---|
| `better-sqlite3` | C++ addon, `electron-rebuild` | Must compile on Windows (postinstall runs `electron-rebuild`) |
| `@lydell/node-pty` | Platform prebuilt (optionalDeps) | `npm ci` on Windows auto-installs `node-pty-win32-x64` |
| `koffi` / `ffi-rs` | Multi-platform prebuilt | Already includes `win32_x64` binaries |
| `@ff-labs/fff-node` | Platform prebuilt (optionalDeps) | `npm ci` on Windows auto-installs `fff-bin-win32-x64` |

### Pitfall: `npm ci` fails in non-git directory

The project's `package.json` has a `prepare` script that runs `git config core.hooksPath .githooks`. The Windows temp directory (`C:\temp\openpi-build`) is not a git repo, so `npm ci` fails:

```
npm error command failed
npm error command cmd.exe /d /s /c git config core.hooksPath .githooks
```

**Fix**: The script runs `npm ci --ignore-scripts` then manually executes `npx electron-rebuild -f -w better-sqlite3` to compile the only native module that needs it. All other lifecycle scripts (prepare, postinstall hooks) are safely skipped.

### Pitfall: `node_modules` contamination between WSL and Windows

If you run `npm ci` on the Windows side (even through UNC paths or copying), it replaces Linux `.node` binaries with Windows ones. Running `npm ci` again on the WSL side is required to restore Linux binaries before subsequent WSL builds or dev runs.

### portable target via CLI, not config

`electron-builder.json` keeps `win.target` as the default (`nsis`). The portable build is specified on the command line:

```bash
npx electron-builder --win portable --publish never
```

CLI `--win portable` overrides `win.target` in config. Do not change `electron-builder.json` for one-off portable builds.

### Config Merge (Critical)

The script reads `electron-builder.json` and **merges** `win.signAndEditExecutable=false` via PowerShell's `ConvertFrom-Json` + `Add-Member`. It does NOT replace the config. This preserves `asarUnpack`, `files`, `extraResources`, `directories`, and all other settings.

### Prerequisites

- WSL2 with Ubuntu
- Windows side: Node.js 22+, npm
- `powershell.exe` accessible from WSL

### Usage

```bash
./scripts/pack-win.sh              # Full: build + package
./scripts/pack-win.sh --skip-build # Skip build, just package
```

Output: `release/<version>/OpenPi <version>.exe` (portable, ~116MB)

## smoke-electron.mjs — Electron Smoke Test

Launches the built Electron app and verifies it stays alive for 8 seconds (configurable via `OPENPI_SMOKE_TIMEOUT_MS` env var).

In root/CI environments, Chromium refuses to run with sandbox. Use `ELECTRON_DISABLE_SANDBOX=1` instead of modifying source code:

```bash
ELECTRON_DISABLE_SANDBOX=1 npm run smoke:electron
```

Do not add `--no-sandbox` flags or root-detection logic to the script itself.
