# Business Logic Model — Unit 4: Audio Engine

## AudioManager
- Creates AudioContext on first user gesture (click/keypress)
- Master gain node → music gain node → MusicEngine output
- Master gain node → sfx gain node → SFXEngine output
- Mute: set master gain to 0, restore on unmute
- Persist settings to localStorage via StateManager

## MusicEngine — Chiptune Synthesis

### Architecture
- Each track = array of { note, duration, oscillatorType } entries
- Playback loop: schedule notes ahead using AudioContext.currentTime
- Two oscillator channels: melody (square wave) + bass (triangle wave)
- Tempo defined per track (BPM)

### Tracks
- **Menu theme**: Synth-pop inspired — pulsing triangle bass line (8th notes), arpeggiated square melody, ~120 BPM
- **Gameplay theme**: Upbeat puzzle loop — rhythmic square pulse, catchy melodic hook, ~130 BPM
- **Level complete jingle**: Short 2-bar fanfare, ascending arpeggio with sustained final chord, ~140 BPM

### Note Format
```
{ freq: Hz, duration: seconds, type: 'square'|'triangle', gain: 0-1 }
```
Notes defined as frequency arrays. Use standard note frequencies (A4=440Hz, etc.)

## SFXEngine — 8-bit Sound Effects

### SFX Definitions (all generated via oscillator + envelope)
- **Move**: Short triangle wave blip, 200Hz→300Hz sweep, 50ms, low gain
- **Push**: Square wave thud, 100Hz→60Hz sweep, 80ms, medium gain
- **Box on target**: Two-tone chime, 523Hz then 659Hz (C5→E5), 100ms each, square wave
- **Undo**: Descending sweep, 400Hz→200Hz, 100ms, triangle wave
- **Menu click**: Short square blip, 440Hz, 30ms
- **Level complete**: Reuse MusicEngine jingle

### Envelope Pattern
```
playSFX(freq, duration, type):
  osc = createOscillator(type, freq)
  gain = createGain()
  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
  osc.connect(gain).connect(sfxGainNode)
  osc.start(now)
  osc.stop(now + duration)
```
