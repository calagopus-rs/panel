import ActivityInfoButton from '@/elements/activity/ActivityInfoButton';
import Code from '@/elements/Code';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { Group } from '@mantine/core';
import { TableData, TableRow } from '@/elements/Table';

export default ({ activity }: { activity: AdminActivity }) => {
  return (
    <TableRow>
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
        <Group gap={4} justify={'right'} wrap={'nowrap'}>
          {Object.keys(activity.data).length > 0 ? <ActivityInfoButton activity={activity} /> : null}
        </Group>
      </TableData>
    </TableRow>
  );
};
