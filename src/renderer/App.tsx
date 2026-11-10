import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { MainCanvas } from './components/layout/MainCanvas';
import { RightPanel } from './components/layout/RightPanel';
import { PlayerBar } from './components/layout/PlayerBar';
import type { TrackRecord, PlaylistRecord, RepeatMode } from '../shared/types';
import {
  HomeView,
  SearchView,
  BrowseView,
  LibraryView,
  PlaylistView,
  AlbumView,
  ArtistView,
  LikedSongsView,
  QueueView,
  SettingsView,
  LyricsView,
  MOCK_TRACKS,
  MOCK_PLAYLISTS,
  MOCK_ALBUMS,
  MOCK_ARTISTS,
  BrowseCategory,
} from './views';
import {
  CreatePlaylistModal,
  EditPlaylistModal,
  TrackContextMenu,
  SongCreditsModal,
} from './components/modals';
import { getAudioEngine } from './services/AudioEngineService';

export const App: React.FC = () => {
  // 1. Navigation & History State
  const [history, setHistory] = useState<string[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const currentView = history[historyIndex] || 'home';
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const navigateTo = useCallback(
    (view: string) => {
      if (view === currentView) return;
      const updated = [...history.slice(0, historyIndex + 1), view];
      setHistory(updated);
      setHistoryIndex(updated.length - 1);
    },
    [history, historyIndex, currentView]
  );

  const handleGoBack = useCallback(() => {
    if (canGoBack) setHistoryIndex((i) => i - 1);
  }, [canGoBack]);

  const handleGoForward = useCallback(() => {
    if (canGoForward) setHistoryIndex((i) => i + 1);
  }, [canGoForward]);

  // 2. Layout State
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'nowPlaying' | 'queue'>('nowPlaying');

  // 3. Modals & Context Menu State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [creditsTrack, setCreditsTrack] = useState<TrackRecord | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<PlaylistRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTimer, setToastTimer] = useState<any>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    setToastMessage(msg);
    const id = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    setToastTimer(id);
  }, [toastTimer]);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    track: TrackRecord | null;
    playlistId?: string;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    track: null,
  });

  // Configurable Settings State
  const [settings, setSettings] = useState<Record<string, any>>({
    normalizeVolume: true,
    volumeLevel: 'Normal',
    compactLibrary: false,
    showLocalFiles: true,
    showNowPlayingOnPlay: false,
    crossfadeEnabled: false,
    crossfadeSeconds: 0,
    monoAudio: false,
    equalizerEnabled: false,
    equalizerPreset: 'Flat',
    equalizerBands: { '60Hz': 0, '150Hz': 0, '400Hz': 0, '1kHz': 0, '2.4kHz': 0, '15kHz': 0 },
    autoplay: true,
    privateSession: false,
  });

  const handleUpdateSetting = useCallback(
    (key: string, value: any) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      const engine = getAudioEngine();
      if (key === 'normalizeVolume' || key === 'volumeLevel') {
        const norm = key === 'normalizeVolume' ? value : settings.normalizeVolume;
        const lvl = key === 'volumeLevel' ? value : settings.volumeLevel;
        engine.setVolumeNormalization(norm, lvl);
      } else if (key === 'monoAudio') {
        engine.setMonoAudio(value);
      } else if (key === 'crossfadeSeconds') {
        engine.setCrossfade(value);
      } else if (key === 'autoplay') {
        engine.setAutoplay(value);
      } else if (key === 'equalizerEnabled' || key === 'equalizerPreset' || key === 'equalizerBands') {
        const enabled = key === 'equalizerEnabled' ? value : settings.equalizerEnabled;
        const preset = key === 'equalizerPreset' ? value : settings.equalizerPreset;
        const bands = key === 'equalizerBands' ? value : settings.equalizerBands;
        engine.setEqualizer(enabled, preset, bands);
      }
    },
    [settings]
  );

  // 4. Data State (Catalog, Playlists, Liked Songs, Queues)
  const [catalog, setCatalog] = useState<TrackRecord[]>(MOCK_TRACKS);
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>(MOCK_PLAYLISTS);
  const [userQueue, setUserQueue] = useState<TrackRecord[]>([]);
  const [contextQueue, setContextQueue] = useState<TrackRecord[]>([]);
  const [contextName, setContextName] = useState<string>("Today's Top Hits");

  // 5. Playback State
  const [currentTrack, setCurrentTrack] = useState<TrackRecord | null>(MOCK_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(MOCK_TRACKS[0].durationMs / 1000);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('OFF');
  const [likedSongsCount, setLikedSongsCount] = useState(
    () => MOCK_TRACKS.filter((t) => t.isLiked).length
  );

  // 6. IPC Synchronization
  useEffect(() => {
    if (window.electronAPI?.dbGetCatalogTracks) {
      window.electronAPI
        .dbGetCatalogTracks()
        .then((tracks) => {
          if (tracks && tracks.length > 0) {
            setCatalog(tracks);
            if (!currentTrack) {
              setCurrentTrack(tracks[0]);
              setDuration(tracks[0].durationMs / 1000);
            }
          }
        })
        .catch(() => {});
    }

    if (window.electronAPI?.dbGetPlaylists) {
      window.electronAPI
        .dbGetPlaylists()
        .then((records) => {
          if (records && records.length > 0) {
            setPlaylists(records);
          }
        })
        .catch(() => {});
    }

    if (window.electronAPI?.dbGetLikedSongs) {
      window.electronAPI
        .dbGetLikedSongs()
        .then((liked) => {
          if (liked) setLikedSongsCount(liked.length);
        })
        .catch(() => {});
    }

    if (window.electronAPI?.dbGetSettings) {
      window.electronAPI
        .dbGetSettings()
        .then((saved) => {
          if (saved && Object.keys(saved).length > 0) {
            setSettings((prev) => ({ ...prev, ...saved }));
            const engine = getAudioEngine();
            const norm = saved.normalizeVolume ?? saved['playback.normalization'] ?? true;
            const lvl = saved.volumeLevel ?? 'Normal';
            engine.setVolumeNormalization(norm, lvl);
            if (saved.monoAudio !== undefined) engine.setMonoAudio(saved.monoAudio);
            if (saved.crossfadeSeconds !== undefined || saved['playback.crossfadeSec'] !== undefined) {
              engine.setCrossfade(saved.crossfadeSeconds ?? saved['playback.crossfadeSec']);
            }
            if (saved.autoplay !== undefined) engine.setAutoplay(saved.autoplay);
            if (saved.equalizerEnabled !== undefined) {
              let bands = saved.equalizerBands;
              if (typeof bands === 'string') {
                try {
                  bands = JSON.parse(bands);
                } catch {}
              }
              engine.setEqualizer(saved.equalizerEnabled, saved.equalizerPreset || 'Flat', bands);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  // Ref hooks for real-time engine callbacks
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const catalogRef = useRef(catalog);
  useEffect(() => {
    catalogRef.current = catalog;
  }, [catalog]);

  const playTrackRef = useRef<(track: TrackRecord, queueContext?: TrackRecord[], newContextName?: string) => void>();

  // Real-time Audio Engine Synchronization
  useEffect(() => {
    const engine = getAudioEngine();
    const unsub = engine.onStateChange((state) => {
      setIsPlaying(state === 'PLAYING');
      if (state === 'ENDED' && settingsRef.current.autoplay) {
        const pool = catalogRef.current;
        if (pool && pool.length > 0) {
          const randomTrack = pool[Math.floor(Math.random() * pool.length)];
          playTrackRef.current?.(randomTrack, pool, 'Autoplay Radio');
        }
      }
    });

    const interval = setInterval(() => {
      if (engine.playbackState === 'PLAYING') {
        setCurrentTime(engine.currentTimeMs / 1000);
        if (engine.currentTrack) {
          setCurrentTrack((prev) => {
            if (!prev || prev.id !== engine.currentTrack!.id) {
              setDuration(engine.durationMs / 1000);
              return engine.currentTrack;
            }
            return prev;
          });
        }
      }
    }, 150);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // 7. Track Playback Controls
  const handleTogglePlay = useCallback(() => {
    const engine = getAudioEngine();
    if (isPlaying) {
      engine.pause();
      setIsPlaying(false);
    } else {
      if (!engine.currentTrack && currentTrack) {
        engine.loadTrack(currentTrack, catalog).catch(() => {});
      } else {
        engine.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  }, [isPlaying, currentTrack, catalog]);

  const handlePlayTrack = useCallback(
    (track: TrackRecord, queueContext?: TrackRecord[], newContextName?: string) => {
      setCurrentTrack(track);
      setDuration(track.durationMs / 1000);
      setCurrentTime(0);
      setIsPlaying(true);

      if (settings.showNowPlayingOnPlay) {
        setIsRightPanelOpen(true);
        setRightPanelTab('nowPlaying');
      }

      if (newContextName) {
        setContextName(newContextName);
      }

      if (queueContext && queueContext.length > 0) {
        const idx = queueContext.findIndex((t) => t.id === track.id);
        if (idx !== -1) {
          setContextQueue(queueContext.slice(idx + 1));
        } else {
          setContextQueue(queueContext.filter((t) => t.id !== track.id));
        }
      }

      const engine = getAudioEngine();
      engine.loadTrack(track, queueContext || catalog).catch(() => {});
    },
    [catalog, settings.showNowPlayingOnPlay]
  );
  playTrackRef.current = handlePlayTrack;

  const handleNext = useCallback(async () => {
    const engine = getAudioEngine();
    await engine.next();
    if (engine.currentTrack) {
      setCurrentTrack(engine.currentTrack);
      setDuration(engine.durationMs / 1000);
      setCurrentTime(engine.currentTimeMs / 1000);
      setIsPlaying(engine.playbackState === 'PLAYING');
    }
  }, []);

  const handlePrevious = useCallback(async () => {
    const engine = getAudioEngine();
    await engine.previous();
    if (engine.currentTrack) {
      setCurrentTrack(engine.currentTrack);
      setDuration(engine.durationMs / 1000);
      setCurrentTime(engine.currentTimeMs / 1000);
      setIsPlaying(engine.playbackState === 'PLAYING');
    }
  }, []);

  // 8. Like / Unlike Toggle
  const handleToggleLike = useCallback(
    async (trackToToggle?: TrackRecord) => {
      const target = trackToToggle || currentTrack;
      if (!target) return;
      const nextLiked = !target.isLiked;

      if (window.electronAPI?.dbToggleLikeSong) {
        try {
          await window.electronAPI.dbToggleLikeSong(target.id);
        } catch (err) {
          console.error('Failed to toggle like in database:', err);
        }
      }

      // Update in catalog
      setCatalog((prev) =>
        prev.map((t) => (t.id === target.id ? { ...t, isLiked: nextLiked } : t))
      );

      // Update currentTrack
      if (currentTrack && currentTrack.id === target.id) {
        setCurrentTrack((prev) => (prev ? { ...prev, isLiked: nextLiked } : null));
      }

      // Update likedSongsCount
      setLikedSongsCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));
      showToast(nextLiked ? 'Added to Liked Songs' : 'Removed from Liked Songs');
    },
    [currentTrack, showToast]
  );

  // 9. Playlist CRUD Handlers
  const handleCreatePlaylist = async (
    name: string,
    description?: string,
    coverImage?: string
  ) => {
    let createdId = `pl_${Date.now()}`;
    if (window.electronAPI?.dbCreatePlaylist) {
      try {
        const rec = await window.electronAPI.dbCreatePlaylist(name, description, coverImage);
        if (rec?.id) createdId = rec.id;
      } catch (err) {
        console.error('Failed to create playlist in database:', err);
      }
    }

    const newRecord: PlaylistRecord = {
      id: createdId,
      name,
      description,
      coverImage,
      trackCount: 0,
      createdAt: new Date().toISOString(),
    };

    setPlaylists((prev) => [newRecord, ...prev]);
    navigateTo(`playlist:${createdId}`);
  };

  const handleUpdatePlaylist = async (
    id: string,
    name: string,
    description?: string,
    coverImage?: string
  ) => {
    if (window.electronAPI?.dbUpdatePlaylist) {
      try {
        await window.electronAPI.dbUpdatePlaylist(id, name, description, coverImage);
      } catch (err) {
        console.error('Failed to update playlist in database:', err);
      }
    }

    setPlaylists((prev) =>
      prev.map((pl) => (pl.id === id ? { ...pl, name, description, coverImage } : pl))
    );
  };

  const handleDeletePlaylist = async (id: string) => {
    if (window.electronAPI?.dbDeletePlaylist) {
      try {
        await window.electronAPI.dbDeletePlaylist(id);
      } catch (err) {
        console.error('Failed to delete playlist from database:', err);
      }
    }

    setPlaylists((prev) => prev.filter((pl) => pl.id !== id));
    navigateTo('library');
  };

  const handleAddTrackToPlaylist = async (
    playlistId: string,
    trackId: string,
    playlistName?: string
  ) => {
    if (window.electronAPI?.dbAddTrackToPlaylist) {
      try {
        await window.electronAPI.dbAddTrackToPlaylist(playlistId, trackId);
      } catch (err) {
        console.error('Failed to add track to playlist:', err);
      }
    }

    setPlaylists((prev) =>
      prev.map((pl) =>
        pl.id === playlistId ? { ...pl, trackCount: (pl.trackCount ?? 0) + 1 } : pl
      )
    );
    const targetName =
      playlistName || playlists.find((p) => p.id === playlistId)?.name || 'Playlist';
    showToast(`Added to ${targetName}`);
  };

  const handleRemoveTrackFromPlaylist = async (
    playlistId: string,
    trackId: string,
    playlistName?: string
  ) => {
    if (window.electronAPI?.dbRemoveTrackFromPlaylist) {
      try {
        await window.electronAPI.dbRemoveTrackFromPlaylist(playlistId, trackId);
      } catch (err) {
        console.error('Failed to remove track from playlist:', err);
      }
    }

    setPlaylists((prev) =>
      prev.map((pl) =>
        pl.id === playlistId ? { ...pl, trackCount: Math.max(0, (pl.trackCount ?? 1) - 1) } : pl
      )
    );
    const targetName =
      playlistName || playlists.find((p) => p.id === playlistId)?.name || 'Playlist';
    showToast(`Removed from ${targetName}`);
  };

  const handleCreatePlaylistWithTrack = async (track: TrackRecord) => {
    const defaultName = `My Playlist #${playlists.length + 1}`;
    let createdId = `pl_${Date.now()}`;
    if (window.electronAPI?.dbCreatePlaylist) {
      try {
        const rec = await window.electronAPI.dbCreatePlaylist(defaultName);
        if (rec?.id) createdId = rec.id;
      } catch (err) {
        console.error('Failed to create playlist in database:', err);
      }
    }

    const newRecord: PlaylistRecord = {
      id: createdId,
      name: defaultName,
      trackCount: 1,
      createdAt: new Date().toISOString(),
    };

    setPlaylists((prev) => [newRecord, ...prev]);

    if (window.electronAPI?.dbAddTrackToPlaylist) {
      try {
        await window.electronAPI.dbAddTrackToPlaylist(createdId, track.id);
      } catch {}
    }

    showToast(`Added to ${defaultName}`);
    navigateTo(`playlist:${createdId}`);
  };

  // 10. Context Menu Handler
  const handleOpenContextMenu = (
    e: React.MouseEvent,
    track: TrackRecord,
    playlistId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      track,
      playlistId,
    });
  };

  // 11. Load Local Audio File (.mp3/.wav) Handler
  const handleLoadLocalAudio = useCallback(
    (file: File) => {
      const objectUrl = URL.createObjectURL(file);
      const rawName = file.name.replace(/\.[^/.]+$/, '');
      let artist = 'Local Artist';
      let title = rawName;
      if (rawName.includes(' - ')) {
        const parts = rawName.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      const newTrack: TrackRecord = {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title,
        artist,
        album: 'Local Files',
        durationMs: 200000,
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop',
        audioUrl: objectUrl,
        genre: 'Local Audio',
        releaseYear: 2026,
        trackNumber: 1,
        addedAt: 'Just now',
        isLiked: false,
      };

      if (typeof Audio !== 'undefined') {
        const probe = new Audio(objectUrl);
        probe.addEventListener('loadedmetadata', () => {
          if (probe.duration && isFinite(probe.duration)) {
            const probeDurMs = Math.round(probe.duration * 1000);
            newTrack.durationMs = probeDurMs;
            setDuration(probe.duration);
            const engine = getAudioEngine();
            if (engine.currentTrack?.id === newTrack.id) {
              engine.durationMs = probeDurMs;
            }
          }
        });
      }

      setCatalog((prev) => [newTrack, ...prev]);
      handlePlayTrack(newTrack, [newTrack, ...catalog], 'Local Files');
    },
    [catalog, handlePlayTrack]
  );

  // 12. Ambient Hero Accent Color Computation
  const getHeroAccentColor = (view: string): string => {
    const [prefix, id] = view.split(':');
    switch (prefix) {
      case 'home':
        return '#1db954';
      case 'search':
        return '#7358ff';
      case 'browse':
        return '#e1118c';
      case 'library':
        return '#006450';
      case 'liked':
        return '#450af5';
      case 'queue':
        return '#1e3264';
      case 'lyrics':
        return '#8a1f64';
      case 'settings':
        return '#282828';
      case 'playlist': {
        if (id === 'pl_top_hits') return '#1ed760';
        if (id === 'pl_discover') return '#7358ff';
        if (id === 'pl_chill') return '#e1118c';
        if (id === 'pl_synth') return '#00F5A0';
        return '#e1118c';
      }
      case 'album': {
        if (id === 'alb_after_hours') return '#b91d47';
        if (id === 'alb_starboy') return '#7358ff';
        if (id === 'alb_hurry_up') return '#e8115b';
        if (id === 'alb_neon') return '#e8115b';
        if (id === 'alb_horizon') return '#d84000';
        if (id === 'alb_astro') return '#8d67ab';
        return '#bc5900';
      }
      case 'artist': {
        if (id === 'art_weeknd') return '#e1118c';
        if (id === 'art_synth') return '#e8115b';
        if (id === 'art_vector') return '#006450';
        if (id === 'art_echo') return '#7358ff';
        return '#1db954';
      }
      default:
        return '#1db954';
    }
  };

  // 12. Active View Matching & Routing
  const renderCurrentView = () => {
    const [prefix, id] = currentView.split(':');

    switch (prefix) {
      case 'home':
        return (
          <HomeView
            catalog={catalog}
            playlists={playlists}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onNavigate={navigateTo}
            onOpenContextMenu={handleOpenContextMenu}
          />
        );

      case 'search':
        return (
          <SearchView
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            catalog={catalog}
            playlists={playlists}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onToggleLike={handleToggleLike}
            onOpenContextMenu={handleOpenContextMenu}
            onNavigate={navigateTo}
          />
        );

      case 'browse':
        return (
          <BrowseView
            onSelectCategory={(cat: BrowseCategory) => {
              setSearchQuery(cat.title);
              navigateTo('search');
            }}
            onNavigate={navigateTo}
          />
        );

      case 'library':
        return (
          <LibraryView
            playlists={playlists}
            likedSongsCount={likedSongsCount}
            onCreatePlaylist={() => setIsCreateModalOpen(true)}
            onNavigate={navigateTo}
            onLoadLocalAudio={handleLoadLocalAudio}
          />
        );

      case 'lyrics':
        return (
          <LyricsView
            currentTrack={currentTrack}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onSeek={(seconds) => {
              getAudioEngine().seek(seconds);
              setCurrentTime(seconds);
            }}
            onTogglePlay={handleTogglePlay}
            onNavigate={navigateTo}
          />
        );

      case 'playlist': {
        const selectedPlaylist =
          playlists.find((pl) => pl.id === id) ||
          MOCK_PLAYLISTS.find((pl) => pl.id === id) ||
          null;

        return (
          <PlaylistView
            playlist={selectedPlaylist}
            tracks={catalog}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={(track, queue) =>
              handlePlayTrack(track, queue, selectedPlaylist?.name || 'Playlist')
            }
            onTogglePlay={handleTogglePlay}
            onToggleLike={handleToggleLike}
            onOpenContextMenu={(e, track) => handleOpenContextMenu(e, track, id)}
            onEditPlaylist={(pl) => {
              setEditingPlaylist(pl);
              setIsEditModalOpen(true);
            }}
            onNavigate={navigateTo}
          />
        );
      }

      case 'album':
        return (
          <AlbumView
            albumId={id || 'alb_neon'}
            catalog={catalog}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={(track, queue) => handlePlayTrack(track, queue, track.album)}
            onTogglePlay={handleTogglePlay}
            onToggleLike={handleToggleLike}
            onOpenContextMenu={handleOpenContextMenu}
            onNavigate={navigateTo}
          />
        );

      case 'artist':
        return (
          <ArtistView
            artistId={id || 'art_synth'}
            catalog={catalog}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={(track, queue) => handlePlayTrack(track, queue, track.artist)}
            onTogglePlay={handleTogglePlay}
            onToggleLike={handleToggleLike}
            onOpenContextMenu={handleOpenContextMenu}
            onNavigate={navigateTo}
          />
        );

      case 'liked':
        return (
          <LikedSongsView
            likedTracks={catalog.filter((t) => t.isLiked)}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={(track, queue) => handlePlayTrack(track, queue, 'Liked Songs')}
            onTogglePlay={handleTogglePlay}
            onToggleLike={handleToggleLike}
            onOpenContextMenu={handleOpenContextMenu}
            onNavigate={navigateTo}
          />
        );

      case 'queue':
        return (
          <QueueView
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            userQueue={userQueue}
            contextQueue={contextQueue}
            contextName={contextName}
            onPlayTrack={handlePlayTrack}
            onRemoveFromUserQueue={(idx) =>
              setUserQueue((prev) => prev.filter((_, i) => i !== idx))
            }
            onClearUserQueue={() => setUserQueue([])}
            onToggleLike={handleToggleLike}
            onOpenContextMenu={handleOpenContextMenu}
            onNavigate={navigateTo}
          />
        );

      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onUpdateSetting={handleUpdateSetting}
            onShowToast={showToast}
          />
        );

      default:
        return (
          <HomeView
            catalog={catalog}
            playlists={playlists}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayTrack}
            onNavigate={navigateTo}
            onOpenContextMenu={handleOpenContextMenu}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white select-none overflow-hidden font-sans">
      {/* 1. Frameless Top Header Bar */}
      <TopBar
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (currentView !== 'search') navigateTo('search');
        }}
        onSearchFocus={() => {
          if (currentView !== 'search') navigateTo('search');
        }}
        onBrandClick={() => navigateTo('home')}
        onProfileClick={() => navigateTo('settings')}
        onNotificationsClick={() => navigateTo('browse')}
        isPrivateSession={settings.privateSession}
      />

      {/* 2. Middle 3-Panel Workspace */}
      <div className="flex flex-1 min-h-0 px-2 pb-2 gap-2 overflow-hidden mb-[72px]">
        {/* Left Sidebar: "Your Library" */}
        <Sidebar
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          activePlaylistId={currentView}
          onSelectPlaylist={(plId) => navigateTo(`playlist:${plId}`)}
          onSelectLikedSongs={() => navigateTo('liked')}
          onCreatePlaylist={() => setIsCreateModalOpen(true)}
          likedSongsCount={likedSongsCount}
          onLoadLocalAudio={handleLoadLocalAudio}
          useCompactLibrary={settings.compactLibrary}
          showLocalFiles={settings.showLocalFiles}
        />

        {/* Center Main Scrollable Canvas */}
        <MainCanvas heroAccentColor={getHeroAccentColor(currentView)}>
          {renderCurrentView()}
        </MainCanvas>

        {/* Collapsible Right Panel */}
        {isRightPanelOpen && (
          <RightPanel
            isOpen={isRightPanelOpen}
            activeTab={rightPanelTab}
            onClose={() => setIsRightPanelOpen(false)}
            onTabChange={setRightPanelTab}
            currentTrack={currentTrack}
            onOpenLyrics={() => navigateTo('lyrics')}
          />
        )}
      </div>

      {/* 3. Bottom Sticky Player Bar (72px) */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrevious={handlePrevious}
        currentTime={currentTime}
        duration={duration}
        onSeek={(seconds) => {
          getAudioEngine().seek(seconds);
          setCurrentTime(seconds);
        }}
        volume={volume}
        onVolumeChange={(newVol) => {
          getAudioEngine().setVolume(newVol);
          setVolume(newVol);
        }}
        isMuted={isMuted}
        onToggleMute={() => {
          const engine = getAudioEngine();
          engine.toggleMute();
          setIsMuted(engine.isMuted);
          setVolume(engine.volume);
        }}
        isShuffle={isShuffle}
        onToggleShuffle={() => {
          const engine = getAudioEngine();
          const next = !isShuffle;
          engine.setShuffle(next);
          setIsShuffle(next);
        }}
        repeatMode={repeatMode}
        onCycleRepeat={() => {
          const engine = getAudioEngine();
          const next = engine.cycleRepeat();
          setRepeatMode(next);
        }}
        isLiked={currentTrack?.isLiked}
        onToggleLike={() => handleToggleLike()}
        onToggleQueue={() => navigateTo('queue')}
        onToggleRightPanel={(tab) => {
          if (isRightPanelOpen && rightPanelTab === tab) {
            setIsRightPanelOpen(false);
          } else {
            setRightPanelTab(tab);
            setIsRightPanelOpen(true);
          }
        }}
        isRightPanelOpen={isRightPanelOpen}
        activeRightPanelTab={rightPanelTab}
        onToggleLyrics={() => {
          if (currentView === 'lyrics') {
            handleGoBack();
          } else {
            navigateTo('lyrics');
          }
        }}
        isLyricsActive={currentView === 'lyrics'}
      />

      {/* 4. Interactive Modals & Context Menus */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreatePlaylist}
      />

      <EditPlaylistModal
        isOpen={isEditModalOpen}
        playlist={editingPlaylist}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPlaylist(null);
        }}
        onSave={handleUpdatePlaylist}
        onDelete={handleDeletePlaylist}
      />

      <SongCreditsModal
        isOpen={isCreditsModalOpen}
        track={creditsTrack}
        onClose={() => setIsCreditsModalOpen(false)}
      />

      <TrackContextMenu
        isOpen={contextMenu.isOpen}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        track={contextMenu.track}
        playlists={playlists}
        currentPlaylistId={contextMenu.playlistId}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        onAddToQueue={(track) => {
          setUserQueue((prev) => [...prev, track]);
          getAudioEngine().addToQueue(track);
        }}
        onAddToPlaylist={handleAddTrackToPlaylist}
        onCreatePlaylistWithTrack={handleCreatePlaylistWithTrack}
        onRemoveFromPlaylist={handleRemoveTrackFromPlaylist}
        onViewCredits={(track) => {
          setCreditsTrack(track);
          setIsCreditsModalOpen(true);
        }}
        onToggleLike={handleToggleLike}
        onNavigate={navigateTo}
        onShowToast={showToast}
      />

      {/* 5. Spotify-Style Floating Bottom Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#2e77d0] text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
