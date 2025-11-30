# Build Instructions for We Quack

## Where to Find Built Files

After running the build commands, the executables will be located in the `dist/` directory:

### macOS
- **DMG file**: `dist/We Quack-0.1.0-arm64.dmg` or `dist/We Quack-0.1.0-x64.dmg`
- **App bundle**: `dist/mac/Electron.app` (can be renamed to `We Quack.app`)

### Windows
- **EXE installer**: `dist/We Quack Setup 0.1.0.exe`
- **Portable**: `dist/win-unpacked/We Quack.exe`

### Linux
- **AppImage**: `dist/We Quack-0.1.0.AppImage`
- **DEB package**: `dist/we-quack_0.1.0_amd64.deb`

## Build Commands

### Build for macOS (DMG)
```bash
npm run electron:build:mac
```

### Build for Windows (EXE)
```bash
npm run electron:build:win
```

### Build for All Platforms
```bash
npm run electron:build
```

## Current Status

The build process is configured but may need additional dependencies installed. If you encounter errors:

1. Install missing dependencies: `npm install`
2. Make sure you have the required build tools for your platform
3. For Windows builds, you may need to run on Windows or use a CI/CD service
4. For macOS builds, you need to be on macOS

## Notes

- The `dist/` directory is in `.gitignore` and won't be committed to git
- Built files are typically 100-200MB in size
- The app runs Next.js as a server internally, so it requires Node.js to be bundled

