export type SearchMode = 'song' | 'netease' | 'qq' | 'podcast';

export function normalizeSearchMode(value: unknown): SearchMode {
  return value === 'netease' || value === 'qq' || value === 'podcast' ? value : 'song';
}

export function searchResultKey(query: unknown, mode: SearchMode): string {
  return `${mode}|${String(query ?? '').trim()}`;
}

export function rememberQuery(history: readonly string[], query: unknown, limit = 10): string[] {
  const value = String(query ?? '').trim();
  if (!value) return history.slice(0, limit);
  return [value, ...history.filter((item) => item.toLocaleLowerCase() !== value.toLocaleLowerCase())]
    .slice(0, Math.max(0, limit));
}
