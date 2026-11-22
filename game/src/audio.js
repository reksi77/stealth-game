// Shadow Vault — generated sound.
// One job: every sound is synthesised with WebAudio at run time. No audio
// files, no network. Sound starts only after the first user gesture.

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let stepTimer = 0;
  let musicTimer = 0;
  let musicStep = 0;

  // A slow, quiet minor-key bass pulse that never gets in the way.
  const MUSIC_NOTES = [110, 0, 130.8, 0, 98, 0, 146.8, 0, 110, 0, 164.8, 0, 98, 0, 123.5, 0];

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function tone(freq, dur, type, volume, when = 0, slideTo = null) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, volume, filterFreq) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    /** Soft footstep; called by the game loop while the player walks. */
    step(sneaking) {
      if (!ctx || muted) return;
      const now = performance.now();
      if (now - stepTimer < (sneaking ? 520 : 300)) return;
      stepTimer = now;
      noiseBurst(0.07, sneaking ? 0.02 : 0.09, sneaking ? 500 : 900);
    },
    shard() {
      tone(880, 0.12, 'sine', 0.16);
      tone(1318, 0.2, 'sine', 0.14, 0.07);
    },
    spotted() {
      tone(220, 0.25, 'sawtooth', 0.12, 0, 440);
      tone(440, 0.3, 'square', 0.06, 0.05, 660);
    },
    caught() {
      tone(196, 0.5, 'sawtooth', 0.16, 0, 98);
      tone(147, 0.7, 'sawtooth', 0.14, 0.15, 73);
    },
    levelClear() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.15, i * 0.09));
    },
    click() {
      tone(660, 0.06, 'square', 0.06);
    },
    /** One quiet bass note every beat; call every frame. */
    musicTick(dt) {
      if (!ctx || muted) return;
      musicTimer -= dt;
      if (musicTimer > 0) return;
      musicTimer = 0.42;
      const note = MUSIC_NOTES[musicStep % MUSIC_NOTES.length];
      musicStep++;
      if (note) tone(note, 0.5, 'triangle', 0.045);
    },
  };
}
