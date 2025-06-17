export function formatTimestamp(timestamp) {
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
    return target.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  }

  const format = (value, unit) =>
    `${isFuture ? 'in' : ''} ${value} ${unit}${value !== 1 ? 's' : ''}${isFuture ? '' : ' ago'}`;

  if (diffSeconds < 60) return isFuture ? 'in a few seconds' : 'a few seconds ago';
  if (diffMinutes < 60) return format(diffMinutes, 'minute');
  if (diffHours < 24) return format(diffHours, 'hour');
  return format(diffDays, 'day');
}
