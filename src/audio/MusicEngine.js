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

  _scheduleVoices(voices, bpm, loop = true) {
    this.stop();
    this._playing = true;
    const beat = 60 / bpm;
    const state = voices.map(v => ({ idx: 0, time: this.ctx.currentTime + 0.1 }));

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

  // Sokoban Theme from musicxml — transcribed
  playGameplay() {
    const F = MusicEngine.F;
    const R = null; // rest
    const e = 0.125; // eighth = 1/8 of whole = 0.125 in quarter-beat units... 
    // Using quarter note = 1 beat at 140 BPM. eighth = 0.5 beats.

    // Pattern A melody (syncopated): C5 E5 . G5 A5 . G5 E5  (8 eighths, dots = rests)
    const mA = [
      {f:F('C',5),d:0.5},{f:F('E',5),d:0.5},{f:R,d:0.5},{f:F('G',5),d:0.5},
      {f:F('A',5),d:0.5},{f:R,d:0.5},{f:F('G',5),d:0.5},{f:F('E',5),d:0.5},
    ];
    // Pattern B melody (quarter-eighth): C5(q) E5(e) G5(e) A5(q) G5(q)
    const mB = [
      {f:F('C',5),d:1},{f:F('E',5),d:0.5},{f:F('G',5),d:0.5},
      {f:F('A',5),d:1},{f:F('G',5),d:1},
    ];
    // Pattern C melody (running eighths): C5 E5 G5 E5 C5 D5 E5 C5
    const mC = [
      {f:F('C',5),d:0.5},{f:F('E',5),d:0.5},{f:F('G',5),d:0.5},{f:F('E',5),d:0.5},
      {f:F('C',5),d:0.5},{f:F('D',5),d:0.5},{f:F('E',5),d:0.5},{f:F('C',5),d:0.5},
    ];
    // Pattern D melody (running eighths): C5 E5 G5 A5 G5 E5 C5 E5
    const mD = [
      {f:F('C',5),d:0.5},{f:F('E',5),d:0.5},{f:F('G',5),d:0.5},{f:F('A',5),d:0.5},
      {f:F('G',5),d:0.5},{f:F('E',5),d:0.5},{f:F('C',5),d:0.5},{f:F('E',5),d:0.5},
    ];
    // Pattern E melody (variation): E5(q) C5(e) E5(e) G5(e) A5(e) G5(e) E5(e)
    const mE = [
      {f:F('E',5),d:1},{f:F('C',5),d:0.5},{f:F('E',5),d:0.5},
      {f:F('G',5),d:0.5},{f:F('A',5),d:0.5},{f:F('G',5),d:0.5},{f:F('E',5),d:0.5},
    ];

    // Arpeggio patterns (eighth notes, 8 per bar)
    const arpC = [ // C arpeggio up-down
      {f:F('C',3),d:0.5},{f:F('E',3),d:0.5},{f:F('G',3),d:0.5},{f:F('C',4),d:0.5},
      {f:F('E',4),d:0.5},{f:F('C',4),d:0.5},{f:F('G',3),d:0.5},{f:F('E',3),d:0.5},
    ];
    const arpF = [ // F arpeggio up-down
      {f:F('F',3),d:0.5},{f:F('A',3),d:0.5},{f:F('C',4),d:0.5},{f:F('F',4),d:0.5},
      {f:F('A',4),d:0.5},{f:F('F',4),d:0.5},{f:F('C',4),d:0.5},{f:F('A',3),d:0.5},
    ];

    // Bass pedal (whole notes)
    const bassC = [{f:F('C',2),d:4}];
    const bassF = [{f:F('F',2),d:4}];

    // Full melody sequence (measures 6-21 from musicxml, then loops)
    const melody = [
      ...mA, ...mB, ...mC, // m6-8
      ...mD, ...mD, ...mA, ...mB, // m9-12 (m9=D variant, m10=D, m11=A, m12=B)
      ...mA, ...mB, ...mA, ...mB, // m13-16
      ...mA, ...mE, ...mA, ...mD, // m17-20
    ];

    // Arpeggio sequence matching harmony
    const arp = [
      ...arpC, ...arpC, ...arpF, // m6-8
      ...arpF, ...arpC, ...arpC, ...arpC, // m9-12
      ...arpC, ...arpC, ...arpC, ...arpF, // m13-16
      ...arpF, ...arpC, ...arpC, ...arpC, // m17-20
    ];

    // Bass sequence
    const bass = [
      ...bassC, ...bassC, ...bassF, // m6-8
      ...bassF, ...bassC, ...bassC, ...bassC, // m9-12
      ...bassC, ...bassC, ...bassC, ...bassF, // m13-16
      ...bassF, ...bassC, ...bassC, ...bassC, // m17-20
    ];

    this._scheduleVoices([
      { notes: melody, type: 'square', vol: 0.12 },
      { notes: arp, type: 'triangle', vol: 0.08 },
      { notes: bass, type: 'triangle', vol: 0.15 },
    ], 140);
  }

  playMenu() {
    const F = MusicEngine.F;
    // Intro section from musicxml (measures 1-5) — slower, chordal
    const melody = [
      {f:F('C',5),d:4},{f:F('C',5),d:4}, // whole notes m1-2
      {f:F('C',5),d:4},{f:F('C',5),d:4}, // m3-4
      {f:F('C',5),d:3},{f:F('C',5),d:0.5},{f:F('E',5),d:0.5}, // m5
    ];
    const chords = [
      {f:F('E',5),d:4},{f:F('E',5),d:4},
      {f:F('E',5),d:4},{f:F('E',5),d:4},
      {f:F('E',5),d:3},{f:F('E',5),d:0.5},{f:F('G',5),d:0.5},
    ];
    const bass = [
      {f:F('C',3),d:1},{f:null,d:1},{f:F('E',3),d:1},{f:null,d:1},
      {f:F('C',3),d:1},{f:null,d:1},{f:F('E',3),d:1},{f:null,d:1},
      {f:F('C',3),d:1},{f:null,d:1},{f:F('E',3),d:1},{f:null,d:1},
      {f:F('C',3),d:1},{f:null,d:1},{f:F('E',3),d:1},{f:null,d:1},
      {f:F('C',3),d:1},{f:null,d:1},{f:F('E',3),d:1},{f:null,d:1},
    ];
    this._scheduleVoices([
      { notes: melody, type: 'square', vol: 0.1 },
      { notes: chords, type: 'triangle', vol: 0.06 },
      { notes: bass, type: 'triangle', vol: 0.12 },
    ], 120);
  }

  playLevelComplete() {
    this.stop();
    const F = MusicEngine.F;
    const beat = 60 / 150;
    let t = this.ctx.currentTime + 0.05;
    const notes = [
      {f:F('C',5),d:0.25},{f:F('E',5),d:0.25},{f:F('G',5),d:0.25},
      {f:F('C',6),d:0.5},{f:F('G',5),d:0.25},{f:F('C',6),d:0.75},
    ];
    for (const n of notes) {
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
