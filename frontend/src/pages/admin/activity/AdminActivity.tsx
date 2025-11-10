import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getAdminActivity from '@/api/admin/getAdminActivity';
import TextInput from '@/elements/input/TextInput';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import ActivityRow, { activityTableColumns } from './ActivityRow';

export default function AdminActivity() {
  const [activities, setActivities] = useState<ResponseMeta<AdminActivity>>();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getAdminActivity,
    setStoreData: setActivities,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Activity
        </Title>
        <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={activityTableColumns} pagination={activities} onPageSelect={setPage}>
          {activities.data.map((activity) => (
            <ActivityRow key={activity.created.toString()} activity={activity} />
          ))}
        </Table>
      )}
    </>
  );
}
