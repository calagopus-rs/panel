import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getUserActivity from '@/api/admin/users/getUserActivity.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import ActivityInfoButton from '@/elements/activity/ActivityInfoButton.tsx';
import Code from '@/elements/Code.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table, { TableData, TableRow } from '@/elements/Table.tsx';
import Tooltip from '@/elements/Tooltip.tsx';
import { formatDateTime, formatTimestamp } from '@/lib/time.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';

export default function AdminUserActivity({ user }: { user: User }) {
  const [userActivity, setUserActivity] = useState<ResponseMeta<UserActivity>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getUserActivity(user.uuid, page, search),
    setStoreData: setUserActivity,
  });

  return (
    <AdminContentContainer title='User Activity'>
      <Group justify='space-between' mb='md'>
        <Title order={2}>User Activity</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table
        columns={['Actor', 'Event', 'IP', 'When', '']}
        loading={loading}
        pagination={userActivity}
        onPageSelect={setPage}
      >
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
              <Group gap={4} justify='right' wrap='nowrap'>
                {Object.keys(activity.data ?? {}).length > 0 ? <ActivityInfoButton activity={activity} /> : null}
              </Group>
            </TableData>
          </TableRow>
        ))}
      </Table>
    </AdminContentContainer>
  );
}
