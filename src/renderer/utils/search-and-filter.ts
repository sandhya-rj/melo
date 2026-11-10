import type { TrackRecord } from '../../shared/types';

export const SortOption = {
  TITLE_ASC: 'TITLE_ASC',
  TITLE_DESC: 'TITLE_DESC',
  ARTIST_ASC: 'ARTIST_ASC',
  ARTIST_DESC: 'ARTIST_DESC',
  DURATION_ASC: 'DURATION_ASC',
  DURATION_DESC: 'DURATION_DESC'
} as const;

export type SortOption = typeof SortOption[keyof typeof SortOption];

export function filterTracks(tracks: TrackRecord[], query: string): TrackRecord[] {
  if (!query || query.trim().length === 0) return tracks;
  const q = query.trim().toLowerCase();
  return tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      (t.genre && t.genre.toLowerCase().includes(q))
  );
}

export function sortTracks(tracks: TrackRecord[], option: SortOption): TrackRecord[] {
  const copy = [...tracks];
  switch (option) {
    case 'TITLE_ASC':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'TITLE_DESC':
      return copy.sort((a, b) => b.title.localeCompare(a.title));
    case 'ARTIST_ASC':
      return copy.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
    case 'ARTIST_DESC':
      return copy.sort((a, b) => b.artist.localeCompare(a.artist) || a.title.localeCompare(b.title));
    case 'DURATION_ASC':
      return copy.sort((a, b) => a.durationMs - b.durationMs);
    case 'DURATION_DESC':
      return copy.sort((a, b) => b.durationMs - a.durationMs);
    default:
      return copy;
  }
}
