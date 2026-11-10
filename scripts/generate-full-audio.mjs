// scripts/generate-full-audio.mjs
// Generates full 180-230s rich multi-instrument WAV tracks for MELO
// Instruments: Kick drum, snare drum, hi-hats, synth bass, polyphonic chord pads, lead hook.

import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 32000; // 32kHz sample rate for high quality & fast generation

function createWavBuffer(sampleRate, numChannels, floatSamples) {
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = floatSamples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20); // PCM = 1
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16 bits

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write PCM samples with soft clipping
  let offset = 44;
  for (let i = 0; i < floatSamples.length; i++) {
    let s = floatSamples[i];
    // Soft limiting / clipping
    if (s > 0.95) s = 0.95 + (s - 0.95) / (1 + (s - 0.95));
    else if (s < -0.95) s = -0.95 + (s + 0.95) / (1 - (s + 0.95));
    const intSample = Math.max(-32768, Math.min(32767, Math.round(s * 32767)));
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

function semitoneToFreq(rootFreq, semitone) {
  return rootFreq * Math.pow(2, semitone / 12);
}

// Track definitions with musical attributes and duration
const TRACK_SPECS = [
  // 1. The Weeknd - Blinding Lights (171 BPM Synthwave, F Minor)
  {
    fileName: 'the-weeknd-blinding-lights',
    durationSec: 200, // 3:20
    bpm: 171,
    rootFreq: 174.61, // F3
    // Chords: Fm (0, 3, 7), Eb (-2, 2, 5), Db (-4, 0, 3), Cm (-5, -2, 2)
    chords: [
      [0, 3, 7],
      [-2, 2, 5],
      [-4, 0, 3],
      [-5, -2, 2],
    ],
    // Iconic Blinding Lights melodic hook (semitones from F3)
    // F - G - Ab - C - Bb - Ab - G
    leadHook: [0, 2, 3, 7, 5, 3, 2, 0, 0, 2, 3, 7, 5, 3, 2, 3],
    bassPattern: [0, 0, 0, 0, -2, -2, -2, -2, -4, -4, -4, -4, -5, -5, -5, -5],
    style: 'synthwave',
  },

  // 2. The Weeknd - Starboy (93 BPM / 186 half-time Electro-R&B, G Minor)
  {
    fileName: 'the-weeknd-starboy',
    durationSec: 230, // 3:50
    bpm: 93,
    rootFreq: 196.0, // G3
    // Chords: Gm (0, 3, 7), F (-2, 2, 5), Eb (-4, 0, 3), Dm (-5, -2, 2)
    chords: [
      [0, 3, 7],
      [-2, 2, 5],
      [-4, 0, 3],
      [-5, -2, 2],
    ],
    // Starboy vocal lead / synth hook
    leadHook: [7, 7, 7, 5, 3, 5, 3, 0, 7, 7, 10, 7, 5, 3, 5, 7],
    bassPattern: [0, 0, 7, 0, -2, -2, 5, -2, -4, -4, 3, -4, -5, -5, 2, -5],
    style: 'electrorandb',
  },

  // 3. The Weeknd - Save Your Tears (118 BPM Synth-pop, C Major)
  {
    fileName: 'the-weeknd-save-your-tears',
    durationSec: 215, // 3:35
    bpm: 118,
    rootFreq: 130.81, // C3
    // Chords: C (0, 4, 7), Am (-3, 0, 4), Em (4, 7, 11), G (-5, -1, 2)
    chords: [
      [0, 4, 7],
      [-3, 0, 4],
      [4, 7, 11],
      [-5, -1, 2],
    ],
    // Save Your Tears iconic 80s synth hook
    leadHook: [12, 12, 14, 16, 12, 16, 19, 16, 14, 14, 12, 9, 12, 14, 12, 7],
    bassPattern: [0, 0, 7, 0, -3, -3, 4, -3, 4, 4, 7, 4, -5, -5, 2, -5],
    style: 'synthpop',
  },

  // 4. The Weeknd - After Hours (130 BPM Dark atmospheric R&B build into synth beat)
  {
    fileName: 'the-weeknd-after-hours',
    durationSec: 225, // 3:45
    bpm: 130,
    rootFreq: 146.83, // D3
    // Chords: Dm (0, 3, 7), Bb (-4, 0, 3), F (3, 7, 10), C (-2, 2, 5)
    chords: [
      [0, 3, 7],
      [-4, 0, 3],
      [3, 7, 10],
      [-2, 2, 5],
    ],
    leadHook: [12, 15, 17, 15, 12, 10, 8, 10, 12, 15, 17, 19, 17, 15, 12, 10],
    bassPattern: [0, 0, 0, 7, -4, -4, -4, 3, 3, 3, 3, 7, -2, -2, -2, 5],
    style: 'darkwave',
  },

  // 5. The Weeknd - Dancing In The Flames (132 BPM Synthwave Anthem, A Minor)
  {
    fileName: 'the-weeknd-dancing-in-the-flames',
    durationSec: 210, // 3:30
    bpm: 132,
    rootFreq: 110.0, // A2
    // Chords: Am (0, 3, 7), F (-4, 0, 3), C (3, 7, 10), G (-2, 2, 5)
    chords: [
      [0, 3, 7],
      [-4, 0, 3],
      [3, 7, 10],
      [-2, 2, 5],
    ],
    leadHook: [12, 15, 19, 15, 17, 15, 12, 10, 12, 15, 19, 20, 19, 15, 17, 19],
    bassPattern: [0, 0, 7, 0, -4, -4, 3, -4, 3, 3, 7, 3, -2, -2, 5, -2],
    style: 'synthwave',
  },

  // 6. Track 1 / Retro Groove (118 BPM Synthwave)
  {
    fileName: 'track1',
    durationSec: 214, // 3:34
    bpm: 118,
    rootFreq: 146.83, // D3
    chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [3, 7, 10]],
    leadHook: [12, 15, 17, 15, 12, 10, 12, 15, 17, 19, 17, 15, 14, 12, 10, 12],
    bassPattern: [0, 0, 7, 0, -4, -4, 3, -4, -2, -2, 5, -2, 3, 3, 7, 3],
    style: 'synthwave',
  },

  // 7. Track 2 / Cyber Sunset (96 BPM Warm Chillwave)
  {
    fileName: 'track2',
    durationSec: 185, // 3:05
    bpm: 96,
    rootFreq: 174.61, // F3
    chords: [[0, 4, 7], [-3, 0, 4], [-5, -1, 2], [-7, -3, 0]],
    leadHook: [12, 16, 19, 16, 14, 12, 16, 14, 12, 9, 12, 14, 16, 19, 21, 19],
    bassPattern: [0, -3, -5, -7],
    style: 'chillwave',
  },

  // 8. Track 3 / Midnight Drive (126 BPM Retrowave)
  {
    fileName: 'track3',
    durationSec: 242, // 4:02
    bpm: 126,
    rootFreq: 110.0, // A2
    chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -2, 2]],
    leadHook: [12, 15, 19, 15, 12, 15, 19, 20, 19, 15, 12, 10, 12, 15, 12, 7],
    bassPattern: [0, 0, 0, 0, -4, -4, -4, -4, -2, -2, -2, -2, -5, -5, -5, -5],
    style: 'synthwave',
  },

  // 9. Track 4 / Solar Flare (82 BPM Ambient Chill)
  {
    fileName: 'track4',
    durationSec: 198, // 3:18
    bpm: 82,
    rootFreq: 130.81, // C3
    chords: [[0, 4, 7, 11], [2, 6, 9, 12], [-3, 0, 4, 7], [-5, -1, 2, 5]],
    leadHook: [12, 18, 19, 23, 24, 19, 18, 16, 12, 14, 16, 19, 23, 19, 16, 14],
    bassPattern: [0, 2, -3, -5],
    style: 'ambient',
  },

  // 10. Track 5 / Electric Dream (122 BPM Energetic Electro)
  {
    fileName: 'track5',
    durationSec: 220, // 3:40
    bpm: 122,
    rootFreq: 82.41, // E2
    chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -2, 2]],
    leadHook: [12, 15, 17, 19, 17, 15, 12, 10, 12, 15, 19, 22, 24, 22, 19, 17],
    bassPattern: [0, 0, 7, 0, -4, -4, 3, -4, -2, -2, 5, -2, -5, -5, 2, -5],
    style: 'electro',
  },
];

function generateTrackSamples(spec) {
  const totalSamples = Math.floor(spec.durationSec * SAMPLE_RATE);
  const out = new Float32Array(totalSamples);

  const secondsPerBeat = 60 / spec.bpm;
  const samplesPerBeat = Math.floor(secondsPerBeat * SAMPLE_RATE);
  const samplesPer16th = Math.floor(samplesPerBeat / 4);
  const totalBeats = Math.floor(totalSamples / samplesPerBeat);

  console.log(`Synthesizing "${spec.fileName}": ${spec.durationSec}s @ ${spec.bpm} BPM (${totalBeats} beats)...`);

  // Section arrangement milestones (fraction of total duration)
  // 0.0 - 0.08: Intro (pads + arp)
  // 0.08 - 0.28: Verse 1 (kick + bass + pads)
  // 0.28 - 0.48: Chorus 1 (full kick + snare + hats + bass + lead + pads)
  // 0.48 - 0.65: Verse 2 (light groove + bass + pads)
  // 0.65 - 0.85: Chorus 2 (massive full sound)
  // 0.85 - 0.93: Bridge / breakdown (swelling pads + filter sweep + building snare)
  // 0.93 - 1.00: Climax / Outro (full climax fading out)

  // Pre-generate white noise table
  const noiseLen = 32768;
  const noiseTable = new Float32Array(noiseLen);
  for (let i = 0; i < noiseLen; i++) {
    noiseTable[i] = Math.random() * 2 - 1;
  }

  // 1. Render Drums
  for (let beat = 0; beat < totalBeats; beat++) {
    const beatTimeSec = beat * secondsPerBeat;
    const progress = beatTimeSec / spec.durationSec;
    const beatStartSample = beat * samplesPerBeat;

    const isIntro = progress < 0.08;
    const isBridge = progress >= 0.85 && progress < 0.93;
    const isOutro = progress >= 0.97;

    // A. Kick Drum: 4-on-the-floor (every beat except intro/bridge)
    if (!isIntro && !isBridge && !isOutro) {
      const kickDuration = Math.min(Math.floor(0.28 * SAMPLE_RATE), totalSamples - beatStartSample);
      for (let s = 0; s < kickDuration; s++) {
        const t = s / SAMPLE_RATE;
        // Pitch envelope: 150Hz decaying rapidly to 42Hz
        const f = 42 + 108 * Math.exp(-t * 28);
        const phase = 2 * Math.PI * f * t;
        const amp = Math.exp(-t * 12);
        // tiny click at t=0
        const click = t < 0.005 ? (1 - t / 0.005) * 0.4 : 0;
        out[beatStartSample + s] += (Math.sin(phase) * 0.45 + click) * amp;
      }
    }

    // B. Snare Drum: beats 1 and 3 (0-indexed: beats 1 & 3 in a 4-beat bar)
    const barBeat = beat % 4;
    const hasSnare = (barBeat === 1 || barBeat === 3) && !isIntro;
    const isBridgeSnareRoll = isBridge && (beat % 2 === 0 || progress > 0.90);

    if (hasSnare || isBridgeSnareRoll) {
      const snareDur = Math.min(Math.floor(0.22 * SAMPLE_RATE), totalSamples - beatStartSample);
      for (let s = 0; s < snareDur; s++) {
        const t = s / SAMPLE_RATE;
        const noise = noiseTable[(beatStartSample + s) % noiseLen];
        const tone = Math.sin(2 * Math.PI * 185 * t);
        const amp = Math.exp(-t * 16);
        out[beatStartSample + s] += (noise * 0.28 + tone * 0.15) * amp;
      }
    }

    // C. Hi-Hats: 16th notes
    if (progress >= 0.04 && !isOutro) {
      for (let step16 = 0; step16 < 4; step16++) {
        const hatSample = beatStartSample + step16 * samplesPer16th;
        if (hatSample >= totalSamples) break;
        const isOffbeat = step16 === 2; // 8th offbeat
        const hatDur = Math.min(Math.floor((isOffbeat ? 0.08 : 0.035) * SAMPLE_RATE), totalSamples - hatSample);
        const hatGain = isOffbeat ? 0.14 : (step16 === 0 ? 0.10 : 0.06);

        for (let s = 0; s < hatDur; s++) {
          const t = s / SAMPLE_RATE;
          // Simple highpass by subtracting delayed noise
          const n1 = noiseTable[(hatSample + s) % noiseLen];
          const n2 = noiseTable[(hatSample + s + 2) % noiseLen];
          const hpNoise = n1 - n2;
          const amp = Math.exp(-t * (isOffbeat ? 25 : 85));
          out[hatSample + s] += hpNoise * hatGain * amp;
        }
      }
    }
  }

  // 2. Bassline & Chord Progression (per 16-beat chord cycles)
  const stepsTotal = Math.floor(totalSamples / samplesPer16th);
  for (let step = 0; step < stepsTotal; step++) {
    const stepTimeSec = (step * samplesPer16th) / SAMPLE_RATE;
    const progress = stepTimeSec / spec.durationSec;
    const stepSample = step * samplesPer16th;
    if (stepSample >= totalSamples) break;

    const chordCycleStep = Math.floor(step / 16) % spec.chords.length;
    const currentChord = spec.chords[chordCycleStep];

    // A. Bass note (on 8th notes, step % 2 === 0)
    if (progress >= 0.04 && progress < 0.98) {
      if (step % 2 === 0) {
        const bassIndex = (step / 2) % spec.bassPattern.length;
        const bassSemitone = spec.bassPattern[bassIndex];
        const bassFreq = semitoneToFreq(spec.rootFreq, bassSemitone - 12);
        const bassDur = Math.min(Math.floor(samplesPer16th * 1.8), totalSamples - stepSample);

        const isBridge = progress >= 0.85 && progress < 0.93;
        const bassGain = isBridge ? 0.12 : 0.28;

        for (let s = 0; s < bassDur; s++) {
          const t = s / SAMPLE_RATE;
          // Sub-bass sine + saw-filtered warmth
          const phase = 2 * Math.PI * bassFreq * t;
          const sub = Math.sin(phase);
          const saw = (2 * ((phase / (2 * Math.PI)) % 1) - 1) * 0.4;
          const amp = Math.exp(-t * 6);
          out[stepSample + s] += (sub * 0.7 + saw * 0.3) * bassGain * amp;
        }
      }
    }

    // B. Polyphonic Chord Pad (quarter notes, step % 4 === 0)
    if (step % 4 === 0) {
      const chordDur = Math.min(Math.floor(samplesPer16th * 4.2), totalSamples - stepSample);
      const isChorus = (progress >= 0.28 && progress < 0.48) || (progress >= 0.65 && progress < 0.85) || progress >= 0.93;
      const padGain = isChorus ? 0.08 : 0.05;

      for (let s = 0; s < chordDur; s++) {
        const t = s / SAMPLE_RATE;
        // Soft envelope: attack 40ms, release
        const env = t < 0.04 ? t / 0.04 : Math.exp(-(t - 0.04) * 1.5);

        for (const noteSemi of currentChord) {
          const freq = semitoneToFreq(spec.rootFreq, noteSemi + 12);
          // Detuned warm pair
          const f1 = freq * 0.998;
          const f2 = freq * 1.002;
          const sig = Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t);
          out[stepSample + s] += sig * padGain * env;
        }
      }
    }

    // C. Melodic Lead Hook (arpeggiated / melodic synth)
    const isLeadActive = (progress >= 0.15 && progress < 0.48) || (progress >= 0.55 && progress < 0.85) || progress >= 0.91;
    if (isLeadActive) {
      const leadIdx = step % spec.leadHook.length;
      const leadSemi = spec.leadHook[leadIdx];
      if (leadSemi !== undefined) {
        const leadFreq = semitoneToFreq(spec.rootFreq, leadSemi + 12);
        const leadDur = Math.min(Math.floor(samplesPer16th * 1.2), totalSamples - stepSample);
        const leadGain = 0.16;

        for (let s = 0; s < leadDur; s++) {
          const t = s / SAMPLE_RATE;
          const phase = 2 * Math.PI * leadFreq * t;
          // Bright saw wave for iconic synth lead hook
          const saw = 2 * ((phase / (2 * Math.PI)) % 1) - 1;
          const sine = Math.sin(phase);
          const env = Math.exp(-t * 9);
          out[stepSample + s] += (saw * 0.6 + sine * 0.4) * leadGain * env;
        }
      }
    }
  }

  // Master fade in (0 - 1.5s) and fade out (last 3s)
  const fadeInSamples = Math.floor(1.5 * SAMPLE_RATE);
  for (let s = 0; s < fadeInSamples; s++) {
    out[s] *= (s / fadeInSamples);
  }
  const fadeOutSamples = Math.floor(3.0 * SAMPLE_RATE);
  for (let s = 0; s < fadeOutSamples; s++) {
    const idx = totalSamples - fadeOutSamples + s;
    if (idx >= 0 && idx < totalSamples) {
      out[idx] *= (1 - s / fadeOutSamples);
    }
  }

  return out;
}

// Generate all tracks
const publicAudioDir = path.resolve(process.cwd(), 'public/audio');
const publicSampleAudioDir = path.resolve(process.cwd(), 'public/sample-audio');

if (!fs.existsSync(publicAudioDir)) fs.mkdirSync(publicAudioDir, { recursive: true });
if (!fs.existsSync(publicSampleAudioDir)) fs.mkdirSync(publicSampleAudioDir, { recursive: true });

console.log('--- Generating Full 3+ Minute Audio Tracks for MELO ---');

for (const spec of TRACK_SPECS) {
  const samples = generateTrackSamples(spec);
  const wavBuffer = createWavBuffer(SAMPLE_RATE, 1, samples);

  // Write to public/audio/<name>.wav
  const wavAudioPath = path.join(publicAudioDir, `${spec.fileName}.wav`);
  fs.writeFileSync(wavAudioPath, wavBuffer);
  console.log(`Saved: ${wavAudioPath} (${(wavBuffer.length / (1024 * 1024)).toFixed(2)} MB, ${spec.durationSec}s)`);

  // Write to public/sample-audio/<name>.wav
  const wavSamplePath = path.join(publicSampleAudioDir, `${spec.fileName}.wav`);
  fs.writeFileSync(wavSamplePath, wavBuffer);

  // Also create .mp3 alias copy so legacy URLs or tests asking for .mp3 decode properly
  const mp3AudioPath = path.join(publicAudioDir, `${spec.fileName}.mp3`);
  fs.writeFileSync(mp3AudioPath, wavBuffer);
  const mp3SamplePath = path.join(publicSampleAudioDir, `${spec.fileName}.mp3`);
  fs.writeFileSync(mp3SamplePath, wavBuffer);
}

// Also create named aliases for retro-groove, cyber-sunset, midnight-drive, solar-flare, electric-dream
const aliases = [
  ['track1.wav', 'retro-groove.wav'],
  ['track2.wav', 'cyber-sunset.wav'],
  ['track3.wav', 'midnight-drive.wav'],
  ['track4.wav', 'solar-flare.wav'],
  ['track5.wav', 'electric-dream.wav'],
];

for (const [src, dst] of aliases) {
  const srcP = path.join(publicAudioDir, src);
  if (fs.existsSync(srcP)) {
    fs.copyFileSync(srcP, path.join(publicAudioDir, dst));
    fs.copyFileSync(srcP, path.join(publicAudioDir, dst.replace('.wav', '.mp3')));
    fs.copyFileSync(srcP, path.join(publicSampleAudioDir, dst));
    fs.copyFileSync(srcP, path.join(publicSampleAudioDir, dst.replace('.wav', '.mp3')));
    console.log(`Aliased: ${dst} -> ${src}`);
  }
}

console.log('=== All 3+ Minute Audio Tracks Successfully Generated! ===');
