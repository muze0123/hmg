/** Suspension is an inherited restriction, never a replacement for stored progress. */
export function isSuspended(status: string, parentWithdrawn: boolean): boolean {
  return parentWithdrawn && !['completed', 'voided'].includes(status.toLowerCase());
}
export function effectiveTaskStatus(status: string, parentWithdrawn: boolean): string {
  return isSuspended(status, parentWithdrawn) ? 'paused' : status;
}
