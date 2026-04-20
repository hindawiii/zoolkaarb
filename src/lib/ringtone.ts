// Synthesized phone ringtone using the Web Audio API.
// No external audio files, no copyright issues. Loop until stopped.

let ctx: AudioContext | null = null;
let timerId: number | null = null;
let activeNodes: AudioNode[] = [];

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

export const startRingtone = () => {
  ensureCtx();
  stopRingtone();
  playTwoToneBurst();
  // Loop every 2 seconds (1s ring + 1s silence pattern)
  timerId = window.setInterval(playTwoToneBurst, 2000);

  // Vibration pattern: ring-pause-ring
  if ("vibrate" in navigator) {
    try {
      const pattern = [400, 200, 400, 1000];
      navigator.vibrate(pattern);
      // Re-trigger on each interval too
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
export const speakArabic = (text: string, onEnd?: () => void): SpeechSynthesisUtterance | null => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return null;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // Try to find an Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const arVoice =
      voices.find((v) => v.lang?.toLowerCase().startsWith("ar")) ||
      voices.find((v) => /arab/i.test(v.name));
    if (arVoice) u.voice = arVoice;
    u.lang = arVoice?.lang || "ar-SA";
    u.rate = 0.95;
    u.pitch = 1.0;
    if (onEnd) u.onend = () => onEnd();
    window.speechSynthesis.speak(u);
    return u;
  } catch {
    onEnd?.();
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
