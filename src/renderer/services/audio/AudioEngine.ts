import type { IAudioEngine, PlaybackState, RepeatMode, TrackRecord } from '../../../shared/types.ts';
import { webAudioSynthesizer } from './WebAudioSynthesizer.ts';

export class AudioEngine implements IAudioEngine {
  public playbackState: PlaybackState = 'IDLE';
  public currentTrack: TrackRecord | null = null;
  public currentTimeMs: number = 0;
  public durationMs: number = 0;
  public volume: number = 0.8;
  public isMuted: boolean = false;
  public preMuteVolume: number = 0.8;
  public shuffleEnabled: boolean = false;
  public repeatMode: RepeatMode = 'OFF';

  // Configurable Audio Settings
  public normalizeVolume: boolean = true;
  public volumeLevel: 'Quiet' | 'Normal' | 'Loud' = 'Normal';
  public monoAudioEnabled: boolean = false;
  public crossfadeSeconds: number = 0;
  public autoplayEnabled: boolean = false;
  public equalizerEnabled: boolean = false;
  public equalizerPreset: string = 'Flat';
  public equalizerBands: Record<string, number> = {
    '60Hz': 0,
    '150Hz': 0,
    '400Hz': 0,
    '1kHz': 0,
    '2.4kHz': 0,
    '15kHz': 0,
  };

  // Two-Tier Queue Management
  public userQueue: TrackRecord[] = [];
  public contextQueue: TrackRecord[] = [];
  public originalContextQueue: TrackRecord[] = [];
  public contextIndex: number = -1;
  public playbackHistory: TrackRecord[] = [];

  // Browser HTML5 Audio Element & Web Audio API
  private audioElement: HTMLAudioElement | null = null;
  private audioCtx: any = null;
  private masterGain: any = null;
  private synthTimer: any = null;
  private activeOscillators: any[] = [];
  public stateChangeListeners: Array<(state: PlaybackState) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      if (typeof Audio !== 'undefined') {
        try {
          this.audioElement = new Audio();
          this.audioElement.addEventListener('ended', () => this.onEnded());
          this.audioElement.addEventListener('timeupdate', () => {
            if (this.audioElement && this.playbackState === 'PLAYING') {
              this.currentTimeMs = Math.floor(this.audioElement.currentTime * 1000);
            }
          });
          this.audioElement.addEventListener('loadedmetadata', () => {
            if (this.audioElement && this.audioElement.duration && isFinite(this.audioElement.duration)) {
              this.durationMs = Math.round(this.audioElement.duration * 1000);
            }
          });
          this.audioElement.addEventListener('error', () => {
            // If HTML5 audio source cannot be decoded or loaded, synth fallback takes over seamlessly
            this.startSynthesizerFallback();
          });
        } catch {}
      }

      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          this.audioCtx = new AudioContextClass();
          this.masterGain = this.audioCtx.createGain();
          this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
          this.masterGain.connect(this.audioCtx.destination);
        } catch {}
      }
    }
  }

  private initAudioContext(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
          this.masterGain = this.audioCtx.createGain();
          this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioCtx.currentTime);
          this.masterGain.connect(this.audioCtx.destination);
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch {}
  }

  public getPlayableAudioUrl(url?: string): string {
    if (!url) return '';
    if (
      url.startsWith('blob:') ||
      url.startsWith('data:') ||
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      return url;
    }
    const clean = url.startsWith('/') ? url : `/${url}`;
    return clean.replace(/\.mp3$/i, '.wav');
  }

  private startSynthesizerFallback(): void {
    if (typeof window === 'undefined') return;
    this.stopSynthesizer();
    if (!this.currentTrack) return;

    try {
      webAudioSynthesizer.loadTrack(this.currentTrack.id, this.currentTrack.title);
      webAudioSynthesizer.setVolume(this.volume, this.isMuted);
      webAudioSynthesizer.start(this.currentTimeMs / 1000);

      this.synthTimer = setInterval(() => {
        if (this.playbackState === 'PLAYING') {
          this.currentTimeMs += 250;
          if (this.durationMs > 0 && this.currentTimeMs >= this.durationMs) {
            this.onEnded();
          }
        }
      }, 250);
    } catch {}
  }

  private stopSynthesizer(): void {
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
    webAudioSynthesizer.stop();
    for (const osc of this.activeOscillators) {
      try { osc.stop(); } catch {}
    }
    this.activeOscillators = [];
  }

  public async loadTrack(track: TrackRecord, contextQueue?: TrackRecord[]): Promise<void> {
    this.playbackState = 'LOADING';
    this.currentTrack = track;
    this.currentTimeMs = 0;
    this.durationMs = track.durationMs;

    if (contextQueue && contextQueue.length > 0) {
      this.originalContextQueue = [...contextQueue];
      if (this.shuffleEnabled) {
        this.contextQueue = this.applyFisherYatesShuffle(contextQueue, track);
        this.contextIndex = 0;
      } else {
        this.contextQueue = [...contextQueue];
        const idx = contextQueue.findIndex((t) => t.id === track.id);
        this.contextIndex = idx !== -1 ? idx : 0;
      }
    } else {
      this.contextQueue = [track];
      this.originalContextQueue = [track];
      this.contextIndex = 0;
    }

    this.stopSynthesizer();

    if (this.audioElement) {
      if (track.audioUrl) {
        const playableUrl = this.getPlayableAudioUrl(track.audioUrl);
        this.audioElement.src = playableUrl;
        this.updateAudioElementVolume();
        try {
          await this.audioElement.play();
        } catch {
          // If browser policy restricts or URL fails, start synth fallback
          this.startSynthesizerFallback();
        }
      } else {
        this.startSynthesizerFallback();
      }
    } else if (typeof window !== 'undefined') {
      this.startSynthesizerFallback();
    }

    this.playbackState = 'PLAYING';
    this.notifyState();
  }

  public async play(): Promise<void> {
    if (!this.currentTrack && this.contextQueue.length > 0) {
      await this.loadTrack(this.contextQueue[0], this.contextQueue);
      return;
    }
    if (this.currentTrack) {
      this.initAudioContext();
      if (this.audioElement && this.currentTrack.audioUrl) {
        try {
          await this.audioElement.play();
        } catch {
          this.startSynthesizerFallback();
        }
      } else if (typeof window !== 'undefined') {
        this.startSynthesizerFallback();
      }
      this.playbackState = 'PLAYING';
      this.notifyState();
    }
  }

  public pause(): void {
    if (this.playbackState === 'PLAYING') {
      if (this.audioElement) {
        try { this.audioElement.pause(); } catch {}
      }
      this.stopSynthesizer();
      this.playbackState = 'PAUSED';
      this.notifyState();
    }
  }

  public async resume(): Promise<void> {
    if (this.playbackState === 'PAUSED' && this.currentTrack) {
      this.initAudioContext();
      if (this.audioElement && this.currentTrack.audioUrl) {
        try {
          await this.audioElement.play();
        } catch {
          this.startSynthesizerFallback();
        }
      } else if (typeof window !== 'undefined') {
        this.startSynthesizerFallback();
      }
      this.playbackState = 'PLAYING';
      this.notifyState();
    }
  }

  public seek(seconds: number): void {
    const targetMs = Math.max(0, Math.min(Math.round(seconds * 1000), this.durationMs));
    this.currentTimeMs = targetMs;
    if (this.audioElement) {
      try {
        this.audioElement.currentTime = targetMs / 1000;
      } catch {}
    }
    webAudioSynthesizer.seek(seconds);
  }

  public setVolume(level: number): void {
    const clamped = Math.max(0, Math.min(1, level));
    this.volume = clamped;
    if (clamped > 0 && this.isMuted) {
      this.isMuted = false;
    }
    if (!this.isMuted && clamped > 0) {
      this.preMuteVolume = clamped;
    }
    this.updateAudioElementVolume();
  }

  public toggleMute(): void {
    if (this.isMuted) {
      this.isMuted = false;
      this.volume = this.preMuteVolume > 0 ? this.preMuteVolume : 0.8;
    } else {
      this.preMuteVolume = this.volume > 0 ? this.volume : 0.8;
      this.isMuted = true;
      this.volume = 0.0;
    }
    this.updateAudioElementVolume();
  }

  public getNormalizationMultiplier(): number {
    if (!this.normalizeVolume) return 1.0;
    switch (this.volumeLevel) {
      case 'Quiet':
        return 0.65;
      case 'Loud':
        return 1.25;
      case 'Normal':
      default:
        return 1.0;
    }
  }

  public setVolumeNormalization(enabled: boolean, level: 'Quiet' | 'Normal' | 'Loud' = 'Normal'): void {
    this.normalizeVolume = enabled;
    this.volumeLevel = level;
    this.updateAudioElementVolume();
  }

  public setMonoAudio(enabled: boolean): void {
    this.monoAudioEnabled = enabled;
  }

  public setCrossfade(seconds: number): void {
    this.crossfadeSeconds = Math.max(0, Math.min(12, seconds));
  }

  public setAutoplay(enabled: boolean): void {
    this.autoplayEnabled = enabled;
  }

  public setEqualizer(enabled: boolean, preset: string = 'Flat', bands?: Record<string, number>): void {
    this.equalizerEnabled = enabled;
    this.equalizerPreset = preset;
    if (bands) {
      this.equalizerBands = { ...this.equalizerBands, ...bands };
    }
  }

  private updateAudioElementVolume(): void {
    const norm = this.getNormalizationMultiplier();
    const effectiveVol = this.isMuted ? 0 : Math.max(0, Math.min(1.0, this.volume * norm));
    if (this.audioElement) {
      try {
        this.audioElement.volume = effectiveVol;
      } catch {}
    }
    if (this.masterGain && this.audioCtx) {
      try {
        this.masterGain.gain.setValueAtTime(effectiveVol, this.audioCtx.currentTime);
      } catch {}
    }
    webAudioSynthesizer.setVolume(this.volume * norm, this.isMuted);
  }

  public setShuffle(enabled: boolean): void {
    this.shuffleEnabled = enabled;
    if (this.contextQueue.length <= 1) return;

    if (enabled) {
      this.contextQueue = this.applyFisherYatesShuffle(this.originalContextQueue, this.currentTrack);
      this.contextIndex = 0;
    } else {
      this.contextQueue = [...this.originalContextQueue];
      if (this.currentTrack) {
        const idx = this.contextQueue.findIndex((t) => t.id === this.currentTrack!.id);
        this.contextIndex = idx !== -1 ? idx : 0;
      }
    }
  }

  public setRepeat(mode: RepeatMode): void {
    this.repeatMode = mode;
  }

  public cycleRepeat(): RepeatMode {
    if (this.repeatMode === 'OFF') {
      this.repeatMode = 'ALL';
    } else if (this.repeatMode === 'ALL') {
      this.repeatMode = 'ONE';
    } else {
      this.repeatMode = 'OFF';
    }
    return this.repeatMode;
  }

  public async next(): Promise<void> {
    if (this.currentTrack) {
      this.playbackHistory.push(this.currentTrack);
    }

    // Priority 1: User Queue (manually added tracks)
    if (this.userQueue.length > 0) {
      const nextTrack = this.userQueue.shift()!;
      this.currentTrack = nextTrack;
      this.currentTimeMs = 0;
      this.durationMs = nextTrack.durationMs;
      this.stopSynthesizer();
      if (this.audioElement && nextTrack.audioUrl) {
        this.audioElement.src = this.getPlayableAudioUrl(nextTrack.audioUrl);
        try { await this.audioElement.play(); } catch { this.startSynthesizerFallback(); }
      } else if (typeof window !== 'undefined') {
        this.startSynthesizerFallback();
      }
      this.playbackState = 'PLAYING';
      this.notifyState();
      return;
    }

    // Priority 2: Context Queue advancement
    if (this.contextIndex + 1 < this.contextQueue.length) {
      this.contextIndex += 1;
      const nextTrack = this.contextQueue[this.contextIndex];
      this.currentTrack = nextTrack;
      this.currentTimeMs = 0;
      this.durationMs = nextTrack.durationMs;
      this.stopSynthesizer();
      if (this.audioElement && nextTrack.audioUrl) {
        this.audioElement.src = this.getPlayableAudioUrl(nextTrack.audioUrl);
        try { await this.audioElement.play(); } catch { this.startSynthesizerFallback(); }
      } else if (typeof window !== 'undefined') {
        this.startSynthesizerFallback();
      }
      this.playbackState = 'PLAYING';
      this.notifyState();
      return;
    }

    // Priority 3: Repeat ALL wraps back to beginning of context queue
    if (this.repeatMode === 'ALL' && this.contextQueue.length > 0) {
      this.contextIndex = 0;
      const nextTrack = this.contextQueue[0];
      this.currentTrack = nextTrack;
      this.currentTimeMs = 0;
      this.durationMs = nextTrack.durationMs;
      this.stopSynthesizer();
      if (this.audioElement && nextTrack.audioUrl) {
        this.audioElement.src = this.getPlayableAudioUrl(nextTrack.audioUrl);
        try { await this.audioElement.play(); } catch { this.startSynthesizerFallback(); }
      } else if (typeof window !== 'undefined') {
        this.startSynthesizerFallback();
      }
      this.playbackState = 'PLAYING';
      this.notifyState();
      return;
    }

    // Queue exhausted
    this.stopSynthesizer();
    this.playbackState = 'ENDED';
    this.currentTimeMs = this.durationMs;
    this.notifyState();
  }

  public async previous(): Promise<void> {
    // 3.0-Second Rule: if > 3 seconds into track, rewind to start
    if (this.currentTimeMs > 3000) {
      this.currentTimeMs = 0;
      if (this.audioElement) {
        try { this.audioElement.currentTime = 0; } catch {}
      }
      return;
    }

    // Navigate to previous track in playback history
    if (this.playbackHistory.length > 0) {
      const prevTrack = this.playbackHistory.pop()!;
      this.currentTrack = prevTrack;
      this.currentTimeMs = 0;
      this.durationMs = prevTrack.durationMs;
      if (this.contextQueue.length > 0) {
        const idx = this.contextQueue.findIndex((t) => t.id === prevTrack.id);
        if (idx !== -1) this.contextIndex = idx;
      }
      this.stopSynthesizer();
      if (this.audioElement && prevTrack.audioUrl) {
        this.audioElement.src = this.getPlayableAudioUrl(prevTrack.audioUrl);
        try { await this.audioElement.play(); } catch { this.startSynthesizerFallback(); }
      } else if (typeof window !== 'undefined') {
        this.startSynthesizerFallback();
      }
      this.playbackState = 'PLAYING';
      this.notifyState();
      return;
    }

    // Navigate to previous track in context queue
    if (this.contextIndex > 0) {
      this.contextIndex -= 1;
      const prevTrack = this.contextQueue[this.contextIndex];
      this.currentTrack = prevTrack;
      this.currentTimeMs = 0;
      this.durationMs = prevTrack.durationMs;
      this.stopSynthesizer();
      if (this.audioElement && prevTrack.audioUrl) {
        this.audioElement.src = this.getPlayableAudioUrl(prevTrack.audioUrl);
        try { await this.audioElement.play(); } catch { this.startSynthesizerFallback(); }
      } else if (typeof window !== 'undefined') {
        this.startSynthesizerFallback();
      }
      this.playbackState = 'PLAYING';
      this.notifyState();
      return;
    }

    // At track 0 with no history: rewind current track
    this.currentTimeMs = 0;
    if (this.audioElement) {
      try { this.audioElement.currentTime = 0; } catch {}
    }
  }

  public addToQueue(track: TrackRecord): void {
    this.userQueue.push(track);
  }

  public removeFromQueue(index: number): void {
    if (index >= 0 && index < this.userQueue.length) {
      this.userQueue.splice(index, 1);
    }
  }

  public clearQueue(): void {
    this.userQueue = [];
  }

  public reorderQueue(fromIndex: number, toIndex: number): void {
    if (
      fromIndex >= 0 &&
      fromIndex < this.userQueue.length &&
      toIndex >= 0 &&
      toIndex < this.userQueue.length
    ) {
      const [item] = this.userQueue.splice(fromIndex, 1);
      this.userQueue.splice(toIndex, 0, item);
    }
  }

  public onEnded(): void {
    if (this.repeatMode === 'ONE') {
      this.currentTimeMs = 0;
      if (this.audioElement) {
        try {
          this.audioElement.currentTime = 0;
          this.audioElement.play();
        } catch {}
      }
      this.playbackState = 'PLAYING';
      this.notifyState();
      return;
    }
    this.next();
  }

  public onStateChange(listener: (state: PlaybackState) => void): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notifyState(): void {
    for (const listener of this.stateChangeListeners) {
      try {
        listener(this.playbackState);
      } catch {}
    }
  }

  // Fisher-Yates (Knuth) Shuffle Invariant: current track stays at index 0
  public applyFisherYatesShuffle(tracks: TrackRecord[], currentTrack: TrackRecord | null): TrackRecord[] {
    if (!tracks || tracks.length <= 1) return [...tracks];
    const copy = [...tracks];

    let remaining = copy;
    if (currentTrack) {
      remaining = copy.filter((t) => t.id !== currentTrack.id);
    }

    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = remaining[i];
      remaining[i] = remaining[j];
      remaining[j] = temp;
    }

    if (currentTrack) {
      return [currentTrack, ...remaining];
    }
    return remaining;
  }
}

// Global Singleton Instance
let globalAudioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!globalAudioEngineInstance) {
    globalAudioEngineInstance = new AudioEngine();
  }
  return globalAudioEngineInstance;
}

// Aliases for seamless imports across modules
export const AudioEngineService = AudioEngine;
export type AudioEngineService = AudioEngine;
