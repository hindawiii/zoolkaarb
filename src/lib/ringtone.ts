// Synthesized phone ringtone using the Web Audio API.
// No external audio files, no copyright issues. Loop until stopped.

let ctx: AudioContext | null = null;
let timerId: number | null = null;
let activeNodes: AudioNode[] = [];
let customAudio: HTMLAudioElement | null = null;

const ensureCtx = () => {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx!;
};

const playTwoToneBurst = () => {
  if (!ctx) return;
  const now = ctx.currentTime;
  const burst = (freq: number, start: number, dur: number) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.25, now + start + 0.02);
    gain.gain.linearRampToValueAtTime(0, now + start + dur);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(now + start);
    osc.stop(now + start + dur + 0.05);
    activeNodes.push(osc, gain);
  };
  // Classic two-tone phone ring (UK-style: 400Hz + 450Hz, two short bursts)
  burst(440, 0, 0.4);
  burst(480, 0, 0.4);
  burst(440, 0.5, 0.4);
  burst(480, 0.5, 0.4);
};

export const startRingtone = (customDataUrl?: string | null) => {
  stopRingtone();
  if (customDataUrl) {
    try {
      customAudio = new Audio(customDataUrl);
      customAudio.loop = true;
      customAudio.volume = 0.9;
      customAudio.play().catch(() => {});
    } catch {
      /* fall back below */
      customAudio = null;
    }
  }
  if (!customAudio) {
    ensureCtx();
    playTwoToneBurst();
    timerId = window.setInterval(playTwoToneBurst, 2000);
  }

  if ("vibrate" in navigator) {
    try {
      navigator.vibrate([400, 200, 400, 1000]);
    } catch {
      /* ignore */
    }
  }
};

export const stopRingtone = () => {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
  if (customAudio) {
    try {
      customAudio.pause();
      customAudio.src = "";
    } catch {
      /* ignore */
    }
    customAudio = null;
  }
  activeNodes = [];
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(0);
    } catch {
      /* ignore */
    }
  }
};

/**
 * Speak Arabic text via the browser's built-in SpeechSynthesis API.
 * Phase 1 TTS — swap for a hosted TTS provider when available.
 */
export const speakArabic = (
  text: string,
  opts: { female?: boolean; onEnd?: () => void } = {},
): SpeechSynthesisUtterance | null => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    opts.onEnd?.();
    return null;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const arVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith("ar"));
    let chosen: SpeechSynthesisVoice | undefined;
    if (opts.female) {
      chosen =
        arVoices.find((v) => /female|woman|girl|hala|amira|laila|sara/i.test(v.name)) ||
        arVoices[0];
    } else {
      chosen =
        arVoices.find((v) => /male|man|hamed|tarek|maged|salim/i.test(v.name)) ||
        arVoices[0];
    }
    if (chosen) u.voice = chosen;
    u.lang = chosen?.lang || "ar-SA";
    u.rate = opts.female ? 0.92 : 0.95;
    u.pitch = opts.female ? 1.15 : 0.95;
    if (opts.onEnd) u.onend = () => opts.onEnd?.();
    window.speechSynthesis.speak(u);
    return u;
  } catch {
    opts.onEnd?.();
    return null;
  }
};

export const stopSpeaking = () => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
};
