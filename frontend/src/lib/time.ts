export function formatMiliseconds(uptime: number) {
  const uptimeSeconds = Math.floor(uptime / 1000);

  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  if (days === 0 && hours === 0 && minutes === 0) return `${seconds}s`;
  if (days === 0 && hours === 0) return `${minutes}m ${seconds}s`;
  if (days === 0) return `${hours}h ${minutes}m ${seconds}s`;

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export function formatDateTime(timestamp: string | number | Date) {
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

export function formatTimestamp(timestamp: string | number | Date) {
  const now = new Date();
  const target = new Date(timestamp);
  const diffMs = target.getTime() - now.getTime();

  const absDiffMs = Math.abs(diffMs);
  const diffSeconds = Math.floor(absDiffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const isFuture = diffMs > 0;

  // Threshold: switch to date formatting after 7 days
  if (diffDays >= 7) {
    return formatDateTime(timestamp);
  }

  const format = (value: number, unit: string) =>
    `${isFuture ? 'in ' : ''}${value} ${unit}${value !== 1 ? 's' : ''}${isFuture ? '' : ' ago'}`;

  if (diffSeconds < 60) return isFuture ? 'in a few seconds' : 'a few seconds ago';
  if (diffMinutes < 60) return format(diffMinutes, 'minute');
  if (diffHours < 24) return format(diffHours, 'hour');
  return format(diffDays, 'day');
}
