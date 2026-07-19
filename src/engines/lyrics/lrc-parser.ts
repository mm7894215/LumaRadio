export interface LyricWord { text: string; t: number; d: number; c0: number; c1: number }
export interface LyricLine {
  t: number;
  text: string;
  duration: number;
  charCount: number;
  source: 'lrc' | 'yrc-line' | 'yrc-word';
  words?: LyricWord[];
}

function timeToSeconds(min: string, sec: string, fraction?: string): number {
  const whole = (Number.parseInt(min, 10) || 0) * 60 + (Number.parseInt(sec, 10) || 0);
  return fraction ? whole + (Number.parseInt(fraction, 10) || 0) / 10 ** Math.min(3, fraction.length) : whole;
}

export function finalizeDurations(lines: LyricLine[]): LyricLine[] {
  lines.sort((a, b) => a.t - b.t);
  return lines.map((line, index) => {
    const next = lines[index + 1];
    const inferred = next && next.t > line.t ? next.t - line.t : 4.8;
    const duration = Number.isFinite(line.duration) && line.duration > 0 ? line.duration : inferred;
    return { ...line, duration: Math.max(0.45, Math.min(12, duration)), charCount: Math.max(1, line.charCount || line.text.length) };
  });
}

export function parseLrc(text: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const tag = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;
  for (const rawLine of String(text ?? '').split(/\r?\n/)) {
    const times: number[] = [];
    tag.lastIndex = 0;
    for (let match = tag.exec(rawLine); match; match = tag.exec(rawLine)) {
      times.push(timeToSeconds(match[1] ?? '0', match[2] ?? '0', match[3]));
    }
    const value = rawLine.replace(tag, '').trim();
    if (!value) continue;
    for (const t of times) lines.push({ t, text: value, duration: 0, charCount: value.length, source: 'lrc' });
  }
  return finalizeDurations(lines);
}

export function parseYrc(text: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const rawLine of String(text ?? '').split(/\r?\n/)) {
    const lineMatch = rawLine.match(/^\[(\d+),(\d+)\](.*)$/);
    if (!lineMatch) continue;
    const startMs = Number.parseInt(lineMatch[1] ?? '0', 10) || 0;
    const durationMs = Number.parseInt(lineMatch[2] ?? '0', 10) || 0;
    const body = lineMatch[3] ?? '';
    const words: LyricWord[] = [];
    let fullText = '';
    const wordPattern = /\((\d+),(\d+),\d+\)([^()]*)/g;
    for (let match = wordPattern.exec(body); match; match = wordPattern.exec(body)) {
      const value = (match[3] ?? '').replace(/\s+/g, ' ');
      if (!value) continue;
      const rawStart = Number.parseInt(match[1] ?? '0', 10) || 0;
      const absoluteStart = rawStart >= startMs - 500 ? rawStart : startMs + rawStart;
      const c0 = fullText.length;
      fullText += value;
      words.push({ text: value, t: absoluteStart / 1000, d: Math.max(0.06, (Number.parseInt(match[2] ?? '0', 10) || 0) / 1000), c0, c1: fullText.length });
    }
    if (!fullText) fullText = body.replace(/\(\d+,\d+,\d+\)/g, '').replace(/\s+/g, ' ');
    const leading = fullText.match(/^\s+/)?.[0].length ?? 0;
    fullText = fullText.replace(/\s+/g, ' ').trim();
    if (!fullText) continue;
    const normalizedWords = words
      .map((word) => ({ ...word, c0: Math.max(0, Math.min(fullText.length, word.c0 - leading)), c1: Math.max(0, Math.min(fullText.length, word.c1 - leading)) }))
      .filter((word) => word.c1 > word.c0);
    lines.push({
      t: startMs / 1000,
      duration: durationMs / 1000,
      text: fullText,
      words: normalizedWords,
      charCount: fullText.length,
      source: normalizedWords.length ? 'yrc-word' : 'yrc-line',
    });
  }
  return finalizeDurations(lines);
}
