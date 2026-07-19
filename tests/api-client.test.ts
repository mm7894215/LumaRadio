import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError } from '../src/core/api-client';

afterEach(() => vi.unstubAllGlobals());

describe('ApiClient', () => {
  it('parses successful JSON responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"ok":true}', { status: 200 })));
    await expect(new ApiClient().json<{ ok: boolean }>('/api/health')).resolves.toEqual({ ok: true });
  });

  it('surfaces HTTP status and server messages', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"message":"登录已过期"}', { status: 401 })));
    await expect(new ApiClient().json('/api/private')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: '登录已过期',
    });
  });

  it('aborts requests after the requested timeout', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, options: RequestInit) => new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })));
    await expect(new ApiClient().json('/api/slow', { timeoutMs: 5 })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
