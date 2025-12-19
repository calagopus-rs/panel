import { useState } from 'react';
import getAdminActivity from '@/api/admin/getAdminActivity.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
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
    <AdminContentContainer title='Activity' search={search} setSearch={setSearch}>
      <Table columns={adminActivityColumns} loading={loading} pagination={activities} onPageSelect={setPage}>
        {activities.data.map((activity) => (
          <ActivityRow key={activity.created.toString()} activity={activity} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}
