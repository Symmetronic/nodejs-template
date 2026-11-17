type Sound = "place-X" | "place-O" | "hover" | "win" | "womp" | "restart";

interface Tone {
  readonly type: OscillatorType;
  readonly frequency: number;
  readonly endFrequency?: number;
  readonly delay: number;
  readonly duration: number;
  readonly volume: number;
}

const TONES: Readonly<Record<Sound, readonly Tone[]>> = {
  "place-X": [
    { type: "square", frequency: 660, delay: 0, duration: 0.14, volume: 0.08 },
  ],
  "place-O": [
    { type: "sine", frequency: 440, delay: 0, duration: 0.18, volume: 0.2 },
  ],
  hover: [
    { type: "sine", frequency: 1400, delay: 0, duration: 0.03, volume: 0.04 },
  ],
  win: [
    { type: "triangle", frequency: 523, delay: 0, duration: 0.2, volume: 0.2 },
    {
      type: "triangle",
      frequency: 659,
      delay: 0.1,
      duration: 0.2,
      volume: 0.2,
    },
    {
      type: "triangle",
      frequency: 784,
      delay: 0.2,
      duration: 0.2,
      volume: 0.2,
    },
    {
      type: "triangle",
      frequency: 1047,
      delay: 0.3,
      duration: 0.4,
      volume: 0.2,
    },
  ],
  womp: [
    {
      type: "sawtooth",
      frequency: 220,
      endFrequency: 90,
      delay: 0,
      duration: 0.6,
      volume: 0.12,
    },
  ],
  restart: [
    { type: "square", frequency: 300, delay: 0, duration: 0.05, volume: 0.06 },
  ],
};

const SILENT_GAIN = 0.0001;
const ATTACK_FRACTION = 0.1;
const MUTE_STORAGE_KEY = "muted";
const MUTED_VALUE = "true";
const UNLOCK_EVENTS = ["pointerdown", "keydown"] as const;

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === MUTED_VALUE;
  } catch {
    return false;
  }
}

function writeMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
  } catch {
    // Storage can be blocked; the mute choice then only lasts for this page view.
  }
}

function scheduleTone(context: AudioContext, tone: Tone): void {
  const start = context.currentTime + tone.delay;
  const end = start + tone.duration;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = tone.type;
  oscillator.frequency.setValueAtTime(tone.frequency, start);
  if (tone.endFrequency !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, end);
  }
  gain.gain.setValueAtTime(SILENT_GAIN, start);
  gain.gain.exponentialRampToValueAtTime(
    tone.volume,
    start + tone.duration * ATTACK_FRACTION,
  );
  gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, end);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end);
}

export interface Audio {
  readonly play: (sound: Sound) => void;
  readonly isMuted: () => boolean;
  readonly setMuted: (muted: boolean) => void;
}

export function createAudio(): Audio {
  let context: AudioContext | undefined;
  let muted = readMuted();

  function unlock(): void {
    try {
      context ??= new AudioContext();
      void context.resume().catch(() => undefined);
    } catch {
      context = undefined;
    }
  }

  for (const eventName of UNLOCK_EVENTS) {
    document.addEventListener(eventName, unlock, { capture: true });
  }

  return {
    play(sound) {
      if (muted || context?.state !== "running") {
        return;
      }
      for (const tone of TONES[sound]) {
        scheduleTone(context, tone);
      }
    },
    isMuted: () => muted,
    setMuted(value) {
      muted = value;
      writeMuted(value);
    },
  };
}
