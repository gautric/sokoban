---
name: javascript
description: Write, edit or review vanilla JavaScript (ES modules, no bundler, no npm) in this repo — src/**/*.js and test/*.test.js. Use for any JS change, refactor, bug fix or new module, and for adding unit tests with Node's built-in runner.
---

# Vanilla JavaScript (ES modules, no build)

This project has **no dependencies, no bundler, no transpiler**. The browser loads
`src/main.js` directly; Node only runs `node --check`, `node --test` and ESLint (via
`npx`). The root `package.json` only sets `"type": "module"` — never add dependencies.
Code must run as-is in a modern browser.

## Rules

- **ES modules only.** `import { X } from './core/Board.js'` — always relative, always
  with the `.js` extension. No CommonJS (`require`, `module.exports`).
- **Bare specifiers only for Three.js**: `'three'` and `'three/addons/...'`, resolved by
  the `importmap` in `/index.html`. Never add another bare import — it will 404.
- No npm dependencies. If a library is truly needed, load it from a pinned CDN URL in
  the importmap and say so explicitly.
- Modern syntax is fine (classes, private `#fields`, `?.`, `??`, top-level `await`,
  `structuredClone`). No TypeScript, no JSX, no decorators.
- 2-space indent, semicolons, single quotes, `const` by default, `let` when reassigned,
  never `var`.
- Each new module starts with a header comment naming its role and the pattern(s) it
  embodies, in the repo's banner style: `// ── NAME: Role ──`.
- Constants and enums go in `src/config.js` as `Object.freeze` exports. No magic numbers
  scattered in modules.
- `src/core/` is pure logic: **no `three`, no `document`, no `window`** there. That is
  what makes it testable under Node.
- Respect the design-pattern layer (`src/patterns/`). Do not "simplify" a pattern away;
  extend it. See `/CLAUDE.md`.
- Prefer small pure functions and explicit data over hidden state. Return values instead
  of mutating arguments unless the module is clearly stateful (e.g. `Board`).
- Errors: throw `Error` with a clear message for programmer mistakes; return a result
  enum (`MoveResult`) for expected game outcomes. Never swallow errors silently.
- Async: `async/await` over `.then` chains. Every `fetch()` checks `res.ok`.
- No bare `console.log` in shipped paths. Log through `log(scope, ...)` from
  `src/log.js`: it prints only in log mode (`?log`). No cheats, no `window.__*`
  console hooks — `test/no-cheat.test.js` enforces it.

## Tests (Node built-in runner)

Tests live in `/test/*.test.js` and only cover pure code (`src/core/`, scoring, parser).

```js
// ── UNIT TESTS: <Module> ──
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Board } from '../src/core/Board.js';

test('push box onto target completes level', () => {
  // arrange / act / assert
  assert.equal(actual, expected);
});
```

Only test modules that do not import `three`. If a module you need to test pulls in
Three.js, move the pure part into its own file (like `src/patterns/level-builder.js`)
instead of mocking Three.js. `test/core-boundary.test.js` fails if `src/core/` ever
reaches `three`.

## Verify

```bash
make check     # node --check on every src/*.js + levels + entrypoints + unit tests
make test      # unit tests only
make lint      # ESLint 9 via npx (eslint.config.js)
```

Run `make check` and `make lint` after every JS edit. CI runs both before deploying.
