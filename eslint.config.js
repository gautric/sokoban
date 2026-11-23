// ── LINT CONFIG: ESLint flat config ──
//
// Run with `make lint` (uses `npx eslint@9`; nothing is installed in the repo).
// Only correctness rules from eslint:recommended plus a few style guards that
// match CLAUDE.md. Browser globals for src/, Node globals for test/.
const browser = {
  window: 'readonly', document: 'readonly', localStorage: 'readonly', fetch: 'readonly',
  requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly', performance: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
  console: 'readonly', navigator: 'readonly', location: 'readonly', AudioContext: 'readonly',
  webkitAudioContext: 'readonly', Image: 'readonly', HTMLElement: 'readonly', KeyboardEvent: 'readonly',
  matchMedia: 'readonly', getComputedStyle: 'readonly', URL: 'readonly', structuredClone: 'readonly',
  URLSearchParams: 'readonly',
};
const node = {
  process: 'readonly', console: 'readonly', globalThis: 'readonly', URL: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly',
};

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: browser },
  },
  {
    files: ['test/**/*.js', 'test/**/*.mjs', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: node },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-class-members': 'error',
      'no-duplicate-imports': 'error',
      'no-self-assign': 'error',
      'no-cond-assign': 'error',
      'no-fallthrough': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'smart'],
    },
  },
];
