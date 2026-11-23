---
name: web-html-js
description: HTML, CSS and DOM work for this static site — index.html, design.html, kiro.html, css/, the DOM overlay UI in src/ui/, meta/SEO tags, importmap, i18n attributes, accessibility, responsive/mobile, local serving and browser checks. Use for any page, markup, style or DOM-overlay change.
---

# HTML / CSS / DOM (static site, no build)

## Pages

- `/index.html` — the game. Holds the `importmap` (Three.js CDN), SEO / Open Graph /
  Twitter / Apple meta, the `#game-container` with the canvas, and the DOM overlay UI.
- `/design.html`, `/kiro.html` — side pages. Keep them standalone.
- Styles in `/css/`. Fonts and images in `/assets/`.

## Rules

- Semantic HTML5: `<button>` for actions (never a clickable `<div>`), `<main>`,
  headings in order, `alt` on images, `lang` on `<html>` (default `ja`).
- Scripts: one `<script type="module" src="src/main.js">`. No inline logic, no
  `onclick=` attributes. Wire events in JS with `addEventListener`.
- The `importmap` must come **before** any module script.
- All visible text uses `data-i18n="key"`; strings live in `src/i18n.js` in EN and JA.
- Paths: root-relative (`/assets/...`) for icons/meta that must work from any URL;
  meta `og:*` / `twitter:*` image URLs must be **absolute** (`https://sokoban.autric.net/...`).
- CSS: classes over IDs for styling, CSS custom properties for colours/sizes, no
  inline `style=` except values set from JS at runtime. Pixel-art UI keeps
  `image-rendering: pixelated` on scaled images.
- DOM overlay sits above the canvas: `position: absolute/fixed`, give it
  `pointer-events: none` on the container and `auto` on real controls, so drags and
  scroll still reach the canvas.
- Responsive: test narrow (mobile portrait) and wide. Use `dvh`/`svh` for full-height
  layouts on mobile; respect `env(safe-area-inset-*)`. Touch targets ≥ 44 px.
- Accessibility: visible focus ring, keyboard reachable menus, `aria-label` on icon
  buttons, `prefers-reduced-motion` to tone down UI animation.
- DOM from JS: build with `document.createElement` + `textContent`. Avoid `innerHTML`
  with any dynamic value.
- Security: no secrets in the page. Third-party scripts only from pinned versioned URLs.

## Serve and check

ES modules and `fetch()` of `.sok` files fail on `file://`. Always serve over HTTP:

```bash
make serve                 # http://localhost:8080
make serve PORT=9000
make stop                  # free the port
make check                 # JS syntax, levels, entrypoints, unit tests
```

Then in the browser:

1. Console has no errors (404s, CORS, WebGL, module resolution).
2. Network tab: importmap URLs load, `levels/*.sok` load.
3. Toggle language (J): every string changes, nothing overflows.
4. Resize to mobile width: HUD readable, buttons tappable, canvas fills the screen.
5. For meta/SEO changes, validate with an Open Graph preview tool after deploy.
