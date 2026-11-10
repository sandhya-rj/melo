// src/renderer/views/LyricsView.tsx
// High-fidelity Synchronized Lyrics View with Auto-Scrolling and Second Timestamps for MELO

import React, { useEffect, useRef, useMemo } from 'react';
import { Mic2, Play, Pause, ChevronLeft, Music2 } from 'lucide-react';
import type { TrackRecord } from '../../shared/types';
import { formatDurationMs } from './mockCatalog';

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsViewProps {
  currentTrack: TrackRecord | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onTogglePlay: () => void;
  onNavigate: (view: string) => void;
}

// Synced lyrics data by track id or title keywords
const SYNCED_LYRICS: Record<string, LyricLine[]> = {
  // 1. Blinding Lights
  trk_weeknd_blinding_lights: [
    { time: 0, text: '[Intro: Upbeat 80s Synth Hook]' },
    { time: 12, text: 'Yeah' },
    { time: 15, text: "I've been tryna call" },
    { time: 19, text: "I've been on my own for long enough" },
    { time: 26, text: 'Maybe you can show me how to love, maybe' },
    { time: 33, text: "I'm going through withdrawals" },
    { time: 38, text: "You don't even have to do too much" },
    { time: 43, text: 'You can turn me on with just a touch, baby' },
    { time: 50, text: "I look around and Sin City's cold and empty" },
    { time: 55, text: "No one's around to judge me" },
    { time: 59, text: "I can't see clearly when you're gone" },
    { time: 65, text: "I said, ooh, I'm blinded by the lights" },
    { time: 72, text: "No, I can't sleep until I feel your touch" },
    { time: 79, text: "I said, ooh, I'm drowning in the night" },
    { time: 86, text: "Oh, when I'm like this, you're the one I trust" },
    { time: 94, text: '[Synthesizer Riff / Driving Beat]' },
    { time: 101, text: "I'm running out of time" },
    { time: 106, text: "'Cause I can see the sun light up the sky" },
    { time: 112, text: 'So I hit the road in overdrive, baby, oh' },
    { time: 119, text: "The city's cold and empty" },
    { time: 124, text: "No one's around to judge me" },
    { time: 128, text: "I can't see clearly when you're gone" },
    { time: 134, text: "I said, ooh, I'm blinded by the lights" },
    { time: 141, text: "No, I can't sleep until I feel your touch" },
    { time: 148, text: "I said, ooh, I'm drowning in the night" },
    { time: 155, text: "Oh, when I'm like this, you're the one I trust" },
    { time: 163, text: "I'm just walking by to let you know" },
    { time: 168, text: 'I could never say it on the phone' },
    { time: 172, text: 'Will never let you go this time' },
    { time: 177, text: "I said, ooh, I'm blinded by the lights" },
    { time: 184, text: "No, I can't sleep until I feel your touch" },
    { time: 192, text: '[Outro: Iconic Synth Climax]' },
  ],

  // 2. Starboy
  trk_weeknd_starboy: [
    { time: 0, text: '[Intro: Electronic R&B Pulse]' },
    { time: 14, text: "I'm tryna put you in the worst mood, ah" },
    { time: 20, text: 'P1 cleaner than your church shoes, ah' },
    { time: 26, text: 'Milli point two just to hurt you, ah' },
    { time: 32, text: "All red Lamb' just to tease you, ah" },
    { time: 37, text: 'None of these toys on lease too, ah' },
    { time: 43, text: 'Made your whole year in a week too, yah' },
    { time: 48, text: 'Main bitch out your league too, ah' },
    { time: 54, text: 'Side bitch out of your league too, ah' },
    { time: 59, text: 'House so empty, need a centerpiece' },
    { time: 65, text: 'Twenty racks a table, cut from ebony' },
    { time: 71, text: 'Cut that ivory into skinny pieces' },
    { time: 76, text: 'Then she clean it with her face, man I love my baby' },
    { time: 82, text: 'You talkin money, need a hearing aid' },
    { time: 87, text: "You talkin 'bout me, I don't see the shade" },
    { time: 92, text: 'Switch up my style, I take any lane' },
    { time: 98, text: 'I switch up my cup, I kill any pain' },
    { time: 104, text: "Look what you've done" },
    { time: 110, text: "I'm a motherfuckin' starboy" },
    { time: 116, text: "Look what you've done" },
    { time: 121, text: "I'm a motherfuckin' starboy" },
    { time: 127, text: 'Every day a star is born' },
    { time: 132, text: 'Climb into the foreign, let the engine roar' },
    { time: 139, text: "We don't pray for love, we just pray for cars" },
    { time: 145, text: 'Living in the spotlight, reaching for the stars' },
    { time: 151, text: 'House so empty, need a centerpiece' },
    { time: 158, text: 'Twenty racks a table, cut from ebony' },
    { time: 164, text: "Look what you've done" },
    { time: 170, text: "I'm a motherfuckin' starboy" },
    { time: 176, text: "Look what you've done" },
    { time: 182, text: "I'm a motherfuckin' starboy" },
    { time: 192, text: 'No competition, we just take it high' },
    { time: 202, text: "Look what you've done" },
    { time: 208, text: "I'm a motherfuckin' starboy" },
    { time: 218, text: '[Outro: Deep Bass & Vocoder]' },
  ],

  // 3. Save Your Tears
  trk_weeknd_save_your_tears: [
    { time: 0, text: '[Intro: Sparkling 80s Synth Groove]' },
    { time: 12, text: 'Ooh, na na, yeah' },
    { time: 16, text: 'I saw you dancing in a crowded room' },
    { time: 22, text: "You look so happy when I'm not with you" },
    { time: 28, text: 'But then you saw me, caught you by surprise' },
    { time: 34, text: 'A single teardrop falling from your eye' },
    { time: 40, text: "I don't know why I run away" },
    { time: 46, text: "I'll make you cry when I run away" },
    { time: 53, text: "You could've asked me why I broke your heart" },
    { time: 58, text: "You could've told me that you fell apart" },
    { time: 64, text: "But you walked past me like I wasn't there" },
    { time: 70, text: "And just pretended like you didn't care" },
    { time: 77, text: "I don't know why I run away" },
    { time: 83, text: "I'll make you cry when I run away" },
    { time: 90, text: "Take me back 'cause I wanna stay" },
    { time: 96, text: 'Save your tears for another' },
    { time: 102, text: 'Save your tears for another day' },
    { time: 109, text: 'Save your tears for another day' },
    { time: 118, text: '[Synth Solo & Upbeat Groove]' },
    { time: 126, text: 'I made you think that I would always stay' },
    { time: 132, text: 'I said some things that I should never say' },
    { time: 138, text: 'Yeah, I broke your heart like someone did to mine' },
    { time: 144, text: "And now you won't love me for a second time" },
    { time: 151, text: "I don't know why I run away, oh girl" },
    { time: 158, text: 'Said I make you cry when I run away' },
    { time: 165, text: "Girl, take me back 'cause I wanna stay" },
    { time: 172, text: 'Save your tears for another day' },
    { time: 180, text: 'I said, save your tears for another day' },
    { time: 188, text: 'Save your tears for another day' },
    { time: 198, text: '[Outro: Melodic Synth Fadeout]' },
  ],

  // 4. After Hours
  trk_weeknd_after_hours: [
    { time: 0, text: '[Intro: Atmospheric Ambient Chords]' },
    { time: 18, text: 'Thought I almost died in my dream again' },
    { time: 28, text: "Fightin' for my life, I couldn't breathe again" },
    { time: 38, text: 'Fallin into you, without a friend' },
    { time: 48, text: 'This house is not a home without my baby' },
    { time: 58, text: 'Where are you now when I need you most?' },
    { time: 68, text: "I'd give it all just to hold you close" },
    { time: 78, text: '[Beat Drops: 130 BPM Four-on-the-Floor Synth Beat]' },
    { time: 86, text: 'Sorry that I broke your heart, your heart' },
    { time: 93, text: "I said, baby, I'll treat you better than I did before" },
    { time: 101, text: "I'll hold you down and not let you go" },
    { time: 108, text: "This time I'll never let you go" },
    { time: 116, text: 'Oh, baby, where are you now when I need you most?' },
    { time: 125, text: "I'd give it all just to hold you close" },
    { time: 133, text: 'Sorry that I broke your heart, your heart' },
    { time: 142, text: 'Never thought that I would ever see the day' },
    { time: 151, text: 'Where everything we built would slowly fade away' },
    { time: 160, text: "Now I'm in the club and dancing in the dark" },
    { time: 169, text: 'Hoping that my shadow can heal your broken heart' },
    { time: 178, text: 'Oh, baby, where are you now when I need you most?' },
    { time: 188, text: "I'd give it all just to hold you close" },
    { time: 198, text: 'Sorry that I broke your heart, your heart' },
    { time: 208, text: '[Outro: Dark Synthwave Climax]' },
  ],

  // 5. Dancing In The Flames
  trk_weeknd_dancing_in_the_flames: [
    { time: 0, text: '[Intro: Driving 132 BPM Synth Arpeggio]' },
    { time: 12, text: 'Traffic dies, the world is moving slow' },
    { time: 18, text: 'Look into the headlights, where did all the moments go?' },
    { time: 25, text: 'Everything is burning, glowing in the night' },
    { time: 32, text: 'Holding onto someone just to feel alive' },
    { time: 39, text: "I can't wait to see your face crash down" },
    { time: 46, text: 'We are dancing in the flames right now' },
    { time: 53, text: 'Dancing in the flames, dancing in the flames' },
    { time: 60, text: 'Everything is changing, but the feeling stays the same' },
    { time: 67, text: 'Dancing in the flames, dancing in the flames' },
    { time: 74, text: 'Through the smoke and static, calling out your name' },
    { time: 84, text: '[Pulsing Bass & Electro Hook]' },
    { time: 94, text: 'Speeding down the highway, twenty-six and bold' },
    { time: 101, text: 'Never let the fire turn into something cold' },
    { time: 108, text: 'Take my hand and tell me we will make it through' },
    { time: 115, text: "There is nothing in this world I wouldn't do for you" },
    { time: 122, text: "I can't wait to see your face crash down" },
    { time: 129, text: 'We are dancing in the flames right now' },
    { time: 136, text: 'Dancing in the flames, dancing in the flames' },
    { time: 143, text: 'Everything is changing, but the feeling stays the same' },
    { time: 151, text: 'Dancing in the flames, dancing in the flames' },
    { time: 158, text: 'Through the smoke and static, calling out your name' },
    { time: 169, text: '[Synth Climax & Bridge]' },
    { time: 182, text: 'Dancing in the flames...' },
    { time: 192, text: 'Calling out your name' },
    { time: 200, text: '[Outro: Ethereal Echo Fade]' },
  ],
};

function getLyricsForTrack(track: TrackRecord | null): LyricLine[] {
  if (!track) {
    return [
      { time: 0, text: 'No track currently playing' },
      { time: 10, text: 'Select a song from the library to view synchronized lyrics' },
    ];
  }

  // Check direct ID match
  if (SYNCED_LYRICS[track.id]) {
    return SYNCED_LYRICS[track.id];
  }

  // Check title keyword match for The Weeknd
  const t = track.title.toLowerCase();
  if (t.includes('blinding')) return SYNCED_LYRICS.trk_weeknd_blinding_lights;
  if (t.includes('starboy')) return SYNCED_LYRICS.trk_weeknd_starboy;
  if (t.includes('save your tears')) return SYNCED_LYRICS.trk_weeknd_save_your_tears;
  if (t.includes('after hours')) return SYNCED_LYRICS.trk_weeknd_after_hours;
  if (t.includes('dancing in the flames') || t.includes('timeless')) return SYNCED_LYRICS.trk_weeknd_dancing_in_the_flames;

  // Harmonized fallback lyrics for other catalog songs
  return [
    { time: 0, text: `[Intro: ${track.title} - ${track.artist}]` },
    { time: 12, text: 'Drifting through the neon city lights' },
    { time: 24, text: 'Electronic pulses echo through the night' },
    { time: 38, text: 'Every bassline carries us away' },
    { time: 52, text: 'Waiting for the dawn of another day' },
    { time: 66, text: '[Chorus: Driving Melodic Synthesis]' },
    { time: 82, text: 'Feel the rhythm flowing in the sound' },
    { time: 98, text: 'Higher than the gravity that holds the ground' },
    { time: 114, text: '[Instrumental Bridge & Arpeggios]' },
    { time: 132, text: 'Neon horizons shining bright and clear' },
    { time: 148, text: 'All the memories that we hold so dear' },
    { time: 164, text: '[Final Chorus: Climax Arrangement]' },
    { time: 182, text: 'Fade into the starlight, peaceful and serene' },
    { time: 198, text: '[Outro: Ambient Synthesis]' },
  ];
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  currentTrack,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onTogglePlay,
  onNavigate,
}) => {
  const lineContainerRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const lyrics = useMemo(() => getLyricsForTrack(currentTrack), [currentTrack]);

  // Determine current active lyric index based on currentTime
  const activeIndex = useMemo(() => {
    let active = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }, [currentTime, lyrics]);

  // Auto-scroll active lyric into center view smoothly
  useEffect(() => {
    if (lineRefs.current[activeIndex]) {
      lineRefs.current[activeIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  return (
    <div className="relative min-h-full flex flex-col pb-24 text-white select-none">
      {/* Dynamic Ambient Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2a133d] via-[#121212] to-black opacity-90 -z-10" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#121212]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="p-2 rounded-full hover:bg-white/10 text-[#b3b3b3] hover:text-white transition-colors focus:outline-none"
            title="Back to Home"
          >
            <ChevronLeft size={24} />
          </button>

          {currentTrack?.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-12 h-12 rounded shadow-md object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-[#282828] flex items-center justify-center">
              <Music2 size={24} className="text-[#727272]" />
            </div>
          )}

          <div>
            <h2 className="text-base font-bold text-white truncate max-w-md">
              {currentTrack?.title || 'No Track'}
            </h2>
            <p className="text-xs text-[#b3b3b3] truncate">
              {currentTrack?.artist || 'Unknown Artist'} • {currentTrack?.album || 'Single'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1ed760]/20 text-[#1ed760] text-xs font-bold uppercase tracking-wider">
            <Mic2 size={14} />
            <span>Synced Lyrics</span>
          </span>

          <button
            type="button"
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-106 active:scale-95 transition-all shadow-md focus:outline-none"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={18} className="fill-black" />
            ) : (
              <Play size={18} className="fill-black ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Lyrics Container */}
      <div
        ref={lineContainerRef}
        className="flex-1 px-8 md:px-16 py-12 space-y-6 max-w-4xl mx-auto w-full transition-all"
      >
        {lyrics.map((line, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;

          return (
            <div
              key={`${line.time}_${line.text}`}
              ref={(el) => {
                lineRefs.current[index] = el;
              }}
              onClick={() => onSeek(line.time)}
              className={`cursor-pointer transition-all duration-300 transform select-none ${
                isActive
                  ? 'text-white font-extrabold text-3xl md:text-4xl scale-102 py-2 drop-shadow-[0_2px_14px_rgba(255,255,255,0.35)]'
                  : isPast
                  ? 'text-white/60 hover:text-white/90 text-2xl md:text-3xl font-bold py-1'
                  : 'text-white/30 hover:text-white/70 text-2xl md:text-3xl font-bold py-1'
              }`}
            >
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-mono text-[#1ed760]/60 select-none tabular-nums opacity-60">
                  {formatDurationMs(line.time * 1000)}
                </span>
                <span className={isActive ? 'text-[#1ed760]' : ''}>{line.text}</span>
              </div>
            </div>
          );
        })}

        {/* Bottom padding so last lyric can scroll to center */}
        <div className="h-48" />
      </div>
    </div>
  );
};
