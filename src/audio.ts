type Sound =
  | "gunshot"
  | "dry"
  | "zombieHit"
  | "zombieDeath"
  | "groan"
  | "pickup"
  | "hurt"
  | "levelClear"
  | "gameOver";

interface Tone {
  readonly type: OscillatorType;
  readonly from: number;
  readonly to: number;
  readonly seconds: number;
  readonly volume: number;
  readonly delay?: number;
}

interface Noise {
  readonly seconds: number;
  readonly volume: number;
  readonly delay?: number;
}

interface Recipe {
  readonly tones?: readonly Tone[];
  readonly noises?: readonly Noise[];
}

const MASTER_VOLUME = 0.4;
const SILENCE = 0.0001;
const NOTE_SECONDS = 0.16;
const NOISE_LOWER = -1;
const NOISE_SPAN = 2;

const PICKUP_NOTES = { low: 660, high: 990 };
const CLEAR_NOTES = { first: 523, second: 659, third: 784, fourth: 1047 };
const GAME_OVER_NOTES = { first: 392, second: 330, third: 262, fourth: 196 };

function jingle(
  frequencies: readonly number[],
  type: OscillatorType,
): readonly Tone[] {
  return frequencies.map((frequency, index) => ({
    type,
    from: frequency,
    to: frequency,
    seconds: NOTE_SECONDS,
    volume: 0.3,
    delay: index * NOTE_SECONDS,
  }));
}

const RECIPES: Readonly<Record<Sound, Recipe>> = {
  gunshot: {
    noises: [{ seconds: 0.25, volume: 0.8 }],
    tones: [{ type: "square", from: 220, to: 40, seconds: 0.15, volume: 0.4 }],
  },
  dry: {
    tones: [
      { type: "square", from: 1200, to: 800, seconds: 0.03, volume: 0.3 },
    ],
  },
  zombieHit: {
    noises: [{ seconds: 0.08, volume: 0.4 }],
    tones: [
      { type: "sawtooth", from: 180, to: 90, seconds: 0.12, volume: 0.3 },
    ],
  },
  zombieDeath: {
    noises: [{ seconds: 0.3, volume: 0.3 }],
    tones: [{ type: "sawtooth", from: 200, to: 40, seconds: 0.6, volume: 0.4 }],
  },
  groan: {
    tones: [
      { type: "sawtooth", from: 90, to: 60, seconds: 0.7, volume: 0.25 },
      { type: "square", from: 95, to: 55, seconds: 0.7, volume: 0.1 },
    ],
  },
  pickup: {
    tones: jingle(Object.values(PICKUP_NOTES), "square"),
  },
  hurt: {
    noises: [{ seconds: 0.15, volume: 0.4 }],
    tones: [{ type: "square", from: 300, to: 100, seconds: 0.25, volume: 0.4 }],
  },
  levelClear: {
    tones: jingle(Object.values(CLEAR_NOTES), "square"),
  },
  gameOver: {
    tones: jingle(Object.values(GAME_OVER_NOTES), "sawtooth"),
  },
};

export interface Audio {
  readonly unlock: () => void;
  readonly play: (sound: Sound) => void;
}

export function createAudio(): Audio {
  let context: AudioContext | undefined;
  let noiseBuffer: AudioBuffer | undefined;

  function createNoiseBuffer(target: AudioContext): AudioBuffer {
    const buffer = target.createBuffer(1, target.sampleRate, target.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = NOISE_LOWER + Math.random() * NOISE_SPAN;
    }
    return buffer;
  }

  function envelope(
    target: AudioContext,
    start: number,
    seconds: number,
    volume: number,
  ): GainNode {
    const gain = target.createGain();
    gain.gain.setValueAtTime(volume * MASTER_VOLUME, start);
    gain.gain.exponentialRampToValueAtTime(SILENCE, start + seconds);
    gain.connect(target.destination);
    return gain;
  }

  function playTone(target: AudioContext, tone: Tone): void {
    const start = target.currentTime + (tone.delay ?? 0);
    const oscillator = target.createOscillator();
    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.from, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      tone.to,
      start + tone.seconds,
    );
    oscillator.connect(envelope(target, start, tone.seconds, tone.volume));
    oscillator.start(start);
    oscillator.stop(start + tone.seconds);
  }

  function playNoise(target: AudioContext, noise: Noise): void {
    const start = target.currentTime + (noise.delay ?? 0);
    const source = target.createBufferSource();
    noiseBuffer ??= createNoiseBuffer(target);
    source.buffer = noiseBuffer;
    source.connect(envelope(target, start, noise.seconds, noise.volume));
    source.start(start);
    source.stop(start + noise.seconds);
  }

  return {
    unlock: () => {
      try {
        context ??= new AudioContext();
        void context.resume().catch(() => undefined);
      } catch {
        context = undefined;
      }
    },
    play: (sound) => {
      if (context?.state !== "running") {
        return;
      }
      try {
        const recipe = RECIPES[sound];
        for (const tone of recipe.tones ?? []) {
          playTone(context, tone);
        }
        for (const noise of recipe.noises ?? []) {
          playNoise(context, noise);
        }
      } catch {
        context = undefined;
      }
    },
  };
}
