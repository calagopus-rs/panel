import { Group } from '@mantine/core';
import { useState } from 'react';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import getServerActivity from '@/api/server/getServerActivity.ts';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton.tsx';
import Code from '@/elements/Code.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import Table, { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useServerStore } from '@/stores/server.ts';

export default function ServerActivity() {
  const [activities, setActivities] = useState<ResponseMeta<ServerActivity>>(getEmptyPaginationSet());
  const server = useServerStore((state) => state.server);

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getServerActivity(server.uuid, page, search),
    setStoreData: setActivities,
  });

  return (
    <ServerContentContainer title='Activity' search={search} setSearch={setSearch}>
      <Table
        columns={['', 'Actor', 'Event', 'IP', 'When', '']}
        loading={loading}
        pagination={activities}
        onPageSelect={setPage}
      >
        {activities.data.map((activity) => (
          <TableRow key={activity.created.toString()}>
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
                {Object.keys(activity.data ?? {}).length > 0 ? <ActivityInfoButton activity={activity} /> : null}
              </Group>
            </TableData>
          </TableRow>
        ))}
      </Table>
    </ServerContentContainer>
  );
}
