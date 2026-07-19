export interface QueueTrack {
  id?: string | number;
  provider?: string;
  source?: string;
  type?: string;
  mid?: string;
  songmid?: string;
  programId?: string | number;
  localKey?: string;
  name?: string;
  artist?: string;
  [key: string]: unknown;
}

export function queueItemKey(track?: QueueTrack | null): string {
  if (!track) return '';
  if (track.provider === 'qq' || track.source === 'qq' || track.type === 'qq') {
    return `qq:${track.mid ?? track.songmid ?? track.id ?? `${track.name ?? ''}|${track.artist ?? ''}`}`;
  }
  if (track.type === 'podcast' && track.programId != null) return `podcast:${track.programId}`;
  if (track.localKey) return `local:${track.localKey}`;
  if (track.id != null && track.id !== '') return `song:${track.id}`;
  return `${track.name ?? ''}|${track.artist ?? ''}`;
}

export function insertNext<T extends QueueTrack>(queue: readonly T[], currentIndex: number, track: T): { queue: T[]; index: number } {
  const result = [...queue];
  const key = queueItemKey(track);
  const existing = key ? result.findIndex((item) => queueItemKey(item) === key) : -1;
  if (existing === currentIndex) return { queue: result, index: currentIndex };
  const value = existing >= 0 ? result.splice(existing, 1)[0] ?? track : track;
  const adjustedCurrent = existing >= 0 && existing < currentIndex ? currentIndex - 1 : currentIndex;
  const index = adjustedCurrent >= 0 && adjustedCurrent < result.length ? adjustedCurrent + 1 : result.length;
  result.splice(index, 0, value);
  return { queue: result, index };
}
