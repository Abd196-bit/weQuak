# Free Disk Space Guide

## Current Issue
The Tauri build failed because your disk is full (No space left on device).

## Quick Fixes

### 1. Clean Tauri Build Artifacts
```bash
rm -rf src-tauri/target
```

### 2. Clean Cargo Cache (can free several GB)
```bash
cargo clean
# Or clean global cache
rm -rf ~/.cargo/registry/cache
```

### 3. Clean Electron Builds
```bash
rm -rf dist/
```

### 4. Clean Node Modules (reinstall later)
```bash
rm -rf node_modules
npm install
```

### 5. Clean Next.js Build
```bash
rm -rf .next out
```

### 6. Clean System Temp Files
```bash
# Clean Rust temp files
rm -rf /var/folders/*/T/rustc*
# Clean system temp (be careful!)
sudo rm -rf /private/var/folders/*/T/*
```

### 7. Check Large Files
```bash
# Find large files in current directory
find . -type f -size +100M -exec ls -lh {} \;
```

## Recommended Cleanup Order

1. Clean Tauri target: `rm -rf src-tauri/target`
2. Clean Electron dist: `rm -rf dist/`
3. Clean Cargo cache: `cargo clean` or `rm -rf ~/.cargo/registry/cache`
4. Clean Next.js: `rm -rf .next out`
5. Check disk space: `df -h .`

## After Freeing Space

Retry the Tauri build:
```bash
npm run tauri:build:mac
```

## Alternative: Use Electron Instead

If you continue to have space issues, you can use Electron which is already set up:
```bash
npm run electron:build:mac
```

