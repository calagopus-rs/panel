import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getUserActivity from '@/api/me/getUserActivity';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton';
import Code from '@/elements/Code';
import TextInput from '@/elements/input/TextInput';
import Spinner from '@/elements/Spinner';
import Table, { TableData, TableRow } from '@/elements/Table';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default function DashboardActivity() {
  const [activities, setActivities] = useState<ResponseMeta<UserActivity>>();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getUserActivity,
    setStoreData: setActivities,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Activity
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={['Actor', 'Event', 'IP', 'When', '']} pagination={activities} onPageSelect={setPage}>
          {activities.data.map((activity) => (
            <TableRow key={activity.created.toString()}>
              <TableData>{activity.isApi ? 'API' : 'Web'}</TableData>

              <TableData>
                <Code>{activity.event}</Code>
              </TableData>

              <TableData>
                <Code>{activity.ip}</Code>
              </TableData>

              <TableData>
                <Tooltip label={formatDateTime(activity.created)}>{formatTimestamp(activity.created)}</Tooltip>
              </TableData>

              <TableData>
                <Group gap={4} justify={'right'} wrap={'nowrap'}>
                  {Object.keys(activity.data).length > 0 ? <ActivityInfoButton activity={activity} /> : null}
                </Group>
              </TableData>
            </TableRow>
          ))}
        </Table>
      )}
    </>
  );
}
