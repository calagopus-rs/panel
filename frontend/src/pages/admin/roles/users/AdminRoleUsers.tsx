import { Title } from '@mantine/core';
import { useState } from 'react';
import getRoleUsers from '@/api/admin/roles/users/getRoleUsers';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { userTableColumns } from '@/lib/tableColumns';
import UserRow from '@/pages/admin/users/UserRow';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default function AdminRoleUsers({ role }: { role: Role }) {
  const [roleUsers, setRoleUsers] = useState<ResponseMeta<User>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getRoleUsers(role.uuid, page, search),
    setStoreData: setRoleUsers,
  });

  return (
    <>
      <Title order={2} mb='md'>
        Role Users
      </Title>

      <Table columns={userTableColumns} loading={loading} pagination={roleUsers} onPageSelect={setPage}>
        {roleUsers.data.map((user) => (
          <UserRow key={user.uuid} user={user} />
        ))}
      </Table>
    </>
  );
}
