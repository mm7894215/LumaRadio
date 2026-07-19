import { describe, expect, it } from 'vitest';
import { normalizeQQSession } from '../src/features/auth/auth-state';
import { queueItemKey, insertNext } from '../src/features/queue/queue-model';
import { normalizeSearchMode, rememberQuery, searchResultKey } from '../src/features/search/search-domain';

describe('search domain', () => {
  it('normalizes modes and stable request keys', () => {
    expect(normalizeSearchMode('qq')).toBe('qq');
    expect(normalizeSearchMode('invalid')).toBe('song');
    expect(searchResultKey('  夜曲  ', 'netease')).toBe('netease|夜曲');
  });

  it('keeps recent queries unique and bounded', () => {
    expect(rememberQuery(['Halo', 'Yellow', 'Fix You'], ' halo ', 3)).toEqual(['halo', 'Yellow', 'Fix You']);
  });
});

describe('queue model', () => {
  it('creates provider-safe stable keys', () => {
    expect(queueItemKey({ provider: 'qq', mid: '003' })).toBe('qq:003');
    expect(queueItemKey({ type: 'podcast', programId: 42 })).toBe('podcast:42');
    expect(queueItemKey({ localKey: '/music/a.mp3' })).toBe('local:/music/a.mp3');
    expect(queueItemKey({ id: 99 })).toBe('song:99');
  });

  it('moves an existing track directly after the current track without duplicates', () => {
    const a = { id: 1, name: 'A' };
    const b = { id: 2, name: 'B' };
    const c = { id: 3, name: 'C' };
    const result = insertNext([a, b, c], 0, c);
    expect(result.queue.map((track) => track.id)).toEqual([1, 3, 2]);
    expect(result.index).toBe(1);
  });
});

describe('auth state', () => {
  it('normalizes incomplete QQ sessions', () => {
    expect(normalizeQQSession({ loggedIn: true, uin: 123, nickname: 'Rocky', vip_type: '1', playbackKeyReady: true })).toMatchObject({
      provider: 'qq', loggedIn: true, userId: '123', nickname: 'Rocky', vipType: 1, playbackKeyReady: true,
    });
    expect(normalizeQQSession(null)).toMatchObject({ loggedIn: false, nickname: 'QQ 音乐', playbackKeyReady: false });
  });
});
