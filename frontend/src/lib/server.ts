import CronExpressionParser, { CronDate } from 'cron-parser';

export function getPrimaryAllocation(allocations: Allocation[]) {
  return allocations.find(allocation => allocation.isDefault);
}

export function formatAllocation(allocation: Allocation) {
  return `${allocation.alias || allocation.ip}:${allocation.port}`;
}

export function toCronExpression(cron: CronObject) {
  return `${cron.minute} ${cron.hour} ${cron.dayOfMonth} ${cron.month} ${cron.dayOfWeek}`;
}

export function getNextCronRun(cron: CronObject): CronDate {
  const interval = CronExpressionParser.parse(toCronExpression(cron));
  return interval.next();
}
