import { describe, it, beforeEach, expect } from '../helpers/test-utils.ts';
import { SAMPLE_TRACKS } from '../helpers/test-utils.ts';
import { AudioEngineService } from '../../src/renderer/services/AudioEngineService.ts';

describe('Unit: Audio Engine State Machine & Controls', () => {
  let engine: AudioEngineService;

  beforeEach(() => {
    engine = new AudioEngineService();
  });

  // ==========================================
  // TIER 1: Feature Coverage (Primary Paths)
  // ==========================================

  it('Tier 1: initializes in IDLE state with default settings', () => {
    expect(engine.playbackState).toBe('IDLE');
    expect(engine.currentTrack).toBeNull();
    expect(engine.currentTimeMs).toBe(0);
    expect(engine.volume).toBe(0.8);
    expect(engine.isMuted).toBeFalsy();
    expect(engine.repeatMode).toBe('OFF');
    expect(engine.shuffleEnabled).toBeFalsy();
  });

  it('Tier 1: loads track and transitions to PLAYING state', async () => {
    const track = SAMPLE_TRACKS[0];
    await engine.loadTrack(track, SAMPLE_TRACKS);
    expect(engine.playbackState).toBe('PLAYING');
    expect(engine.currentTrack).toEqual(track);
    expect(engine.currentTimeMs).toBe(0);
    expect(engine.durationMs).toBe(track.durationMs);
  });

  it('Tier 1: pauses and resumes playback accurately', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0]);
    engine.seek(15); // 15 seconds
    engine.pause();
    expect(engine.playbackState).toBe('PAUSED');
    expect(engine.currentTimeMs).toBe(15000);

    await engine.resume();
    expect(engine.playbackState).toBe('PLAYING');
    expect(engine.currentTimeMs).toBe(15000);
  });

  it('Tier 1: updates volume linearly within normalized range [0.0, 1.0]', () => {
    engine.setVolume(0.5);
    expect(engine.volume).toBe(0.5);
    engine.setVolume(0.25);
    expect(engine.volume).toBe(0.25);
  });

  it('Tier 1: toggles mute preserving and restoring prior volume', () => {
    engine.setVolume(0.72);
    engine.toggleMute();
    expect(engine.isMuted).toBeTruthy();
    expect(engine.volume).toBe(0.0);

    engine.toggleMute();
    expect(engine.isMuted).toBeFalsy();
    expect(engine.volume).toBe(0.72);
  });

  it('Tier 1: seeks to valid time offset in seconds', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0]);
    engine.seek(45.5);
    expect(engine.currentTimeMs).toBe(45500);
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: clamps volume below 0.0 to exactly 0.0', () => {
    engine.setVolume(-0.5);
    expect(engine.volume).toBe(0.0);
    engine.setVolume(-100);
    expect(engine.volume).toBe(0.0);
  });

  it('Tier 2: clamps volume above 1.0 to exactly 1.0', () => {
    engine.setVolume(1.5);
    expect(engine.volume).toBe(1.0);
    engine.setVolume(999);
    expect(engine.volume).toBe(1.0);
  });

  it('Tier 2: clamps seek offset to 0 for negative input', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0]);
    engine.seek(-10);
    expect(engine.currentTimeMs).toBe(0);
  });

  it('Tier 2: clamps seek offset to track duration for overshoot', async () => {
    const track = SAMPLE_TRACKS[0];
    await engine.loadTrack(track);
    engine.seek(track.durationMs / 1000 + 50); // overshoot by 50s
    expect(engine.currentTimeMs).toBe(track.durationMs);
  });

  it('Tier 2: 3.0s Rule - rewinds to 0:00 when position > 3000ms', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    engine.seek(3.05); // 3050ms > 3000ms
    expect(engine.currentTimeMs).toBe(3050);

    await engine.previous();
    expect(engine.currentTimeMs).toBe(0);
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[0].id);
  });

  it('Tier 2: 3.0s Rule - goes to previous track in history when position <= 3000ms', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    await engine.next(); // now at track 1, track 0 in history
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[1].id);

    engine.seek(2.5); // 2500ms <= 3000ms
    await engine.previous();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[0].id);
    expect(engine.currentTimeMs).toBe(0);
  });

  it('Tier 2: 3.0s Rule - at first track with <= 3000ms and no history, rewinds to 0', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    engine.seek(1.5); // 1500ms <= 3000ms, no history
    await engine.previous();
    expect(engine.currentTimeMs).toBe(0);
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[0].id);
  });

  it('Tier 2: rapid play/pause toggling stress test maintains state integrity', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0]);
    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) engine.pause();
      else await engine.resume();
    }
    expect(engine.playbackState).toBe('PLAYING');
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[0].id);
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: setting volume while muted un-mutes and applies new volume', () => {
    engine.setVolume(0.6);
    engine.toggleMute();
    expect(engine.isMuted).toBeTruthy();
    expect(engine.volume).toBe(0.0);

    // User moves slider while muted
    engine.setVolume(0.4);
    expect(engine.isMuted).toBeFalsy();
    expect(engine.volume).toBe(0.4);
  });

  it('Tier 3: seeking while paused preserves PAUSED state and updates timestamp', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0]);
    engine.pause();
    expect(engine.playbackState).toBe('PAUSED');

    engine.seek(60);
    expect(engine.playbackState).toBe('PAUSED');
    expect(engine.currentTimeMs).toBe(60000);
  });

  it('Tier 3: track ending with repeat ONE loops current track from 0:00', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    engine.setRepeat('ONE');
    engine.seek(214); // near end

    engine.onEnded();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[0].id);
    expect(engine.currentTimeMs).toBe(0);
    expect(engine.playbackState).toBe('PLAYING');
  });

  it('Tier 3: track ending with repeat OFF at end of queue transitions to ENDED', async () => {
    const singleTrackList = [SAMPLE_TRACKS[0]];
    await engine.loadTrack(SAMPLE_TRACKS[0], singleTrackList);
    engine.setRepeat('OFF');

    engine.onEnded();
    expect(engine.playbackState).toBe('ENDED');
  });

  it('Tier 3: track ending with repeat ALL at end of queue loops to first track', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[SAMPLE_TRACKS.length - 1], SAMPLE_TRACKS); // last track
    engine.setRepeat('ALL');

    engine.onEnded();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[0].id);
    expect(engine.currentTimeMs).toBe(0);
    expect(engine.playbackState).toBe('PLAYING');
  });

  // ==========================================
  // TIER 4: Real-World Audio Engine Workflows
  // ==========================================

  it('Tier 4: simulates full playback session with volume, seek, and track transitions', async () => {
    // 1. Initial play from album
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    expect(engine.playbackState).toBe('PLAYING');

    // 2. Adjust volume to 65%
    engine.setVolume(0.65);
    expect(engine.volume).toBe(0.65);

    // 3. Scrub to 50%
    engine.seek(SAMPLE_TRACKS[0].durationMs / 2000);
    expect(engine.currentTimeMs).toBe(SAMPLE_TRACKS[0].durationMs / 2);

    // 4. Temporary mute during phone call, then unmute
    engine.toggleMute();
    expect(engine.volume).toBe(0.0);
    engine.toggleMute();
    expect(engine.volume).toBe(0.65);

    // 5. Track finishes naturally
    engine.onEnded();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[1].id);

    // 6. User skips back after 5 seconds of track 2 (rewinds to 0:00)
    engine.seek(5.0);
    await engine.previous();
    expect(engine.currentTimeMs).toBe(0);
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[1].id);

    // 7. User skips back immediately at 1.0 second (jumps back to track 1)
    engine.seek(1.0);
    await engine.previous();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[0].id);
  });
});
