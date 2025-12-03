# How to Get Windows EXE from Mac

## Option 1: Use a Windows Machine (Recommended)

If you have access to a Windows computer:

1. Clone the repository:
   ```bash
   git clone https://github.com/Abd196-bit/weQuak.git
   cd weQuak
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the EXE:
   ```bash
   npm run electron:build:win
   ```

4. Find the EXE in `dist/` folder:
   - `dist/We Quack Setup 0.1.0.exe` (installer)
   - Or `dist/win-unpacked/We Quack.exe` (portable)

## Option 2: Use Windows VM on Mac

You can run Windows in a virtual machine (Parallels, VMware, VirtualBox) and build there.

1. **Install VirtualBox** (free) or **Parallels** (paid)
2. **Install Windows** in the VM
3. **Clone your repository** in Windows
4. **Run the build commands**:
   ```bash
   npm install
   npm run electron:build:win  # For Electron
   # OR
   npm run tauri:build:win     # For Tauri (smaller, recommended)
   ```

## Option 3: Use Boot Camp (Dual Boot)

1. **Install Windows** via Boot Camp on your Mac
2. **Boot into Windows**
3. **Clone and build** as in Option 1

## Current Status

✅ **macOS DMG**: Can be built on your Mac using `npm run tauri:build:mac` or `npm run electron:build:mac`
⏳ **Windows EXE**: Requires Windows machine or VM (cannot be built directly on macOS)

For more detailed alternatives, see `BUILD_WINDOWS_ALTERNATIVES.md`

