// Audio: synthesized with WebAudio — no assets. Gunshots, reloads, hits, plant beeps,
// defuse ticks, round stingers. Every sound is built from oscillators and noise buffers.
let ctx = null;

function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noiseBuffer(duration) {
  const c = ensureCtx();
  const len = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  return buf;
}

function env(gainNode, t0, attack, decay, peak) {
  const g = gainNode.gain;
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(peak, t0 + attack);
  g.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

export const sfx = {
  shot(kind = 'rifle') {
    const c = ensureCtx();
    const t0 = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(0.14);
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = kind === 'marksman' ? 2400 : 3600;
    const g = c.createGain();
    env(g, t0, 0.004, kind === 'sidearm' ? 0.09 : 0.13, kind === 'marksman' ? 0.5 : 0.38);
    src.connect(filter).connect(g).connect(c.destination);
    src.start(t0);
    // Body thump.
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t0);
    osc.frequency.exponentialRampToValueAtTime(55, t0 + 0.09);
    const og = c.createGain();
    env(og, t0, 0.003, 0.09, 0.34);
    osc.connect(og).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.14);
  },
  reload() {
    const c = ensureCtx();
    const t0 = c.currentTime;
    for (let i = 0; i < 2; i += 1) {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(0.05);
      const g = c.createGain();
      env(g, t0 + i * 0.16, 0.004, 0.05, 0.16);
      const f = c.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = 1400;
      src.connect(f).connect(g).connect(c.destination);
      src.start(t0 + i * 0.16);
    }
  },
  hit() {
    const c = ensureCtx();
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1180, t0);
    osc.frequency.exponentialRampToValueAtTime(640, t0 + 0.06);
    const g = c.createGain();
    env(g, t0, 0.002, 0.06, 0.12);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.08);
  },
  kill() {
    const c = ensureCtx();
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    const g = c.createGain();
    osc.frequency.setValueAtTime(880, t0);
    osc.frequency.setValueAtTime(1320, t0 + 0.07);
    env(g, t0, 0.004, 0.14, 0.2);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.2);
  },
  beep(high = false) {
    const c = ensureCtx();
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = high ? 1560 : 980;
    const g = c.createGain();
    env(g, t0, 0.004, 0.09, 0.22);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.12);
  },
  plant() {
    const c = ensureCtx();
    const t0 = c.currentTime;
    for (let i = 0; i < 3; i += 1) {
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 740 + i * 220;
      const g = c.createGain();
      env(g, t0 + i * 0.11, 0.004, 0.1, 0.2);
      osc.connect(g).connect(c.destination);
      osc.start(t0 + i * 0.11);
      osc.stop(t0 + i * 0.11 + 0.14);
    }
  },
  explode() {
    const c = ensureCtx();
    const t0 = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(0.9);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, t0);
    f.frequency.exponentialRampToValueAtTime(90, t0 + 0.8);
    const g = c.createGain();
    env(g, t0, 0.01, 0.85, 0.85);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t0);
  },
  stinger(good) {
    const c = ensureCtx();
    const t0 = c.currentTime;
    const notes = good ? [392, 494, 587, 784] : [392, 330, 262, 196];
    notes.forEach((n, i) => {
      const osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = n;
      const g = c.createGain();
      env(g, t0 + i * 0.12, 0.01, 0.22, 0.16);
      osc.connect(g).connect(c.destination);
      osc.start(t0 + i * 0.12);
      osc.stop(t0 + i * 0.12 + 0.3);
    });
  },
  damage() {
    const c = ensureCtx();
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t0);
    osc.frequency.exponentialRampToValueAtTime(90, t0 + 0.12);
    const g = c.createGain();
    env(g, t0, 0.004, 0.12, 0.2);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.16);
  },
};
