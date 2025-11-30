# How to Get Windows EXE from Mac

## Option 1: GitHub Actions (Recommended - Automatic)

The easiest way to get a Windows EXE is through GitHub Actions:

1. **Go to GitHub Actions**: https://github.com/Abd196-bit/weQuak/actions
2. **Find the "Build Windows EXE" workflow**
3. **Click "Run workflow"** button (if it hasn't run automatically)
4. **Wait for build to complete** (~5-10 minutes)
5. **Download the EXE**:
   - Click on the completed workflow run
   - Scroll down to "Artifacts" section
   - Click "windows-exe" to download
   - Extract the ZIP file to get the `.exe` installer

## Option 2: Use a Windows Machine

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

## Option 3: Use Windows VM on Mac

You can run Windows in a virtual machine (Parallels, VMware, VirtualBox) and build there.

## Current Status

✅ **macOS DMG**: Available at `dist/We Quack-0.1.0-arm64.dmg`
⏳ **Windows EXE**: Use GitHub Actions or Windows machine

The GitHub Actions workflow is already set up and will build automatically when you push to the main branch!

