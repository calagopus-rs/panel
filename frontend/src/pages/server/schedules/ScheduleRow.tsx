import { TableRow } from '@/elements/table/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useServerStore } from '@/stores/server';
import { useNavigate } from 'react-router';

const ActiveBadge = () => (
  <div className={'inline-block rounded bg-green-500 px-2 py-1 text-xs font-bold text-green-100'}>Active</div>
);

const InactiveBadge = () => (
  <div className={'inline-block rounded bg-red-500 px-2 py-1 text-xs font-bold text-red-100'}>Inactive</div>
);

export default ({ schedule }: { schedule: ServerSchedule }) => {
  const navigate = useNavigate();
  const server = useServerStore((state) => state.server);

  return (
    <TableRow
      className={'cursor-pointer'}
      onClick={() => navigate(`/server/${server.uuidShort}/schedules/${schedule.uuid}`)}
    >
      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'} title={schedule.name}>
        {schedule.name}
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <Tooltip content={schedule.lastRun ? formatDateTime(schedule.lastRun) : 'N/A'}>
          {schedule.lastRun ? formatTimestamp(schedule.lastRun) : 'N/A'}
        </Tooltip>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        <Tooltip content={schedule.lastFailure ? formatDateTime(schedule.lastFailure) : 'N/A'}>
          {schedule.lastFailure ? formatTimestamp(schedule.lastFailure) : 'N/A'}
        </Tooltip>
      </td>

      <td className={'px-6 text-sm text-neutral-200 text-left whitespace-nowrap'}>
        {schedule.enabled ? <ActiveBadge /> : <InactiveBadge />}
      </td>
    </TableRow>
  );
};
