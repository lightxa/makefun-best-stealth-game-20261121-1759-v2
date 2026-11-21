// audio.js — one job: every sound the game makes, synthesized live.
// No audio files: a tiny WebAudio synth builds footsteps, the soft
// pickup chime, the near-miss sting and the alarm drone, plus a low
// harbour ambience of waves and a distant foghorn. Nothing plays until
// the player starts the game, so browsers allow it.

let ctx = null;
let master = null;
let ambienceOn = false;

export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
}

function tone(freq, dur, type, vol, slideTo) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

// A soft wooden footstep, quieter when sneaking. Called on alternate
// steps so the rhythm matches the walk cycle.
export function playFootstep(sneaking) {
  tone(sneaking ? 140 : 190, 0.07, 'triangle', sneaking ? 0.05 : 0.12, 90);
}

// Two-note chime when a manifest is pocketed.
export function playPickup() {
  tone(660, 0.12, 'sine', 0.22);
  setTimeout(() => tone(990, 0.18, 'sine', 0.22), 90);
}

// A short tense sting when a guard's suspicion crosses the near-miss line.
export function playNearMiss() {
  tone(320, 0.25, 'sawtooth', 0.1, 240);
}

// The alarm: a rising two-tone drone that says run and hide.
export function playAlarm() {
  tone(220, 0.5, 'square', 0.12, 330);
  setTimeout(() => tone(330, 0.5, 'square', 0.12, 220), 250);
}

// A low foghorn when the boat escape succeeds.
export function playWin() {
  tone(130, 1.1, 'sine', 0.3, 98);
  setTimeout(() => tone(196, 0.9, 'sine', 0.22), 350);
}

// Harbour ambience: slow filtered noise like waves, plus a foghorn
// every half minute. Started once, runs under the whole game.
export function startAmbience() {
  if (!ctx || ambienceOn) return;
  ambienceOn = true;
  try {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const waveGain = ctx.createGain();
    waveGain.gain.value = 0.05;
    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(master);
    noise.start();
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);
    lfo.start();
    setInterval(() => tone(98, 2.2, 'sine', 0.06, 92), 30000);
  } catch {
    ambienceOn = false;
  }
}
