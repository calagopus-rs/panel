import { Group } from '@mantine/core';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton';
import Code from '@/elements/Code';
import { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';

export const activityTableColumns = ['', 'Actor', 'Event', 'IP', 'When', ''];

export default function ActivityRow({ activity }: { activity: AdminActivity }) {
  return (
    <TableRow>
      <TableData>
        <img
          src={activity.user?.avatar ?? '/icon.svg'}
          alt={activity.user?.username}
          className='h-5 w-5 rounded-full select-none'
        />
      </TableData>

      <TableData>
        {activity.user ? `${activity.user.username} (${activity.isApi ? 'API' : 'Web'})` : 'System'}
      </TableData>

      <TableData>
        <Code>{activity.event}</Code>
      </TableData>

      <TableData>{activity.ip && <Code>{activity.ip}</Code>}</TableData>

      <TableData>
        <Tooltip label={formatDateTime(activity.created)}>{formatTimestamp(activity.created)}</Tooltip>
      </TableData>

      <TableData>
        <Group gap={4} justify='right' wrap='nowrap'>
          {Object.keys(activity.data).length > 0 ? <ActivityInfoButton activity={activity} /> : null}
        </Group>
      </TableData>
    </TableRow>
  );
}
