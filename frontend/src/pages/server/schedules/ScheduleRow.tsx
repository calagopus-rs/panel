import { TableRow } from '@/elements/table/Table';
import Tooltip from '@/elements/Tooltip';
import { getNextCronRun, toCronExpression } from '@/lib/server';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useServerStore } from '@/stores/server';
import cronstrue from 'cronstrue';
import { useNavigate } from 'react-router';

const ActiveBadge = () => (
  <div className="inline-block rounded bg-green-500 px-2 py-1 text-xs font-bold text-green-100">Active</div>
);

const InactiveBadge = () => (
  <div className="inline-block rounded bg-red-500 px-2 py-1 text-xs font-bold text-red-100">Inactive</div>
);

export default ({ schedule }: { schedule: Schedule }) => {
  const navigate = useNavigate();
  const server = useServerStore(state => state.data);

  return (
    <TableRow className="cursor-pointer" onClick={() => navigate(`/server/${server.id}/schedules/${schedule.id}`)}>
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
        <Tooltip content={formatDateTime(getNextCronRun(schedule.cron))}>
          {formatTimestamp(getNextCronRun(schedule.cron))}
        </Tooltip>
      </td>

      <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
        {schedule.isActive ? <ActiveBadge /> : <InactiveBadge />}
      </td>
    </TableRow>
  );
};
