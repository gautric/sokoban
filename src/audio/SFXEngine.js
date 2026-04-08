/**
 * SFXEngine — PROTOTYPE + FLYWEIGHT patterns.
 *
 * PROTOTYPE: SFX configs are prototype objects — clone and play.
 * FLYWEIGHT: Shared oscillator parameter sets avoid redundant object creation.
 */

// ── FLYWEIGHT: shared SFX parameter templates ──
const SFX_TEMPLATES = Object.freeze({
  move:        Object.freeze({ freq: 200, endFreq: 300, dur: 0.05, type: 'triangle', vol: 0.15 }),
  push:        Object.freeze({ freq: 100, endFreq: 60,  dur: 0.08, type: 'square',   vol: 0.2 }),
  boxOnTarget: Object.freeze({ freq: 523, endFreq: 523, dur: 0.1,  type: 'square',   vol: 0.2 }),
  boxOnTarget2:Object.freeze({ freq: 659, endFreq: 659, dur: 0.1,  type: 'square',   vol: 0.2 }),
  undo:        Object.freeze({ freq: 400, endFreq: 200, dur: 0.1,  type: 'triangle', vol: 0.15 }),
  menuClick:   Object.freeze({ freq: 440, endFreq: 440, dur: 0.03, type: 'square',   vol: 0.15 }),
});

export class SFXEngine {
  constructor(ctx, gainNode) {
    this.ctx = ctx;
    this.gain = gainNode;
  }

  /** PROTOTYPE: clone a template and play it */
  _playTemplate(template) {
    const { freq, endFreq, dur, type, vol } = template;
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

  playMove()     { this._playTemplate(SFX_TEMPLATES.move); }
  playPush()     { this._playTemplate(SFX_TEMPLATES.push); }
  playUndo()     { this._playTemplate(SFX_TEMPLATES.undo); }
  playMenuClick(){ this._playTemplate(SFX_TEMPLATES.menuClick); }

  playBoxOnTarget() {
    this._playTemplate(SFX_TEMPLATES.boxOnTarget);
    setTimeout(() => this._playTemplate(SFX_TEMPLATES.boxOnTarget2), 100);
  }

  setVolume(v) { this.gain.gain.value = v; }
}
