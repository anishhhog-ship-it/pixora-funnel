export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatRelativeDate(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  const days = Math.floor((Date.now() - parsed.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(value);
}

export function formatEventLabel(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function initials(value: string | null | undefined): string {
  const parts = (value || '?').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
}
