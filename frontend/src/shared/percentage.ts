/** Input is a percentage on the 0–100 scale. Round display only; preserve calculation precision. */
export function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${Number(value.toFixed(2))}%`;
}
