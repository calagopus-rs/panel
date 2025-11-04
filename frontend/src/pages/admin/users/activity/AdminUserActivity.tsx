import { getEmptyPaginationSet } from '@/api/axios';
import { useState } from 'react';
import { Group, Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import Table, { TableData, TableRow } from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import getUserActivity from '@/api/admin/users/getUserActivity';
import Code from '@/elements/Code';
import Tooltip from '@/elements/Tooltip';
import { formatDateTime, formatTimestamp } from '@/lib/time';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton';

export default ({ user }: { user: User }) => {
  const [userActivity, setUserActivity] = useState<ResponseMeta<UserActivity>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getUserActivity(user.uuid, page, search),
    setStoreData: setUserActivity,
  });

  return (
    <>
      <Title order={2}>User Activity</Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={['Actor', 'Event', 'IP', 'When', '']} pagination={userActivity} onPageSelect={setPage}>
          {userActivity.data.map((activity) => (
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
};
