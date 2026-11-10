import { describe, it, beforeEach, expect } from '../helpers/test-utils.ts';
import { SAMPLE_TRACKS } from '../helpers/test-utils.ts';
import { AudioEngineService } from '../../src/renderer/services/AudioEngineService.ts';

describe('Unit: Two-Tier Queue Management Logic', () => {
  let engine: AudioEngineService;

  beforeEach(() => {
    engine = new AudioEngineService();
  });

  // ==========================================
  // TIER 1: Feature Coverage (Two-Tier Queue)
  // ==========================================

  it('Tier 1: initializes with empty user queue and context queue', () => {
    expect(engine.userQueue).toHaveLength(0);
    expect(engine.contextQueue).toHaveLength(0);
  });

  it('Tier 1: adds individual tracks to user queue maintaining insertion order', () => {
    engine.addToQueue(SAMPLE_TRACKS[1]);
    engine.addToQueue(SAMPLE_TRACKS[2]);
    expect(engine.userQueue).toHaveLength(2);
    expect(engine.userQueue[0].id).toBe(SAMPLE_TRACKS[1].id);
    expect(engine.userQueue[1].id).toBe(SAMPLE_TRACKS[2].id);
  });

  it('Tier 1: user queue takes priority over context queue on next()', async () => {
    // Context queue has tracks 0, 1, 2
    await engine.loadTrack(SAMPLE_TRACKS[0], [SAMPLE_TRACKS[0], SAMPLE_TRACKS[1], SAMPLE_TRACKS[2]]);
    // User manually adds track 4 to queue
    engine.addToQueue(SAMPLE_TRACKS[4]);

    // When advancing, User Queue track 4 must play next, NOT context track 1
    await engine.next();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[4].id);
    expect(engine.userQueue).toHaveLength(0);

    // Next advancement returns to context track 1
    await engine.next();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[1].id);
  });

  it('Tier 1: removes specific track from user queue by index', () => {
    engine.addToQueue(SAMPLE_TRACKS[0]);
    engine.addToQueue(SAMPLE_TRACKS[1]);
    engine.addToQueue(SAMPLE_TRACKS[2]);

    engine.removeFromQueue(1); // remove track 1
    expect(engine.userQueue).toHaveLength(2);
    expect(engine.userQueue[0].id).toBe(SAMPLE_TRACKS[0].id);
    expect(engine.userQueue[1].id).toBe(SAMPLE_TRACKS[2].id);
  });

  it('Tier 1: clearQueue flushes user queue while keeping context intact', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    engine.addToQueue(SAMPLE_TRACKS[3]);
    engine.addToQueue(SAMPLE_TRACKS[4]);
    expect(engine.userQueue).toHaveLength(2);

    engine.clearQueue();
    expect(engine.userQueue).toHaveLength(0);
    expect(engine.contextQueue).toHaveLength(SAMPLE_TRACKS.length);
  });

  it('Tier 1: reorders tracks within the user queue', () => {
    engine.addToQueue(SAMPLE_TRACKS[0]);
    engine.addToQueue(SAMPLE_TRACKS[1]);
    engine.addToQueue(SAMPLE_TRACKS[2]);

    // Move index 2 (track 2) to index 0
    engine.reorderQueue(2, 0);
    expect(engine.userQueue[0].id).toBe(SAMPLE_TRACKS[2].id);
    expect(engine.userQueue[1].id).toBe(SAMPLE_TRACKS[0].id);
    expect(engine.userQueue[2].id).toBe(SAMPLE_TRACKS[1].id);
  });

  // ==========================================
  // TIER 2: Boundary & Corner Cases (BVA)
  // ==========================================

  it('Tier 2: ignores removeFromQueue with negative index', () => {
    engine.addToQueue(SAMPLE_TRACKS[0]);
    engine.removeFromQueue(-1);
    expect(engine.userQueue).toHaveLength(1);
  });

  it('Tier 2: ignores removeFromQueue with out-of-bounds index', () => {
    engine.addToQueue(SAMPLE_TRACKS[0]);
    engine.removeFromQueue(99);
    expect(engine.userQueue).toHaveLength(1);
  });

  it('Tier 2: ignores reorderQueue with invalid indexes', () => {
    engine.addToQueue(SAMPLE_TRACKS[0]);
    engine.addToQueue(SAMPLE_TRACKS[1]);
    engine.reorderQueue(-1, 5);
    expect(engine.userQueue[0].id).toBe(SAMPLE_TRACKS[0].id);
  });

  it('Tier 2: supports empty user queue gracefully on next()', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], [SAMPLE_TRACKS[0], SAMPLE_TRACKS[1]]);
    expect(engine.userQueue).toHaveLength(0);
    await engine.next();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[1].id);
  });

  it('Tier 2: handles stress queue with 50 tracks without degradation', () => {
    for (let i = 0; i < 50; i++) {
      engine.addToQueue({
        ...SAMPLE_TRACKS[0],
        id: `stress_trk_${i}`,
        title: `Stress Track ${i}`
      });
    }
    expect(engine.userQueue).toHaveLength(50);
    expect(engine.userQueue[49].title).toBe('Stress Track 49');

    engine.clearQueue();
    expect(engine.userQueue).toHaveLength(0);
  });

  it('Tier 2: handles duplicate track additions in user queue', () => {
    engine.addToQueue(SAMPLE_TRACKS[0]);
    engine.addToQueue(SAMPLE_TRACKS[0]);
    expect(engine.userQueue).toHaveLength(2);
    expect(engine.userQueue[0].id).toBe(engine.userQueue[1].id);
  });

  // ==========================================
  // TIER 3: Cross-Feature Combinations
  // ==========================================

  it('Tier 3: User Queue preserves order when Shuffle is enabled on Context Queue', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    engine.addToQueue(SAMPLE_TRACKS[3]);
    engine.addToQueue(SAMPLE_TRACKS[4]);

    // Enable shuffle
    engine.setShuffle(true);

    // User Queue must remain exactly [track 3, track 4]
    expect(engine.userQueue).toHaveLength(2);
    expect(engine.userQueue[0].id).toBe(SAMPLE_TRACKS[3].id);
    expect(engine.userQueue[1].id).toBe(SAMPLE_TRACKS[4].id);

    // First next() plays track 3
    await engine.next();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[3].id);

    // Second next() plays track 4
    await engine.next();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[4].id);
  });

  it('Tier 3: Repeat ONE mode plays current track continuously without consuming user queue', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    engine.addToQueue(SAMPLE_TRACKS[3]);
    engine.setRepeat('ONE');

    // Active track ends
    engine.onEnded();
    // In Repeat ONE, current track loops from 0:00, user queue is NOT consumed
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[0].id);
    expect(engine.userQueue).toHaveLength(1);
    expect(engine.userQueue[0].id).toBe(SAMPLE_TRACKS[3].id);
  });

  it('Tier 3: Repeat ALL mode cycles context queue after user queue is completely drained', async () => {
    const list = [SAMPLE_TRACKS[0], SAMPLE_TRACKS[1]];
    await engine.loadTrack(SAMPLE_TRACKS[1], list); // currently on track 1 (last in list)
    engine.addToQueue(SAMPLE_TRACKS[4]); // enqueued user track
    engine.setRepeat('ALL');

    // 1st skip plays user queue track
    await engine.next();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[4].id);
    expect(engine.userQueue).toHaveLength(0);

    // 2nd skip wraps to context track 0 because Repeat is ALL
    await engine.next();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[0].id);
  });

  it('Tier 3: previous track history maintains tracks played from user queue', async () => {
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);
    engine.addToQueue(SAMPLE_TRACKS[4]);

    await engine.next(); // plays track 4 from user queue
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[4].id);

    // Skip back at 1.0s (<=3.0s rule)
    engine.seek(1.0);
    await engine.previous();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[0].id);
  });

  // ==========================================
  // TIER 4: Real-World Queue Journey
  // ==========================================

  it('Tier 4: simulates complex user queue workflow during a listening session', async () => {
    // 1. User starts playing album
    await engine.loadTrack(SAMPLE_TRACKS[0], SAMPLE_TRACKS);

    // 2. While listening to track 0, user searches and adds 3 party tracks
    engine.addToQueue(SAMPLE_TRACKS[2]);
    engine.addToQueue(SAMPLE_TRACKS[3]);
    engine.addToQueue(SAMPLE_TRACKS[4]);
    expect(engine.userQueue).toHaveLength(3);

    // 3. User reconsiders and reorders track 4 to play first
    engine.reorderQueue(2, 0);
    expect(engine.userQueue[0].id).toBe(SAMPLE_TRACKS[4].id);

    // 4. User deletes track 2 from queue
    engine.removeFromQueue(1);
    expect(engine.userQueue).toHaveLength(2);
    expect(engine.userQueue.map(t => t.id)).toEqual([SAMPLE_TRACKS[4].id, SAMPLE_TRACKS[3].id]);

    // 5. Track 0 ends -> Track 4 plays
    engine.onEnded();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[4].id);

    // 6. Track 4 ends -> Track 3 plays
    engine.onEnded();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[3].id);

    // 7. Track 3 ends -> Album resumes from Track 1!
    engine.onEnded();
    expect(engine.currentTrack?.id).toBe(SAMPLE_TRACKS[1].id);
    expect(engine.userQueue).toHaveLength(0);
  });
});
