# Downloads Folder

Place your DMG, EXE, and other installer files here.

## File Structure

- `We Quack_0.1.0_aarch64.dmg` - Tauri build for macOS (ARM64)
- `We Quack-0.1.0-arm64.dmg` - Electron build for macOS
- `We Quack Setup 0.1.0.exe` - Windows installer (when available)
- `We Quack_0.1.0_x64_en-US.msi` - Windows MSI installer (when available)

## Adding New Downloads

1. Copy your build files to this folder
2. Update the downloads list in `src/app/downloads/page.tsx`
3. The files will be accessible at `/downloads/filename`

## Notes

- Files in the `public` folder are served statically
- Make sure file names match the URLs in the downloads page
- Keep file sizes reasonable for web hosting

