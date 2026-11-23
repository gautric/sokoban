// ── LOG MODE: console logger, on only with ?log (LOG in config.js) ──
// Every line starts with its scope, e.g. "[scene] menu -> game".
import { LOG } from './config.js';

/** Build a logger. `enabled` and `sink` are injectable for tests. */
export function createLogger(enabled = LOG, sink = console) {
  return (scope, ...args) => {
    if (enabled) sink.info(`[${scope}]`, ...args);
  };
}

/** Name of an enum value for readable logs: nameOf(Direction, 2) === 'LEFT'. */
export function nameOf(enumObj, value) {
  return Object.keys(enumObj).find((k) => enumObj[k] === value) ?? String(value);
}

/** The game's logger: silent unless the URL has ?log. */
export const log = createLogger();
