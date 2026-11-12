export const LIFESIZE_NET_MARGIN = 0.6;
export const MAX_LIFESIZE_UNIT_COST = 39_999_999.99;

export function priceForLifesizeMargin(unitCost: number): number {
  if (!Number.isFinite(unitCost) || unitCost <= 0 || unitCost > MAX_LIFESIZE_UNIT_COST) {
    throw new RangeError("Life-size statue cost is outside the supported range.");
  }

  return Math.round((unitCost / (1 - LIFESIZE_NET_MARGIN)) * 100) / 100;
}
