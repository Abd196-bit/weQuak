# Tauri Setup Guide

Tauri is a modern alternative to Electron that produces much smaller bundles (typically 5-10MB vs 100-200MB for Electron).

## Benefits of Tauri

- **Smaller bundle size**: ~5-10MB vs 100-200MB for Electron
- **Better performance**: Uses system webview instead of bundling Chromium
- **Better security**: Smaller attack surface
- **Native feel**: Better integration with OS

## Prerequisites

1. **Install Rust** (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Install system dependencies** (macOS):
   ```bash
   # Already installed if you have Xcode Command Line Tools
   xcode-select --install
   ```

## Build Commands

### Development
```bash
npm run tauri:dev
```

### Build for macOS
```bash
npm run tauri:build:mac
```

### Build for Windows (requires Windows or CI/CD)
```bash
npm run tauri:build:win
```

## Output Location

- **macOS**: `src-tauri/target/release/bundle/macos/We Quack.app`
- **Windows**: `src-tauri/target/release/bundle/msi/We Quack_0.1.0_x64_en-US.msi`
- **Linux**: `src-tauri/target/release/bundle/appimage/we-quack_0.1.0_amd64.AppImage`

## Configuration

Tauri configuration is in `src-tauri/tauri.conf.json`

## Notes

- Tauri uses the system webview, so the app will look native to each OS
- The bundle size is much smaller than Electron
- You can still use Electron alongside Tauri if needed

