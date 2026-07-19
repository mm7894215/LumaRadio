import { describe, expect, it } from 'vitest';
import { spectrumBands } from '../src/engines/audio/spectrum';
import { parseLrc, parseYrc } from '../src/engines/lyrics/lrc-parser';
import { particlePreset } from '../src/engines/particles/presets';
import { renderLoadTier, renderPixelRatio } from '../src/engines/scene/render-quality';

describe('lyrics engine', () => {
  it('parses repeated LRC timestamps and infers bounded durations', () => {
    const lines = parseLrc('[00:01.50][00:03.00]Hello\n[00:05.00]World');
    expect(lines.map((line) => [line.t, line.text])).toEqual([[1.5, 'Hello'], [3, 'Hello'], [5, 'World']]);
    expect(lines[0]?.duration).toBe(1.5);
    expect(lines[2]?.duration).toBe(4.8);
  });

  it('parses word-level YRC timing', () => {
    const [line] = parseYrc('[1000,2000](1000,500,0)你(1500,500,0)好');
    expect(line).toMatchObject({ t: 1, duration: 2, text: '你好', source: 'yrc-word' });
    expect(line?.words).toHaveLength(2);
  });
});

describe('audio and visual engines', () => {
  it('extracts normalized frequency bands', () => {
    const data = new Uint8Array(1024);
    data.fill(255, 2, 8);
    const result = spectrumBands(data, 48_000, 2048);
    expect(result.bass).toBeGreaterThan(0.5);
    expect(result.mid).toBeLessThan(result.bass);
    expect(result.energy).toBeGreaterThan(0);
  });

  it('caps device pixel ratio by GPU pixel budget', () => {
    expect(renderPixelRatio({ width: 3840, height: 2160, devicePixelRatio: 2 })).toBeCloseTo(0.792, 2);
    expect(renderLoadTier(3840, 2160, 1)).toBe('huge');
  });

  it('bounds particle preset selection', () => {
    expect(particlePreset(-4)).toBe('silk');
    expect(particlePreset(6)).toBe('skull');
    expect(particlePreset(99)).toBe('skull');
  });
});
