// ── TEST SUPPORT: Three.js stub ──
//
// Minimal stand-in for the Three.js module namespace, used only by the Node
// test runner. Several pure-logic modules in the core/pattern layers transitively
// `import * as THREE from 'three'`, but the unit tests never instantiate any
// Three.js object — so an empty namespace is enough to satisfy the import graph
// without pulling the real (browser-only, CDN-hosted) library into Node.
export default {};
