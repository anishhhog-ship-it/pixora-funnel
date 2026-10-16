export function getPublicFunnelUrl(slug: string): string {
  if (typeof window === 'undefined') return `/f/${encodeURIComponent(slug)}`;
  return new URL(`/f/${encodeURIComponent(slug)}`, window.location.origin).toString();
}

export function createSalesIdempotencyKey(prospectId?: string | null, demoId?: string | null): string {
  const pKey = prospectId || 'direct';
  const storageKey = `sales-conv:${pKey}:${demoId || 'none'}`;
  if (typeof window === 'undefined') return `sales-conv:${pKey.slice(0, 8)}:${Date.now()}`;
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing) return existing;
  const value = `sales-conv:${pKey.slice(0, 8)}:${demoId ? demoId.slice(0, 8) : 'none'}:${crypto.randomUUID()}`;
  window.sessionStorage.setItem(storageKey, value);
  return value;
}

export function clearSalesIdempotencyKey(prospectId?: string | null, demoId?: string | null): void {
  if (typeof window === 'undefined') return;
  const pKey = prospectId || 'direct';
  const storageKey = `sales-conv:${pKey}:${demoId || 'none'}`;
  const legacyStorageKey = `sales-conversion:${pKey}:${demoId || 'none'}`;
  window.sessionStorage.removeItem(storageKey);
  window.sessionStorage.removeItem(legacyStorageKey);
}

export function isWebNfcAvailable(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext && /Android/i.test(navigator.userAgent) && 'NDEFReader' in window;
}

export async function writeFunnelToNfc(url: string): Promise<void> {
  if (!isWebNfcAvailable()) throw new Error('Web NFC is unavailable. Use NFC Tools or copy the URL to write this tag.');
  const Reader = (window as Window & { NDEFReader?: new () => { write: (message: { records: Array<{ recordType: string; data: string }> }) => Promise<void> } }).NDEFReader;
  if (!Reader) throw new Error('Web NFC is unavailable on this device.');
  const reader = new Reader();
  await reader.write({ records: [{ recordType: 'url', data: url }] });
}
