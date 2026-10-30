/**
 * Sound design — after toyfight.co and pensatori-irrazionali.com: short, quiet UI sounds,
 * synthesized in the browser (Web Audio), so there are no audio files to load or license.
 *
 *  hover    a soft double blip as a button / link starts its pixel hover
 *  tick     a tiny digital tick on each frame of the letters settling (very quiet, high)
 *  click    a short bright click on press
 *  error    a low two-note "nope" when the contact form shows an error
 *  success  a rising three-note robot chirp when the form is sent
 *
 * Browsers only let a page make sound after the visitor has clicked, tapped or pressed a key,
 * so everything is silent until then. Off when the visitor has turned it off
 * (localStorage "sound" = "off"). Presses on buttons and links click on their own (below);
 * the hover, the ticks and the form sounds are called by button-hover.ts and the contact block.
 */

type Name = 'hover' | 'tick' | 'click' | 'error' | 'success';

const VOLUME = 0.32;

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
let noise: AudioBuffer | null = null;
const last: Partial<Record<Name, number>> = {};
/** least ms between two of the same sound (hovering along a row of links) */
const GAP: Record<Name, number> = { hover: 70, tick: 30, click: 40, error: 300, success: 600 };

const off = () => {
  try {
    return localStorage.getItem('sound') === 'off';
  } catch {
    return false;
  }
};

/** the audio starts on the visitor's first click / tap / key */
function unlock() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  out = ctx.createGain();
  out.gain.value = VOLUME;
  // keep the tops soft
  const soft = ctx.createBiquadFilter();
  soft.type = 'lowpass';
  soft.frequency.value = 9000;
  out.connect(soft).connect(ctx.destination);
  noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.05), ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
// (iOS only counts the end of a tap, other browsers the start)
for (const type of ['pointerdown', 'pointerup', 'touchend', 'keydown']) addEventListener(type, unlock, { passive: true, capture: true });

/** one tone: `f0` falling / rising to `f1`, `dur` s, decaying from `vol` */
function tone(at: number, f0: number, f1: number, dur: number, vol: number, wave: OscillatorType = 'square') {
  if (!ctx || !out) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = wave;
  o.frequency.setValueAtTime(f0, at);
  o.frequency.exponentialRampToValueAtTime(f1, at + dur);
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + dur + 0.02);
}

/** a burst of noise through a band around `freq` */
function burst(at: number, freq: number, dur: number, vol: number) {
  if (!ctx || !out || !noise) return;
  const s = ctx.createBufferSource();
  s.buffer = noise;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = freq;
  band.Q.value = 6;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  s.connect(band).connect(g).connect(out);
  s.start(at);
  s.stop(at + dur + 0.01);
}

export function sfx(name: Name) {
  if (!ctx || ctx.state !== 'running' || off()) return;
  const now = performance.now();
  if (now - (last[name] ?? -1e9) < GAP[name]) return;
  last[name] = now;
  const t = ctx.currentTime + 0.005;
  switch (name) {
    case 'hover':
      tone(t, 1500, 1400, 0.012, 0.12, 'triangle');
      tone(t + 0.022, 1150, 1050, 0.04, 0.22, 'triangle');
      break;
    case 'tick':
      burst(t, 4000 + Math.random() * 5000, 0.012, 0.18);
      break;
    case 'click':
      burst(t, 5500, 0.006, 0.35);
      tone(t, 2600, 1700, 0.05, 0.22);
      break;
    case 'error':
      tone(t, 190, 175, 0.075, 0.3);
      tone(t + 0.11, 150, 135, 0.13, 0.3);
      break;
    case 'success':
      tone(t, 660, 680, 0.07, 0.16, 'triangle');
      tone(t + 0.08, 990, 1010, 0.07, 0.16, 'triangle');
      tone(t + 0.16, 1320, 1360, 0.22, 0.18, 'triangle');
      break;
  }
}

// a click on every press of a button or link (the contact block's cards and steps included)
addEventListener(
  'click',
  (e) => {
    if ((e.target as Element).closest?.('a[href], button, [role="button"], .contact__card')) sfx('click');
  },
  { capture: true },
);
