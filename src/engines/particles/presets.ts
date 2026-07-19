export const PARTICLE_PRESETS = ['silk', 'tunnel', 'orbit', 'void', 'vinyl', 'wallpaper', 'skull'] as const;
export type ParticlePreset = typeof PARTICLE_PRESETS[number];

export function particlePreset(index: unknown): ParticlePreset {
  const normalized = Math.max(0, Math.min(PARTICLE_PRESETS.length - 1, Math.trunc(Number(index) || 0)));
  return PARTICLE_PRESETS[normalized] ?? 'silk';
}
