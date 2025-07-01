import CronExpressionParser, { CronDate } from 'cron-parser';

export function getPrimaryAllocation(allocations: Allocation[]) {
  return allocations.find(allocation => allocation.isDefault);
}

export function formatAllocation(allocation: Allocation) {
  return `${allocation.alias || allocation.ip}:${allocation.port}`;
}

export function formatUptime(uptime: number) {
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

export function toCronExpression(cron: CronObject) {
  return `${cron.minute} ${cron.hour} ${cron.dayOfMonth} ${cron.month} ${cron.dayOfWeek}`;
}

export function getNextCronRun(cron: CronObject): CronDate {
  const interval = CronExpressionParser.parse(toCronExpression(cron));
  return interval.next();
}
