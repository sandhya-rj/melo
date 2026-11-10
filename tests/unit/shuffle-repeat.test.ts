import { describe, it, beforeEach, expect } from '../helpers/test-utils.ts';
import { SAMPLE_TRACKS } from '../helpers/test-utils.ts';
import { AudioEngineService } from '../../src/renderer/services/AudioEngineService.ts';

describe('Unit: Shuffle Math & Repeat State Machine', () => {
  let engine: AudioEngineService;

  beforeEach(() => {
    engine = new AudioEngineService();
  });

  // ==========================================
  // TIER 1: Feature Coverage (Shuffle & Repeat)
  // ==========================================

  it('Tier 1: initializes with shuffle false and repeat OFF', () => {
    expect(engine.shuffleEnabled).toBeFalsy();
    expect(engine.repeatMode).toBe('OFF');
  });

  it('Tier 1: cycles repeat mode strictly OFF -> ALL -> ONE -> OFF', () => {
    expect(engine.repeatMode).toBe('OFF');

    expect(engine.cycleRepeat()).toBe('ALL');
    expect(engine.repeatMode).toBe('ALL');

    expect(engine.cycleRepeat()).toBe('ONE');
    expect(engine.repeatMode).toBe('ONE');

    expect(engine.cycleRepeat()).toBe('OFF');
    expect(engine.repeatMode).toBe('OFF');
  });

  it('Tier 1: enabling shuffle keeps currently playing track at index 0', async () => {
    const current = SAMPLE_TRACKS[2]; // track 2
    await engine.loadTrack(current, SAMPLE_TRACKS);
    expect(engine.currentTrack?.id).toBe(current.id);

    engine.setShuffle(true);
    expect(engine.shuffleEnabled).toBeTruthy();
    expect(engine.contextQueue[0].id).toBe(current.id);
  });

  it('Tier 1: shuffled context queue contains every track exactly once (permutation invariant)', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    engine.setShuffle(true);

    expect(engine.contextQueue).toHaveLength(SAMPLE_TRACKS.length);
    const ids = engine.contextQueue.map(t => t.id).sort();
    const expectedIds = SAMPLE_TRACKS.map(t => t.id).sort();
    expect(ids).toEqual(expectedIds);
  });

  it('Tier 1: disabling shuffle restores original deterministic track order', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[1], SAMPLE_TRACKS);
    engine.setShuffle(true);
    expect(engine.shuffleEnabled).toBeTruthy();

    engine.setShuffle(false);
    expect(engine.shuffleEnabled).toBeFalsy();
    expect(engine.contextQueue.map(t => t.id)).toEqual(SAMPLE_TRACKS.map(t => t.id));
    expect(engine.contextIndex).toBe(1); // restored index of track 1
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: handles single-track playlist shuffle gracefully without error', async () => {
    const single = [SAMPLE_TRACKS[0]];
    await engine.loadTrack(SAMPLE_TRACKS[0], single);
    engine.setShuffle(true);
    expect(engine.contextQueue).toHaveLength(1);
    expect(engine.contextQueue[0].id).toBe(SAMPLE_TRACKS[0].id);

    engine.setShuffle(false);
    expect(engine.contextQueue).toHaveLength(1);
  });

  it('Tier 2: handles empty context queue shuffle', () => {
    engine.setShuffle(true);
    expect(engine.contextQueue).toHaveLength(0);
    engine.setShuffle(false);
    expect(engine.contextQueue).toHaveLength(0);
  });

  it('Tier 2: Fisher-Yates with 2 tracks keeps current at index 0 and swaps/retains second', () => {
    const twoTracks = [SAMPLE_TRACKS[0], SAMPLE_TRACKS[1]];
    const shuffled = engine.applyFisherYatesShuffle(twoTracks, SAMPLE_TRACKS[0]);
    expect(shuffled[0].id).toBe(SAMPLE_TRACKS[0].id);
    expect(shuffled[1].id).toBe(SAMPLE_TRACKS[1].id);
    expect(shuffled).toHaveLength(2);
  });

  it('Tier 2: rapid repeat cycling (100 times) maintains deterministic modulo 3 state', () => {
    for (let i = 0; i < 99; i++) {
      engine.cycleRepeat();
    }
    // 99 cycles = 99 % 3 = 0, so back to OFF
    expect(engine.repeatMode).toBe('OFF');

    engine.cycleRepeat(); // 1 cycle -> ALL
    expect(engine.repeatMode).toBe('ALL');
  });

  it('Tier 2: rapid shuffle toggling (50 times) preserves all original tracks', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    for (let i = 0; i < 50; i++) {
      engine.setShuffle(i % 2 === 0);
    }
    // Finished on shuffle = false
    expect(engine.contextQueue).toHaveLength(SAMPLE_TRACKS.length);
    expect(engine.contextQueue.map(t => t.id)).toEqual(SAMPLE_TRACKS.map(t => t.id));
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: Shuffle ON + Repeat ALL loops continuously through shuffled sequence', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    engine.setShuffle(true);
    engine.setRepeat('ALL');

    const firstShuffledTrack = engine.contextQueue[0];
    const sequence: string[] = [];

    // Advance through full context queue
    for (let i = 0; i < SAMPLE_TRACKS.length; i++) {
      sequence.push(engine.currentTrack!.id);
      await engine.next();
    }

    // After reaching end, it loops back to contextQueue[0]
    expect(engine.currentTrack?.id).toBe(firstShuffledTrack.id);
  });

  it('Tier 3: Shuffle ON + Repeat ONE maintains current track forever upon onEnded()', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[3], SAMPLE_TRACKS);
    engine.setShuffle(true);
    engine.setRepeat('ONE');

    for (let i = 0; i < 5; i++) {
      engine.onEnded();
      expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[3].id);
      expect(engine.playbackState).toBe('PLAYING');
    }
  });

  it('Tier 3: Switching repeat mode from ALL to OFF mid-playback prevents loop-around', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[SAMPLE_TRACKS.length - 1], SAMPLE_TRACKS);
    engine.setRepeat('ALL');
    // Change mind to OFF
    engine.setRepeat('OFF');

    await engine.next();
    expect(engine.playbackState).toBe('ENDED');
  });

  // ==========================================
  // TIER 4: Real-World Shuffle/Repeat Session
  // ==========================================

  it('Tier 4: simulates real-world shuffle party mode with repeat and track skipping', async () => {
    // 1. User loads playlist of 5 tracks
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);

    // 2. Turns on Shuffle
    engine.setShuffle(true);
    expect(engine.contextQueue[0].id).toBe(SAMPLE_TRACKS[0].id);

    // 3. User loves track 0, sets Repeat to ONE
    engine.setRepeat('ONE');
    engine.onEnded();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[0].id);

    // 4. User is satisfied, switches repeat to ALL
    engine.setRepeat('ALL');

    // 5. Skips to next track in shuffled context
    await engine.next();
    const track2Id = engine.currentTrack?.id;
    expect(track2Id).not.toBe(SAMPLE_TRACKS[0].id);

    // 6. Turns off Shuffle -> reverts to deterministic order but keeps currently playing track
    engine.setShuffle(false);
    expect(engine.contextQueue.map(t => t.id)).toEqual(SAMPLE_TRACKS.map(t => t.id));
    expect(engine.currentTrack?.id).toBe(track2Id);
  });
});
