/** Fração 0–1 de uso; `null` quando o limite é ilimitado. */
export function usageRatio(used: number, limit: number | null): number | null {
  if (limit === null) return null;
  return Math.min(1, used / limit);
}
