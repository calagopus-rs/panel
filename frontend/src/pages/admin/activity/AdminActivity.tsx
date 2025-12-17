import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getAdminActivity from '@/api/admin/getAdminActivity.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { adminActivityColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import ActivityRow from './ActivityRow.tsx';

export default function AdminActivity() {
  const [activities, setActivities] = useState<ResponseMeta<AdminActivity>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getAdminActivity,
    setStoreData: setActivities,
  });

  return (
    <AdminContentContainer title='Activity'>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Activity
        </Title>
        <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
      </Group>

      <Table columns={adminActivityColumns} loading={loading} pagination={activities} onPageSelect={setPage}>
        {activities.data.map((activity) => (
          <ActivityRow key={activity.created.toString()} activity={activity} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}
