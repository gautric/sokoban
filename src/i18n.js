import { EventBus } from './patterns/behavioral.js';

/**
 * i18n — SINGLETON + OBSERVER patterns.
 *
 * SINGLETON: Module-level state — single language instance for the entire app.
 * OBSERVER:  EventBus replaces the ad-hoc listener array. Components subscribe
 *            to 'lang:changed' events for automatic UI updates.
 */

const translations = {
  en: {
    title: "Kiro's Ghost\nSokoban", play: 'Play', level_select: 'Level Select',
    how_to_play: 'How to Play', how_title: 'HOW TO PLAY',
    how_1: 'Push all boxes onto targets!', how_2: 'Arrows: Move',
    how_3: 'Q/E: Rotate camera', how_4: 'Z: Undo | R: Restart',
    how_5: 'M: Mute | Esc: Pause', how_6: 'Mouse: Drag to rotate, Scroll to zoom',
    how_7: 'J: 日本語 / English', select_level: 'SELECT LEVEL',
    prev: '< Prev', next: 'Next >', back: 'Back',
    level: 'Level:', moves: 'Moves:', pushes: 'Pushes:', time: 'Time:',
    music: 'Music:', on: 'ON', off: 'OFF', paused: 'PAUSED',
    resume: 'Resume', restart: 'Restart', main_menu: 'Main Menu',
    level_complete: 'LEVEL COMPLETE!', next_level: 'Next Level', replay: 'Replay',
    complete_moves: 'Moves:', complete_pushes: 'Pushes:', complete_time: 'Time:',
    tilt: 'tilt', zoom: 'zoom', pixel: 'pixel',
  },
  ja: {
    title: "キロのゴースト\n倉庫番", play: 'プレイ', level_select: 'レベル選択',
    how_to_play: '遊び方', how_title: '遊び方',
    how_1: '箱をすべてターゲットに押そう！', how_2: '矢印キー: 移動',
    how_3: 'Q/E: カメラ回転', how_4: 'Z: 元に戻す | R: リスタート',
    how_5: 'M: ミュート | Esc: ポーズ', how_6: 'マウス: ドラッグで回転、スクロールでズーム',
    how_7: 'J: 日本語 / English', select_level: 'レベル選択',
    prev: '< 前へ', next: '次へ >', back: '戻る',
    level: 'レベル:', moves: '手数:', pushes: '押し:', time: '時間:',
    music: '音楽:', on: 'オン', off: 'オフ', paused: 'ポーズ中',
    resume: '再開', restart: 'リスタート', main_menu: 'メインメニュー',
    level_complete: 'レベルクリア！', next_level: '次のレベル', replay: 'リプレイ',
    complete_moves: '手数:', complete_pushes: '押し:', complete_time: '時間:',
    tilt: '傾き', zoom: 'ズーム', pixel: 'ピクセル',
  }
};

// ── SINGLETON: module-level state ──
let lang = 'ja';

// ── OBSERVER: EventBus for language change notifications ──
const langBus = new EventBus();

export function t(key) { return translations[lang]?.[key] ?? key; }
export function getLang() { return lang; }

export function toggleLang() {
  lang = lang === 'en' ? 'ja' : 'en';
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.tagName === 'H1'
      ? el.innerHTML = t(key).replace('\n', '<br>')
      : el.textContent = t(key);
  });
  langBus.emit('lang:changed', lang);
}

/** OBSERVER: subscribe to language changes */
export function onLangChange(fn) { langBus.on('lang:changed', fn); }

/** Get the underlying EventBus for advanced usage */
export function getLangBus() { return langBus; }
