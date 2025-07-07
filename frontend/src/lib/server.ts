import CronExpressionParser, { CronDate } from 'cron-parser';

export function getPrimaryAllocation(allocations: ServerAllocation[]) {
  return allocations.find(allocation => allocation.isDefault);
}

export function formatAllocation(allocation?: ServerAllocation) {
  return allocation ? `${allocation.ipAlias || allocation.ip}:${allocation.port}` : 'None';
}

export function toCronExpression(cron: any) {
  return `${cron.minute} ${cron.hour} ${cron.dayOfMonth} ${cron.month} ${cron.dayOfWeek}`;
}

export function getNextCronRun(cron: any): CronDate {
  const interval = CronExpressionParser.parse(toCronExpression(cron));
  return interval.next();
}
