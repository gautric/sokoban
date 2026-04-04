# Build Instructions — Kiro's Ghost Sokoban

## Prerequisites
- **Any modern web browser** (Chrome, Firefox, Edge, Safari)
- **A local HTTP server** (required because ES modules and `fetch()` don't work with `file://` protocol)
- No build tools, no npm, no bundler required

## Option 1: Python HTTP Server (recommended)
```bash
cd /Users/gautric/Source/git/aidlc-workshop
python3 -m http.server 8080
```
Then open: `http://localhost:8080`

## Option 2: Node.js HTTP Server
```bash
npx serve .
```
Then open the URL shown in terminal (typically `http://localhost:3000`)

## Option 3: VS Code Live Server
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

## Verify Build Success
1. Open the URL in your browser
2. **Expected**: Menu screen appears with "Kiro's Ghost Sokoban" title, animated ghost emoji, and 3 buttons (Play, Level Select, How to Play)
3. **Console check**: Open DevTools (F12) → Console. No errors should appear. Two `.sok` files should load successfully.

## Troubleshooting

### CORS errors on fetch()
- **Cause**: Opening `index.html` directly via `file://` protocol
- **Solution**: Must use an HTTP server (see options above)

### Three.js import fails
- **Cause**: No internet connection (Three.js loaded from CDN)
- **Solution**: Ensure internet access, or download `three.module.js` from `https://unpkg.com/three@0.160.0/build/three.module.js` and save to `lib/three.module.js`, then update the importmap in `index.html`

### Blank screen / no menu
- **Cause**: JavaScript module loading error
- **Solution**: Check browser console for specific error. Ensure all files are in correct paths.
