// ── TEST SUPPORT: module resolve hook ──
//
// A Node customization hook (registered via `module.register` from the test that
// needs it) that resolves the bare `three` / `three/addons/*` specifiers to the
// local stub. This is how we "mock Three.js" for the pure-logic tests: the real
// library is only available in the browser via the import map in index.html.
const STUB = new URL('./three-stub.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'three' || specifier.startsWith('three/')) {
    return { url: STUB, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
