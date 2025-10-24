import { getEmptyPaginationSet } from '@/api/axios';
import { useState } from 'react';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import getRoleUsers from '@/api/admin/roles/users/getRoleUsers';
import UserRow, { userTableColumns } from '@/pages/admin/users/UserRow';

export default ({ role }: { role: Role }) => {
  const [roleUsers, setRoleUsers] = useState<ResponseMeta<User>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getRoleUsers(role.uuid, page, search),
    setStoreData: setRoleUsers,
  });

  return (
    <>
      <Title order={2}>Role Users</Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={userTableColumns} pagination={roleUsers} onPageSelect={setPage}>
          {roleUsers.data.map((user) => (
            <UserRow key={user.uuid} user={user} />
          ))}
        </Table>
      )}
    </>
  );
};
