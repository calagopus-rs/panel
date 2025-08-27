import Badge from '@/elements/Badge';
import ContextMenu from '@/elements/ContextMenu';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useServerStore } from '@/stores/server';
import { faEye, faPencil, faPlay } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router';

export default ({ schedule }: { schedule: ServerSchedule }) => {
  const navigate = useNavigate();
  const server = useServerStore((state) => state.server);
  const navigateUrl = `/server/${server.uuidShort}/schedules/${schedule.uuid}`;

  return (
    <ContextMenu
      items={[
        {
          icon: faEye,
          label: 'View',
          onClick: () => navigate(navigateUrl),
        },
        {
          icon: faPencil,
          label: 'Edit',
          onClick: () => navigate(`${navigateUrl}/edit`),
        },
        {
          icon: faPlay,
          label: 'Run Now',
          onClick: () => alert('Soon'),
        },
      ]}
    >
      {({ openMenu }) => (
        <TableRow
          className={'cursor-pointer'}
          onContextMenu={(e) => {
            e.preventDefault();
            openMenu(e.clientX, e.clientY);
          }}
          onClick={() => navigate(navigateUrl)}
        >
          <TableData>{schedule.name}</TableData>

          <TableData>
            <Tooltip content={schedule.lastRun ? formatDateTime(schedule.lastRun) : 'N/A'}>
              {schedule.lastRun ? formatTimestamp(schedule.lastRun) : 'N/A'}
            </Tooltip>
          </TableData>

          <TableData>
            <Tooltip content={schedule.lastFailure ? formatDateTime(schedule.lastFailure) : 'N/A'}>
              {schedule.lastFailure ? formatTimestamp(schedule.lastFailure) : 'N/A'}
            </Tooltip>
          </TableData>

          <TableData>
            <Badge color={schedule.enabled ? 'green' : 'red'}>{schedule.enabled ? 'Active' : 'Inactive'}</Badge>
          </TableData>

          <ContextMenu.Toggle openMenu={openMenu} />
        </TableRow>
      )}
    </ContextMenu>
  );
};
