export class MusicEngine {
  constructor(ctx, gainNode) {
    this.ctx = ctx;
    this.gain = gainNode;
    this._playing = false;
    this._nodes = [];
    this._timer = null;
  }

  // Note frequencies
  static N(name, octave) {
    const notes = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
    return 440 * Math.pow(2, (notes[name] + (octave - 4) * 12 - 9) / 12);
  }

  _scheduleTrack(melody, bass, bpm, loop = true) {
    this.stop();
    this._playing = true;
    const beatDur = 60 / bpm;
    let melodyIdx = 0, bassIdx = 0;
    let melodyTime = this.ctx.currentTime + 0.1;
    let bassTime = this.ctx.currentTime + 0.1;

    const schedule = () => {
      if (!this._playing) return;
      // Schedule melody
      while (melodyTime < this.ctx.currentTime + 0.5 && melodyIdx < melody.length) {
        const n = melody[melodyIdx];
        if (n.freq) this._playNote(n.freq, melodyTime, n.dur * beatDur, 'square', 0.15);
        melodyTime += n.dur * beatDur;
        melodyIdx++;
        if (loop && melodyIdx >= melody.length) { melodyIdx = 0; }
      }
      // Schedule bass
      while (bassTime < this.ctx.currentTime + 0.5 && bassIdx < bass.length) {
        const n = bass[bassIdx];
        if (n.freq) this._playNote(n.freq, bassTime, n.dur * beatDur, 'triangle', 0.2);
        bassTime += n.dur * beatDur;
        bassIdx++;
        if (loop && bassIdx >= bass.length) { bassIdx = 0; }
      }
      this._timer = setTimeout(schedule, 200);
    };
    schedule();
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

  playMenu() {
    const N = MusicEngine.N;
    const melody = [
      {freq:N('E',4),dur:0.5},{freq:N('G',4),dur:0.5},{freq:N('A',4),dur:0.5},{freq:N('B',4),dur:0.5},
      {freq:N('A',4),dur:0.5},{freq:N('G',4),dur:0.5},{freq:N('E',4),dur:1},
      {freq:N('D',4),dur:0.5},{freq:N('E',4),dur:0.5},{freq:N('G',4),dur:0.5},{freq:N('A',4),dur:0.5},
      {freq:N('G',4),dur:0.5},{freq:N('E',4),dur:0.5},{freq:N('D',4),dur:1},
    ];
    const bass = [
      {freq:N('E',2),dur:1},{freq:N('E',2),dur:1},{freq:N('A',2),dur:1},{freq:N('A',2),dur:1},
      {freq:N('D',2),dur:1},{freq:N('D',2),dur:1},{freq:N('E',2),dur:1},{freq:N('E',2),dur:1},
    ];
    this._scheduleTrack(melody, bass, 130);
  }

  playGameplay() {
    const N = MusicEngine.N;
    const melody = [
      {freq:N('C',5),dur:0.25},{freq:N('E',5),dur:0.25},{freq:N('G',5),dur:0.25},{freq:N('E',5),dur:0.25},
      {freq:N('A',4),dur:0.25},{freq:N('C',5),dur:0.25},{freq:N('E',5),dur:0.25},{freq:N('C',5),dur:0.25},
      {freq:N('F',4),dur:0.25},{freq:N('A',4),dur:0.25},{freq:N('C',5),dur:0.25},{freq:N('A',4),dur:0.25},
      {freq:N('G',4),dur:0.25},{freq:N('B',4),dur:0.25},{freq:N('D',5),dur:0.25},{freq:N('B',4),dur:0.25},
    ];
    const bass = [
      {freq:N('C',3),dur:1},{freq:N('A',2),dur:1},{freq:N('F',2),dur:1},{freq:N('G',2),dur:1},
    ];
    this._scheduleTrack(melody, bass, 140);
  }

  playLevelComplete() {
    this.stop();
    const N = MusicEngine.N;
    const notes = [
      {freq:N('C',5),dur:0.25},{freq:N('E',5),dur:0.25},{freq:N('G',5),dur:0.25},
      {freq:N('C',6),dur:0.5},{freq:N('G',5),dur:0.25},{freq:N('C',6),dur:0.75},
    ];
    const beatDur = 60 / 150;
    let t = this.ctx.currentTime + 0.05;
    for (const n of notes) {
      this._playNote(n.freq, t, n.dur * beatDur, 'square', 0.2);
      t += n.dur * beatDur;
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
