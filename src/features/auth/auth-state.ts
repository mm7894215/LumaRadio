export type AuthProvider = 'netease' | 'qq';

export interface ProviderSession {
  provider: AuthProvider;
  loggedIn: boolean;
  nickname: string;
  userId: string;
  avatar: string;
  vipType: number;
  preview?: boolean;
  stale?: boolean;
  playbackKeyReady?: boolean;
  [key: string]: unknown;
}

export function normalizeQQSession(input: Record<string, unknown> | null | undefined): ProviderSession {
  const loggedIn = input?.loggedIn === true;
  return {
    ...input,
    provider: 'qq',
    loggedIn,
    preview: input?.preview === true,
    nickname: typeof input?.nickname === 'string' && input.nickname ? input.nickname : 'QQ 音乐',
    userId: String(input?.userId ?? input?.uin ?? ''),
    avatar: typeof input?.avatar === 'string' ? input.avatar : '',
    vipType: Number(input?.vipType ?? input?.vip_type ?? 0) || 0,
    stale: input?.stale === true,
    playbackKeyReady: loggedIn && input?.playbackKeyReady === true,
  };
}
