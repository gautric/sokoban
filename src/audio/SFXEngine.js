export class SFXEngine {
  constructor(ctx, gainNode) {
    this.ctx = ctx;
    this.gain = gainNode;
  }

  _play(freq, endFreq, dur, type, vol = 0.3) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (endFreq !== freq) osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(g).connect(this.gain);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  playMove() { this._play(200, 300, 0.05, 'triangle', 0.15); }
  playPush() { this._play(100, 60, 0.08, 'square', 0.2); }

  playBoxOnTarget() {
    this._play(523, 523, 0.1, 'square', 0.2);
    setTimeout(() => this._play(659, 659, 0.1, 'square', 0.2), 100);
  }

  playUndo() { this._play(400, 200, 0.1, 'triangle', 0.15); }
  playMenuClick() { this._play(440, 440, 0.03, 'square', 0.15); }

  setVolume(v) { this.gain.gain.value = v; }
}
