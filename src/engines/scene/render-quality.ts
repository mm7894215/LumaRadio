export interface RenderQualityInput { width: number; height: number; devicePixelRatio: number; pixelBudget?: number; dprCap?: number; dprFloor?: number }

export function renderPixelRatio(input: RenderQualityInput): number {
  const budget = input.pixelBudget ?? 5_200_000;
  const cap = input.dprCap ?? 1.35;
  const floor = input.dprFloor ?? 0.72;
  const viewportPixels = Math.max(1, input.width * input.height);
  const budgetRatio = Math.sqrt(budget / viewportPixels);
  return Math.max(floor, Math.min(cap, input.devicePixelRatio, budgetRatio));
}

export function renderLoadTier(width: number, height: number, pixelRatio: number): 'normal' | 'large' | 'huge' {
  const pixels = width * height * pixelRatio * pixelRatio;
  if (pixels >= 6_200_000) return 'huge';
  if (pixels >= 3_600_000) return 'large';
  return 'normal';
}
