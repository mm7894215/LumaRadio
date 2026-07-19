import { describe, expect, it } from 'vitest';
import { readJson, writeJson, type KeyValueStorage } from '../src/core/storage';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('JSON storage', () => {
  it('round-trips values and falls back on corrupt state', () => {
    const storage = new MemoryStorage();
    expect(writeJson(storage, 'settings', { volume: 0.7 })).toBe(true);
    expect(readJson(storage, 'settings', { volume: 1 })).toEqual({ volume: 0.7 });
    storage.setItem('settings', '{broken');
    expect(readJson(storage, 'settings', { volume: 1 })).toEqual({ volume: 1 });
  });
});
