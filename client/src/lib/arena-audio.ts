// ── Synthesized arena audio ──────────────────────────────────────────────────
// No external files: everything here is generated with the Web Audio API.
// Browsers block audio before user interaction, so the ambient drone only
// starts after the first click/tap anywhere on the page (see unlock()).

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let droneNodes: { stop: () => void } | null = null;
let unlocked = false;
let muted = false;

const AMBIENT_LEVEL = 0.055; // ~15-20% "felt" loudness after filtering

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = AMBIENT_LEVEL;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

// ── Ambient: two detuned low drones + slow filtered noise bed ───────────────
function startDrone() {
  const c = getCtx();
  const bus = c.createGain();
  bus.gain.value = 1;
  bus.connect(masterGain!);

  const osc1 = c.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = 55; // low A
  const osc2 = c.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 55 * 1.006; // slight detune for slow beating

  const oscGain = c.createGain();
  oscGain.gain.value = 0.6;
  osc1.connect(oscGain);
  osc2.connect(oscGain);
  oscGain.connect(bus);

  // Filtered noise bed — the "room tone" under the drone
  const bufSize = 2 * c.sampleRate;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = c.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 260;
  const noiseGain = c.createGain();
  noiseGain.gain.value = 0.32;
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(bus);

  // Wave LFO — sweeps the noise filter cutoff up/down so the "surf" itself
  // swells and recedes, independent of the overall breathing below.
  const waveLfo = c.createOscillator();
  waveLfo.frequency.value = 0.09;
  const waveLfoGain = c.createGain();
  waveLfoGain.gain.value = 160; // sweep range in Hz around the base cutoff
  waveLfo.connect(waveLfoGain);
  waveLfoGain.connect(noiseFilter.frequency);

  // Slow LFO breathing on the whole bed
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.35;
  lfo.connect(lfoGain);
  lfoGain.connect(bus.gain);

  osc1.start();
  osc2.start();
  noise.start();
  lfo.start();
  waveLfo.start();

  droneNodes = {
    stop: () => {
      [osc1, osc2, noise, lfo, waveLfo].forEach((n) => {
        try {
          n.stop();
        } catch {}
      });
      bus.disconnect();
    },
  };
}

export function unlock() {
  if (unlocked) return;
  unlocked = true;
  const c = getCtx();
  if (c.state === "suspended") c.resume();
  startDrone();
}

export function toggleMute(): boolean {
  muted = !muted;
  if (masterGain) {
    masterGain.gain.setTargetAtTime(muted ? 0 : AMBIENT_LEVEL, getCtx().currentTime, 0.15);
  }
  return muted;
}

export function isMuted() {
  return muted;
}

// ── One-shot: hover whoosh — short filtered noise burst, rises then fades ───
export function playHover() {
  if (!unlocked || muted) return;
  const c = getCtx();
  const bufSize = c.sampleRate * 0.18;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;

  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.7;
  filter.frequency.setValueAtTime(400, c.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2200, c.currentTime + 0.16);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.18, c.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.18);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start();
  src.stop(c.currentTime + 0.2);
}

// ── One-shot: correct-answer fanfare — ascending brass triad with a bright
//    shimmer tail. Synthesized (saw+square blend for a "brass" edge), no files.
// ── One-shot: answer reveal accent — a short, bright "ta-dam".
//    Deliberately lighter and shorter than playFanfare(), so revealing the
//    answer and scoring a correct answer never sound like the same event.
export function playReveal() {
  const c = getCtx();
  if (c.state === "suspended") c.resume();

  const bus = c.createGain();
  bus.gain.value = 0.4;
  bus.connect(c.destination);

  // Two notes: a quick lift then a landing — "ta-DAM"
  const notes = [
    { freq: 392.0, start: 0,    dur: 0.14, peak: 0.35 }, // G4 — "ta"
    { freq: 587.3, start: 0.13, dur: 0.42, peak: 0.5  }, // D5 — "dam"
  ];

  notes.forEach(({ freq, start, dur, peak }) => {
    const t0 = c.currentTime + start;

    const osc = c.createOscillator();
    osc.type = "triangle"; // softer than the fanfare's saw+square brass
    osc.frequency.value = freq;

    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 3200;

    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  });
}

export function playFanfare() {
  const c = getCtx();
  if (c.state === "suspended") c.resume();

  const bus = c.createGain();
  bus.gain.value = 0.5;
  bus.connect(c.destination);

  // Simple echo/shimmer via a short feedback delay — gives the brass some air
  const delay = c.createDelay();
  delay.delayTime.value = 0.16;
  const feedback = c.createGain();
  feedback.gain.value = 0.28;
  const delayWet = c.createGain();
  delayWet.gain.value = 0.35;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(delayWet);
  delayWet.connect(c.destination);
  bus.connect(delay);

  // Ascending triad — C E G C (a classic fanfare shape), brassy saw+square blend
  const notes = [261.6, 329.6, 392.0, 523.3];
  const noteLen = 0.16;

  notes.forEach((freq, i) => {
    const t0 = c.currentTime + i * noteLen;
    const isLast = i === notes.length - 1;

    const saw = c.createOscillator();
    saw.type = "sawtooth";
    saw.frequency.value = freq;
    const sq = c.createOscillator();
    sq.type = "square";
    sq.frequency.value = freq / 2; // sub-octave for body

    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;
    filter.Q.value = 1.2;

    const g = c.createGain();
    const peak = isLast ? 0.55 : 0.4;
    const dur = isLast ? 0.55 : noteLen * 1.4;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    saw.connect(filter);
    sq.connect(filter);
    filter.connect(g);
    g.connect(bus);

    saw.start(t0);
    sq.start(t0);
    saw.stop(t0 + dur + 0.05);
    sq.stop(t0 + dur + 0.05);
  });

  // Bright shimmer on the final note — short filtered noise "sparkle"
  const shimmerT = c.currentTime + (notes.length - 1) * noteLen;
  const bufSize = c.sampleRate * 0.4;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = c.createBufferSource();
  noise.buffer = buf;
  const noiseFilter = c.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.value = 4000;
  const noiseGain = c.createGain();
  noiseGain.gain.setValueAtTime(0, shimmerT);
  noiseGain.gain.linearRampToValueAtTime(0.12, shimmerT + 0.02);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, shimmerT + 0.5);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(bus);
  noise.start(shimmerT);
  noise.stop(shimmerT + 0.5);
}

// ── One-shot: wrong-answer hit — low, descending, slightly dissonant.
//    Meant to feel heavy (a life lost), not comedic or arcade-like.
export function playWrong() {
  const c = getCtx();
  if (c.state === "suspended") c.resume();

  const bus = c.createGain();
  bus.gain.value = 0.45;
  bus.connect(c.destination);

  // Two close, slightly clashing low tones — a dull, ominous thud
  const freqs = [110, 116.5]; // A2 + a hair sharp, for dissonant beating
  freqs.forEach((freq) => {
    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, c.currentTime + 0.5);

    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;

    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.5, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);

    osc.connect(filter);
    filter.connect(g);
    g.connect(bus);
    osc.start();
    osc.stop(c.currentTime + 0.65);
  });

  // A short, dark noise scrape underneath — like stone cracking
  const bufSize = c.sampleRate * 0.3;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const noise2 = c.createBufferSource();
  noise2.buffer = buf;
  const noiseFilter2 = c.createBiquadFilter();
  noiseFilter2.type = "lowpass";
  noiseFilter2.frequency.value = 700;
  const noiseGain2 = c.createGain();
  noiseGain2.gain.setValueAtTime(0.22, c.currentTime);
  noiseGain2.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.28);
  noise2.connect(noiseFilter2);
  noiseFilter2.connect(noiseGain2);
  noiseGain2.connect(bus);
  noise2.start();
  noise2.stop(c.currentTime + 0.3);
}

export function playClick() {
  if (!unlocked || muted) return;
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.22);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.001, c.currentTime);
  gain.gain.linearRampToValueAtTime(0.35, c.currentTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.32);
}

// ── Question narration — plays a pre-generated ElevenLabs mp3 ───────────────
// Files live in client/public/audio_questions/q_<ID>.mp3 and are generated
// offline by generate_question_audio.py. Nothing is called at runtime against
// the ElevenLabs API, so a live event never depends on that service being up.

let currentNarration: HTMLAudioElement | null = null;

/** Stops any question narration that's currently playing. */
export function stopQuestionNarration() {
  if (currentNarration) {
    currentNarration.pause();
    currentNarration.currentTime = 0;
    currentNarration = null;
  }
}

/**
 * Plays the narration for a given question ID.
 * Silently does nothing if the file is missing (e.g. a question that failed
 * to generate) — a missing mp3 must never break the game flow.
 */
export function playQuestionNarration(questionId: number | string) {
  if (muted) return;
  stopQuestionNarration();

  const audio = new Audio(`/audio_questions/q_${questionId}.mp3`);
  audio.volume = 0.95;
  currentNarration = audio;

  audio.play().catch((err) => {
    // Autoplay policy or missing file — log, don't throw.
    console.warn(`[audio] Could not play narration for question ${questionId}:`, err?.message ?? err);
  });
}
