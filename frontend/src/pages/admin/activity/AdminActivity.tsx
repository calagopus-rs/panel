import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getAdminActivity from '@/api/admin/getAdminActivity';
import { getEmptyPaginationSet } from '@/api/axios';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { adminActivityColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import ActivityRow from './ActivityRow';

export default function AdminActivity() {
  const [activities, setActivities] = useState<ResponseMeta<AdminActivity>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getAdminActivity,
    setStoreData: setActivities,
  });

  return (
    <>
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
    </>
  );
}
