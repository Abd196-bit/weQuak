# Downloads Folder

Place your DMG, EXE, and other installer files here.

## File Structure

- `index.html` - Standalone HTML downloads page (HTML/CSS/JS)
- `We Quack_0.1.0_aarch64.dmg` - Tauri build for macOS (ARM64)
- `We Quack-0.1.0-arm64.dmg` - Electron build for macOS
- `We Quack Setup 0.1.0.exe` - Windows installer (when available)
- `We Quack_0.1.0_x64_en-US.msi` - Windows MSI installer (when available)

## Adding New Downloads

1. Copy your build files to this folder
2. Edit `index.html` and add to the `downloads` array in the JavaScript section
3. The files will be accessible at `/downloads/filename` or directly via `index.html`

## Standalone Usage

The `index.html` file is a standalone page that can be:
- Hosted on any web server
- Opened directly in a browser (for local testing)
- Embedded in your Next.js app
- Used as a static page

## Example: Adding a Windows Download

Edit the `downloads` array in `index.html`:

```javascript
{
    name: 'We Quack for Windows',
    platform: 'Windows',
    version: '0.1.0',
    size: '5.0 MB',
    url: '/downloads/We Quack Setup 0.1.0.exe',
    description: 'Windows installer - Compatible with Windows 10/11',
    date: new Date().toLocaleDateString(),
    icon: '🪟'
}
```

## Notes

- Files in the `public` folder are served statically by Next.js
- The HTML page is completely standalone (no React/Next.js dependencies)
- Make sure file names match the URLs in the downloads array
- Keep file sizes reasonable for web hosting
