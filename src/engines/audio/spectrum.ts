export interface SpectrumBands { bass: number; mid: number; treble: number; energy: number }

function averageRange(data: Uint8Array, from: number, to: number): number {
  const start = Math.max(0, Math.min(data.length, Math.floor(from)));
  const end = Math.max(start + 1, Math.min(data.length, Math.ceil(to)));
  let sum = 0;
  for (let index = start; index < end; index += 1) sum += data[index] ?? 0;
  return sum / (end - start) / 255;
}

export function spectrumBands(data: Uint8Array, sampleRate: number, fftSize: number): SpectrumBands {
  const bin = sampleRate / fftSize;
  const bass = averageRange(data, 45 / bin, 180 / bin);
  const mid = averageRange(data, 220 / bin, 2_000 / bin);
  const treble = averageRange(data, 2_400 / bin, 12_000 / bin);
  return { bass, mid, treble, energy: bass * 0.5 + mid * 0.32 + treble * 0.18 };
}
