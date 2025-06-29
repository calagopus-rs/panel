import { TableRow } from '@/elements/table/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import CronExpressionParser, { CronDate } from 'cron-parser';
import cronstrue from 'cronstrue';

const ActiveBadge = () => (
  <div className="inline-block rounded bg-green-500 px-2 py-1 text-xs font-bold text-green-100">Active</div>
);

const InactiveBadge = () => (
  <div className="inline-block rounded bg-red-500 px-2 py-1 text-xs font-bold text-red-100">Inactive</div>
);

export default ({ schedule }: { schedule: Schedule }) => {
  const toCronExpression = (cron: CronObject) => {
    return `${cron.minute} ${cron.hour} ${cron.dayOfMonth} ${cron.month} ${cron.dayOfWeek}`;
  };

  const getNextRun = (cron: CronObject): CronDate => {
    const interval = CronExpressionParser.parse(toCronExpression(cron));
    return interval.next();
  };

  return (
    <TableRow>
      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={schedule.name}>
        {schedule.name}
      </td>

      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
        <Tooltip content={toCronExpression(schedule.cron)}>
          {cronstrue.toString(toCronExpression(schedule.cron))}
        </Tooltip>
      </td>

      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
        <Tooltip content={schedule.lastRunAt ? formatDateTime(schedule.lastRunAt) : 'N/A'}>
          {schedule.lastRunAt ? formatTimestamp(schedule.lastRunAt) : 'N/A'}
        </Tooltip>
      </td>

      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
        <Tooltip content={formatDateTime(getNextRun(schedule.cron))}>
          {formatTimestamp(getNextRun(schedule.cron))}
        </Tooltip>
      </td>

      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
        {schedule.isActive ? <ActiveBadge /> : <InactiveBadge />}
      </td>
    </TableRow>
  );
};
