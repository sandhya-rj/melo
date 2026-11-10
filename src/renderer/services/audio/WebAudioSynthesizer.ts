// WebAudioSynthesizer.ts
// High-fidelity multi-oscillator Web Audio API synthesizer for MELO
// Generates distinct, harmonic, pleasing musical compositions for every track in the catalog.

export interface MusicalTheme {
  bpm: number;
  rootFreq: number; // Hz for base note
  scale: number[];  // Semitone intervals
  chordProgression: number[][]; // Semitones relative to root
  bassPattern: number[];
  leadPattern: number[];
  waveform: OscillatorType;
  filterCutoff: number;
}

const MUSICAL_THEMES: Record<string, MusicalTheme> = {
  // Retro Groove (trk_01) - D minor, 118 BPM, 80s Synthwave
  trk_01: {
    bpm: 118,
    rootFreq: 146.83, // D3
    scale: [0, 2, 3, 5, 7, 8, 10], // Natural Minor
    chordProgression: [
      [0, 3, 7],   // Dm
      [-4, 0, 3],  // Bb
      [-2, 2, 5],  // C
      [3, 7, 10],  // F
    ],
    bassPattern: [0, 0, 7, 0, -4, -4, 3, -4, -2, -2, 5, -2, 3, 3, 7, 3],
    leadPattern: [12, 15, 17, 15, 12, 10, 12, 15, 17, 19, 17, 15, 14, 12, 10, 12],
    waveform: 'sawtooth',
    filterCutoff: 1800,
  },

  // Cyber Sunset (trk_02) - F major, 96 BPM, Warm Chillwave
  trk_02: {
    bpm: 96,
    rootFreq: 174.61, // F3
    scale: [0, 2, 4, 5, 7, 9, 11], // Major
    chordProgression: [
      [0, 4, 7],   // F
      [-3, 0, 4],  // Dm
      [-5, -1, 2], // Bb
      [-7, -3, 0], // C
    ],
    bassPattern: [0, -3, -5, -7],
    leadPattern: [12, 16, 19, 16, 14, 12, 16, 14, 12, 9, 12, 14, 16, 19, 21, 19],
    waveform: 'triangle',
    filterCutoff: 1200,
  },

  // Midnight Drive (trk_03) - A minor, 126 BPM, Driving Retrowave
  trk_03: {
    bpm: 126,
    rootFreq: 110.0, // A2
    scale: [0, 2, 3, 5, 7, 8, 10], // A Minor
    chordProgression: [
      [0, 3, 7],   // Am
      [-4, 0, 3],  // F
      [-2, 2, 5],  // G
      [-5, -2, 2], // Em
    ],
    bassPattern: [0, 0, 0, 0, -4, -4, -4, -4, -2, -2, -2, -2, -5, -5, -5, -5],
    leadPattern: [12, 15, 19, 15, 12, 15, 19, 20, 19, 15, 12, 10, 12, 15, 12, 7],
    waveform: 'sawtooth',
    filterCutoff: 2200,
  },

  // Solar Flare (trk_04) - C major / Lydian, 82 BPM, Ethereal Ambient
  trk_04: {
    bpm: 82,
    rootFreq: 130.81, // C3
    scale: [0, 2, 4, 6, 7, 9, 11], // Lydian
    chordProgression: [
      [0, 4, 7, 11], // Cmaj7
      [2, 6, 9, 12], // D
      [-3, 0, 4, 7], // Am7
      [-5, -1, 2, 5],// Fmaj7
    ],
    bassPattern: [0, 2, -3, -5],
    leadPattern: [12, 18, 19, 23, 24, 19, 18, 16, 12, 14, 16, 19, 23, 19, 16, 14],
    waveform: 'sine',
    filterCutoff: 900,
  },

  // Electric Dream (trk_05) - E minor, 122 BPM, Energetic Electro
  trk_05: {
    bpm: 122,
    rootFreq: 82.41, // E2
    scale: [0, 2, 3, 5, 7, 8, 10], // E Minor
    chordProgression: [
      [0, 3, 7],   // Em
      [-4, 0, 3],  // C
      [-2, 2, 5],  // D
      [-5, -2, 2], // Bm
    ],
    bassPattern: [0, 0, 7, 0, -4, -4, 3, -4, -2, -2, 5, -2, -5, -5, 2, -5],
    leadPattern: [12, 15, 17, 19, 17, 15, 12, 10, 12, 15, 19, 22, 24, 22, 19, 17],
    waveform: 'sawtooth',
    filterCutoff: 2600,
  },

  // Midnight Mirage (trk_06) - G minor, 104 BPM, Dream Pop
  trk_06: {
    bpm: 104,
    rootFreq: 98.0, // G2
    scale: [0, 2, 3, 5, 7, 8, 10], // G Minor
    chordProgression: [
      [0, 3, 7],   // Gm
      [-4, 0, 3],  // Eb
      [-2, 2, 5],  // F
      [3, 7, 10],  // Bb
    ],
    bassPattern: [0, -4, -2, 3],
    leadPattern: [12, 14, 15, 17, 15, 14, 12, 10, 12, 15, 17, 19, 17, 15, 14, 10],
    waveform: 'triangle',
    filterCutoff: 1400,
  },

  // Subway Luminescence (trk_07) - B minor, 114 BPM, Melodic Synthpop
  trk_07: {
    bpm: 114,
    rootFreq: 123.47, // B2
    scale: [0, 2, 3, 5, 7, 8, 10], // B Minor
    chordProgression: [
      [0, 3, 7],   // Bm
      [-4, 0, 3],  // G
      [-2, 2, 5],  // A
      [3, 7, 10],  // D
    ],
    bassPattern: [0, 0, 7, 0, -4, -4, 3, -4, -2, -2, 5, -2, 3, 3, 7, 3],
    leadPattern: [12, 15, 17, 19, 17, 15, 14, 12, 10, 12, 15, 17, 19, 22, 19, 15],
    waveform: 'sawtooth',
    filterCutoff: 2000,
  },

  // Orbit 9 (trk_08) - D minor, 76 BPM, Deep Space Resonance
  trk_08: {
    bpm: 76,
    rootFreq: 73.42, // D2
    scale: [0, 2, 3, 5, 7, 8, 10],
    chordProgression: [
      [0, 3, 7, 10], // Dm7
      [-2, 2, 5, 8], // C7
      [-4, 0, 3, 7], // Bbmaj7
      [-5, -2, 2, 5],// Am7
    ],
    bassPattern: [0, -2, -4, -5],
    leadPattern: [12, 17, 19, 24, 22, 19, 17, 15, 12, 15, 19, 22, 24, 26, 24, 19],
    waveform: 'sine',
    filterCutoff: 800,
  },

  // Neon Skyline (trk_09) - F# minor, 128 BPM, Cyberpunk Pulse
  trk_09: {
    bpm: 128,
    rootFreq: 92.5, // F#2
    scale: [0, 2, 3, 5, 7, 8, 10], // F# Minor
    chordProgression: [
      [0, 3, 7],   // F#m
      [-4, 0, 3],  // D
      [-2, 2, 5],  // E
      [-5, -2, 2], // C#m
    ],
    bassPattern: [0, 0, 0, 0, -4, -4, -4, -4, -2, -2, -2, -2, -5, -5, -5, -5],
    leadPattern: [12, 15, 19, 20, 19, 15, 12, 10, 12, 15, 17, 19, 22, 24, 22, 19],
    waveform: 'sawtooth',
    filterCutoff: 2800,
  },

  // The Weeknd - Blinding Lights (trk_weeknd_blinding_lights) - F minor, 171 BPM Synthwave
  trk_weeknd_blinding_lights: {
    bpm: 171,
    rootFreq: 174.61, // F3
    scale: [0, 2, 3, 5, 7, 8, 10], // Natural Minor
    chordProgression: [
      [0, 3, 7],   // Fm
      [-2, 2, 5],  // Eb
      [-4, 0, 3],  // Db
      [-5, -2, 2], // Cm
    ],
    bassPattern: [0, 0, 0, 0, -2, -2, -2, -2, -4, -4, -4, -4, -5, -5, -5, -5],
    leadPattern: [0, 2, 3, 7, 5, 3, 2, 0, 0, 2, 3, 7, 5, 3, 2, 3],
    waveform: 'sawtooth',
    filterCutoff: 2400,
  },

  // The Weeknd - Starboy (trk_weeknd_starboy) - G minor, 93 BPM Electro-R&B
  trk_weeknd_starboy: {
    bpm: 93,
    rootFreq: 196.0, // G3
    scale: [0, 2, 3, 5, 7, 8, 10],
    chordProgression: [
      [0, 3, 7],   // Gm
      [-2, 2, 5],  // F
      [-4, 0, 3],  // Eb
      [-5, -2, 2], // Dm
    ],
    bassPattern: [0, 0, 7, 0, -2, -2, 5, -2, -4, -4, 3, -4, -5, -5, 2, -5],
    leadPattern: [7, 7, 7, 5, 3, 5, 3, 0, 7, 7, 10, 7, 5, 3, 5, 7],
    waveform: 'sawtooth',
    filterCutoff: 2200,
  },

  // The Weeknd - Save Your Tears (trk_weeknd_save_your_tears) - C major, 118 BPM Synth-pop
  trk_weeknd_save_your_tears: {
    bpm: 118,
    rootFreq: 130.81, // C3
    scale: [0, 2, 4, 5, 7, 9, 11], // Major
    chordProgression: [
      [0, 4, 7],   // C
      [-3, 0, 4],  // Am
      [4, 7, 11],  // Em
      [-5, -1, 2], // G
    ],
    bassPattern: [0, 0, 7, 0, -3, -3, 4, -3, 4, 4, 7, 4, -5, -5, 2, -5],
    leadPattern: [12, 12, 14, 16, 12, 16, 19, 16, 14, 14, 12, 9, 12, 14, 12, 7],
    waveform: 'triangle',
    filterCutoff: 2000,
  },

  // The Weeknd - After Hours (trk_weeknd_after_hours) - D minor, 130 BPM Dark R&B / Synth
  trk_weeknd_after_hours: {
    bpm: 130,
    rootFreq: 146.83, // D3
    scale: [0, 2, 3, 5, 7, 8, 10],
    chordProgression: [
      [0, 3, 7],   // Dm
      [-4, 0, 3],  // Bb
      [3, 7, 10],  // F
      [-2, 2, 5],  // C
    ],
    bassPattern: [0, 0, 0, 7, -4, -4, -4, 3, 3, 3, 3, 7, -2, -2, -2, 5],
    leadPattern: [12, 15, 17, 15, 12, 10, 8, 10, 12, 15, 17, 19, 17, 15, 12, 10],
    waveform: 'sawtooth',
    filterCutoff: 1900,
  },

  // The Weeknd - Dancing In The Flames (trk_weeknd_dancing_in_the_flames) - A minor, 132 BPM Synth Anthem
  trk_weeknd_dancing_in_the_flames: {
    bpm: 132,
    rootFreq: 110.0, // A2
    scale: [0, 2, 3, 5, 7, 8, 10],
    chordProgression: [
      [0, 3, 7],   // Am
      [-4, 0, 3],  // F
      [3, 7, 10],  // C
      [-2, 2, 5],  // G
    ],
    bassPattern: [0, 0, 7, 0, -4, -4, 3, -4, 3, 3, 7, 3, -2, -2, 5, -2],
    leadPattern: [12, 15, 19, 15, 17, 15, 12, 10, 12, 15, 19, 20, 19, 15, 17, 19],
    waveform: 'sawtooth',
    filterCutoff: 2400,
  },
};

function semitoneToFreq(baseFreq: number, semitones: number): number {
  return baseFreq * Math.pow(2, semitones / 12);
}

// Deterministic procedural theme generator for any track ID
function getProceduralTheme(trackId: string, trackTitle?: string): MusicalTheme {
  let hash = 0;
  const str = trackId + (trackTitle || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const bpms = [100, 110, 118, 122, 125, 128, 95];
  const roots = [130.81, 146.83, 164.81, 174.61, 196.0, 110.0, 98.0]; // C3, D3, E3, F3, G3, A2, G2
  const waveforms: OscillatorType[] = ['sawtooth', 'triangle', 'sine', 'square'];

  const bpm = bpms[absHash % bpms.length];
  const rootFreq = roots[(absHash >> 3) % roots.length];
  const waveform = waveforms[(absHash >> 6) % waveforms.length];

  return {
    bpm,
    rootFreq,
    scale: [0, 2, 3, 5, 7, 8, 10],
    chordProgression: [
      [0, 3, 7],
      [-4, 0, 3],
      [-2, 2, 5],
      [3, 7, 10],
    ],
    bassPattern: [0, 0, 7, 0, -4, -4, 3, -4, -2, -2, 5, -2, 3, 3, 7, 3],
    leadPattern: [12, 15, 17, 19, 17, 15, 12, 10, 12, 15, 17, 20, 19, 17, 15, 12],
    waveform,
    filterCutoff: 1600 + (absHash % 1200),
  };
}

export class WebAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private isRunning: boolean = false;
  private activeTheme: MusicalTheme = MUSICAL_THEMES.trk_01;
  private currentVolume: number = 0.8;
  private isMuted: boolean = false;
  private timerId: number | null = null;
  private currentBeat: number = 0;
  private currentTrackId: string = 'trk_01';

  constructor() {
    // Lazily init AudioContext upon user gesture
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 2400;
      this.filterNode.Q.value = 2.0;

      this.filterNode.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.updateMasterVolume();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setVolume(level: number, muted: boolean = false): void {
    this.currentVolume = Math.max(0, Math.min(1, level));
    this.isMuted = muted;
    this.updateMasterVolume();
  }

  private updateMasterVolume(): void {
    if (!this.masterGain || !this.ctx) return;
    const targetGain = this.isMuted ? 0 : Math.pow(this.currentVolume, 2) * 0.35;
    this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.03);
  }

  public loadTrack(trackId: string, trackTitle?: string): void {
    this.currentTrackId = trackId;
    this.activeTheme = MUSICAL_THEMES[trackId] || getProceduralTheme(trackId, trackTitle);
    if (this.filterNode) {
      this.filterNode.frequency.value = this.activeTheme.filterCutoff;
    }
    this.currentBeat = 0;
  }

  public start(seekSeconds: number = 0): void {
    const ctx = this.initContext();
    this.isRunning = true;

    // Calculate initial beat from seekSeconds
    const secondsPerBeat = 60 / this.activeTheme.bpm;
    const stepSeconds = secondsPerBeat / 4; // 16th note steps
    this.currentBeat = Math.floor(seekSeconds / stepSeconds);

    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }

    const intervalMs = stepSeconds * 1000;
    this.timerId = window.setInterval(() => {
      if (!this.isRunning) return;
      this.tick();
    }, intervalMs);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public seek(seconds: number): void {
    const secondsPerBeat = 60 / this.activeTheme.bpm;
    const stepSeconds = secondsPerBeat / 4;
    this.currentBeat = Math.floor(seconds / stepSeconds);
  }

  private tick(): void {
    if (!this.ctx || !this.filterNode) return;
    const now = this.ctx.currentTime;
    const theme = this.activeTheme;
    const step = this.currentBeat % 16;
    const bar = Math.floor(this.currentBeat / 16);
    const chordIndex = Math.floor((this.currentBeat % 64) / 16);
    const chordNotes = theme.chordProgression[chordIndex % theme.chordProgression.length];

    // Dynamic section arrangement based on current beat
    // Intro: first 8 bars (beats 0-127)
    // Verse / Build: bars 8-24
    // Chorus: bars 24-40
    // Breakdown: bars 40-48
    // Climax Chorus: bars 48-64+ (repeats seamlessly)
    const sectionBar = bar % 64;
    const isIntro = sectionBar < 8;
    const isChorus = (sectionBar >= 24 && sectionBar < 40) || sectionBar >= 48;
    const isBreakdown = sectionBar >= 40 && sectionBar < 48;

    // 1. Drum Beat: 4-on-the-floor Kick drum
    if (!isIntro && !isBreakdown) {
      if (step % 4 === 0) {
        this.playKick(now, isChorus ? 0.42 : 0.32);
      }
    } else if (isIntro && bar >= 4 && step % 4 === 0) {
      this.playKick(now, 0.25);
    }

    // 2. Drum Beat: Snare drum on beats 4 & 12 (beats 2 and 4 of 4/4 bar)
    if (!isIntro && !isBreakdown) {
      if (step === 4 || step === 12) {
        this.playSnare(now, isChorus ? 0.38 : 0.28);
      }
    } else if (isBreakdown && (step === 8 || (sectionBar >= 46 && step % 4 === 0))) {
      // Snare roll in breakdown
      this.playSnare(now, 0.22);
    }

    // 3. Drum Beat: Hi-Hats (16th notes with 8th offbeat accents)
    if (!isIntro || bar >= 2) {
      if (step % 2 === 0) {
        const isOffbeat = step % 4 === 2;
        this.playHiHat(now, isOffbeat ? 0.14 : 0.08);
      } else if (isChorus) {
        this.playHiHat(now, 0.05);
      }
    }

    // 4. Driving Bassline on 8th notes
    if (step % 2 === 0 && (!isBreakdown || sectionBar >= 44)) {
      const bassIndex = (step / 2) % theme.bassPattern.length;
      const bassSemitone = theme.bassPattern[bassIndex];
      this.playTone(
        semitoneToFreq(theme.rootFreq, bassSemitone - 12),
        'triangle',
        now,
        (60 / theme.bpm) * 0.48,
        isChorus ? 0.34 : 0.26
      );
    }

    // 5. Lush Polyphonic Chord Pad on quarter notes
    if (step % 4 === 0) {
      const padGain = isChorus ? 0.14 : 0.09;
      for (const semitone of chordNotes) {
        this.playTone(
          semitoneToFreq(theme.rootFreq, semitone + 12),
          theme.waveform,
          now,
          (60 / theme.bpm) * 0.95,
          padGain
        );
      }
    }

    // 6. Melodic Lead Hook Arpeggio on 16th notes
    if (!isIntro || bar >= 4) {
      const leadIndex = step % theme.leadPattern.length;
      const leadSemitone = theme.leadPattern[leadIndex];
      if (leadSemitone !== undefined) {
        this.playTone(
          semitoneToFreq(theme.rootFreq, leadSemitone + 12),
          theme.waveform,
          now,
          0.15,
          isChorus ? 0.22 : 0.15
        );
      }
    }

    this.currentBeat++;
  }

  private playKick(time: number, gainLevel: number): void {
    if (!this.ctx || !this.masterGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.16);

      gain.gain.setValueAtTime(gainLevel, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.26);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(time);
      osc.stop(time + 0.27);
    } catch {}
  }

  private playSnare(time: number, gainLevel: number): void {
    if (!this.ctx || !this.filterNode || !this.masterGain) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1100;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainLevel * 0.75, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.17);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(time);
      noise.stop(time + 0.18);

      // Body tone
      const body = this.ctx.createOscillator();
      const bodyGain = this.ctx.createGain();
      body.type = 'triangle';
      body.frequency.setValueAtTime(185, time);
      body.frequency.exponentialRampToValueAtTime(80, time + 0.11);
      bodyGain.gain.setValueAtTime(gainLevel * 0.45, time);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

      body.connect(bodyGain);
      bodyGain.connect(this.masterGain);
      body.start(time);
      body.stop(time + 0.13);
    } catch {}
  }

  private playTone(
    freq: number,
    type: OscillatorType,
    time: number,
    duration: number,
    gainLevel: number
  ): void {
    if (!this.ctx || !this.filterNode) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      // ADSR Envelope
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(gainLevel, time + 0.02);
      gain.gain.exponentialRampToValueAtTime(gainLevel * 0.6, time + duration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.filterNode);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch {}
  }

  private playHiHat(time: number, gainLevel: number): void {
    if (!this.ctx || !this.filterNode) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.04; // 40ms noise burst
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainLevel, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.038);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.filterNode);

      noise.start(time);
      noise.stop(time + 0.04);
    } catch {}
  }
}

// Global Singleton
export const webAudioSynthesizer = new WebAudioSynthesizer();
