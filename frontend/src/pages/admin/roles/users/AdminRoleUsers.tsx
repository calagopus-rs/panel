import { useState } from 'react';
import getRoleUsers from '@/api/admin/roles/users/getRoleUsers.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { userTableColumns } from '@/lib/tableColumns.ts';
import UserRow from '@/pages/admin/users/UserRow.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';

export default function AdminRoleUsers({ role }: { role: Role }) {
  const [roleUsers, setRoleUsers] = useState<ResponseMeta<User>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getRoleUsers(role.uuid, page, search),
    setStoreData: setRoleUsers,
  });

  return (
    <AdminContentContainer title='Role Users' titleOrder={2} search={search} setSearch={setSearch}>
      <Table columns={userTableColumns} loading={loading} pagination={roleUsers} onPageSelect={setPage}>
        {roleUsers.data.map((user) => (
          <UserRow key={user.uuid} user={user} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}
