/**
 * MusicEngine — TEMPLATE METHOD + STRATEGY patterns.
 *
 * TEMPLATE METHOD: _scheduleVoices() is the skeleton algorithm.
 *   Steps: stop → init state → schedule loop (hook for subclasses).
 * STRATEGY: Voice configurations are data objects — swap them to change the music.
 */

// ── STRATEGY: voice configuration objects ──
const VOICE_CONFIGS = {
  gameplay: { bpm: 140, loop: true },
  menu: { bpm: 120, loop: true },
  levelComplete: { bpm: 150, loop: false },
};

export class MusicEngine {
  constructor(ctx, gainNode) {
    this.ctx = ctx;
    this.gain = gainNode;
    this._playing = false;
    this._nodes = [];
    this._timer = null;
  }

  static F(note, oct) {
    const n = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
    return 440 * Math.pow(2, (n[note] + (oct-4)*12 - 9) / 12);
  }

  _playNote(freq, time, dur, type, vol) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.95);
    osc.connect(g).connect(this.gain);
    osc.start(time);
    osc.stop(time + dur);
    this._nodes.push(osc);
  }

  /**
   * TEMPLATE METHOD: scheduling skeleton.
   * 1. stop()  2. init state  3. schedule loop  4. (hook: onScheduleComplete)
   */
  _scheduleVoices(voices, bpm, loop = true) {
    this.stop();
    this._playing = true;
    const beat = 60 / bpm;
    const state = voices.map(() => ({ idx: 0, time: this.ctx.currentTime + 0.1 }));

    const schedule = () => {
      if (!this._playing) return;
      const ahead = this.ctx.currentTime + 0.5;
      for (let vi = 0; vi < voices.length; vi++) {
        const v = voices[vi];
        const s = state[vi];
        while (s.time < ahead && s.idx < v.notes.length) {
          const n = v.notes[s.idx];
          if (n.f) this._playNote(n.f, s.time, n.d * beat, v.type, v.vol);
          s.time += n.d * beat;
          s.idx++;
          if (loop && s.idx >= v.notes.length) s.idx = 0;
        }
      }
      this._timer = setTimeout(schedule, 200);
    };
    schedule();
  }

  /** STRATEGY: gameplay voice config */
  playGameplay() {
    const F = MusicEngine.F;
    const R = null;
    const mA = [{f:F('C',5),d:0.5},{f:F('E',5),d:0.5},{f:R,d:0.5},{f:F('G',5),d:0.5},{f:F('A',5),d:0.5},{f:R,d:0.5},{f:F('G',5),d:0.5},{f:F('E',5),d:0.5}];
    const mB = [{f:F('C',5),d:1},{f:F('E',5),d:0.5},{f:F('G',5),d:0.5},{f:F('A',5),d:1},{f:F('G',5),d:1}];
    const mC = [{f:F('C',5),d:0.5},{f:F('E',5),d:0.5},{f:F('G',5),d:0.5},{f:F('E',5),d:0.5},{f:F('C',5),d:0.5},{f:F('D',5),d:0.5},{f:F('E',5),d:0.5},{f:F('C',5),d:0.5}];
    const mD = [{f:F('C',5),d:0.5},{f:F('E',5),d:0.5},{f:F('G',5),d:0.5},{f:F('A',5),d:0.5},{f:F('G',5),d:0.5},{f:F('E',5),d:0.5},{f:F('C',5),d:0.5},{f:F('E',5),d:0.5}];
    const mE = [{f:F('E',5),d:1},{f:F('C',5),d:0.5},{f:F('E',5),d:0.5},{f:F('G',5),d:0.5},{f:F('A',5),d:0.5},{f:F('G',5),d:0.5},{f:F('E',5),d:0.5}];
    const arpC = [{f:F('C',3),d:0.5},{f:F('E',3),d:0.5},{f:F('G',3),d:0.5},{f:F('C',4),d:0.5},{f:F('E',4),d:0.5},{f:F('C',4),d:0.5},{f:F('G',3),d:0.5},{f:F('E',3),d:0.5}];
    const arpF = [{f:F('F',3),d:0.5},{f:F('A',3),d:0.5},{f:F('C',4),d:0.5},{f:F('F',4),d:0.5},{f:F('A',4),d:0.5},{f:F('F',4),d:0.5},{f:F('C',4),d:0.5},{f:F('A',3),d:0.5}];
    const bassC = [{f:F('C',2),d:4}], bassF = [{f:F('F',2),d:4}];

    const melody = [...mA,...mB,...mC,...mD,...mD,...mA,...mB,...mA,...mB,...mA,...mB,...mA,...mE,...mA,...mD];
    const arp = [...arpC,...arpC,...arpF,...arpF,...arpC,...arpC,...arpC,...arpC,...arpC,...arpC,...arpF,...arpF,...arpC,...arpC,...arpC];
    const bass = [...bassC,...bassC,...bassF,...bassF,...bassC,...bassC,...bassC,...bassC,...bassC,...bassC,...bassF,...bassF,...bassC,...bassC,...bassC];

    this._scheduleVoices([
      { notes: melody, type: 'square', vol: 0.12 },
      { notes: arp, type: 'triangle', vol: 0.08 },
      { notes: bass, type: 'triangle', vol: 0.15 },
    ], VOICE_CONFIGS.gameplay.bpm, VOICE_CONFIGS.gameplay.loop);
  }

  /** STRATEGY: menu voice config */
  playMenu() {
    const F = MusicEngine.F;
    const melody = [{f:F('C',5),d:4},{f:F('C',5),d:4},{f:F('C',5),d:4},{f:F('C',5),d:4},{f:F('C',5),d:3},{f:F('C',5),d:0.5},{f:F('E',5),d:0.5}];
    const chords = [{f:F('E',5),d:4},{f:F('E',5),d:4},{f:F('E',5),d:4},{f:F('E',5),d:4},{f:F('E',5),d:3},{f:F('E',5),d:0.5},{f:F('G',5),d:0.5}];
    const bass = [{f:F('C',3),d:1},{f:null,d:1},{f:F('E',3),d:1},{f:null,d:1},{f:F('C',3),d:1},{f:null,d:1},{f:F('E',3),d:1},{f:null,d:1},{f:F('C',3),d:1},{f:null,d:1},{f:F('E',3),d:1},{f:null,d:1},{f:F('C',3),d:1},{f:null,d:1},{f:F('E',3),d:1},{f:null,d:1},{f:F('C',3),d:1},{f:null,d:1},{f:F('E',3),d:1},{f:null,d:1}];
    this._scheduleVoices([
      { notes: melody, type: 'square', vol: 0.1 },
      { notes: chords, type: 'triangle', vol: 0.06 },
      { notes: bass, type: 'triangle', vol: 0.12 },
    ], VOICE_CONFIGS.menu.bpm, VOICE_CONFIGS.menu.loop);
  }

  playLevelComplete() {
    this.stop();
    const F = MusicEngine.F;
    const beat = 60 / VOICE_CONFIGS.levelComplete.bpm;
    let t = this.ctx.currentTime + 0.05;
    for (const n of [{f:F('C',5),d:0.25},{f:F('E',5),d:0.25},{f:F('G',5),d:0.25},{f:F('C',6),d:0.5},{f:F('G',5),d:0.25},{f:F('C',6),d:0.75}]) {
      this._playNote(n.f, t, n.d * beat, 'square', 0.2);
      t += n.d * beat;
    }
  }

  stop() {
    this._playing = false;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    this._nodes.forEach(n => { try { n.stop(); } catch {} });
    this._nodes = [];
  }

  setVolume(v) { this.gain.gain.value = v; }
}
