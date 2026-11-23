// ── UNIT TESTS: i18n (EN/JA parity + every used key exists) ──
//
// Every string shown to the player must exist in both languages. Keys come
// from data-i18n attributes in index.html and t('key') calls in src/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { translations, t } from '../src/i18n.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function jsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? jsFiles(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []);
}

test('EN and JA define exactly the same keys', () => {
  const en = Object.keys(translations.en).sort();
  const ja = Object.keys(translations.ja).sort();
  assert.deepEqual(en.filter(k => !ja.includes(k)), [], 'missing in ja');
  assert.deepEqual(ja.filter(k => !en.includes(k)), [], 'missing in en');
});

test('no translation is empty', () => {
  for (const [lang, dict] of Object.entries(translations))
    for (const [k, v] of Object.entries(dict))
      assert.ok(typeof v === 'string' && v.trim() !== '', `${lang}.${k} is empty`);
});

test('every data-i18n key in index.html is translated', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]);
  assert.ok(keys.length > 0);
  for (const k of new Set(keys)) assert.ok(k in translations.en, `index.html uses unknown key "${k}"`);
});

test("every t('key') call in src/ is translated", () => {
  for (const file of jsFiles(join(ROOT, 'src'))) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/(?<![\w.$])t\(\s*'([a-z0-9_]+)'\s*\)/g))
      assert.ok(m[1] in translations.en, `${file.slice(ROOT.length + 1)} uses unknown key "${m[1]}"`);
  }
});

test('t() falls back to the key itself', () => {
  assert.equal(t('__no_such_key__'), '__no_such_key__');
});
