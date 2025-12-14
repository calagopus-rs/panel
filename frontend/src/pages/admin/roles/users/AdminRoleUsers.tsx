import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getRoleUsers from '@/api/admin/roles/users/getRoleUsers.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import TextInput from '@/elements/input/TextInput.tsx';
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
    <>
      <Group justify='space-between' mb='md'>
        <Title order={2}>Role Users</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table columns={userTableColumns} loading={loading} pagination={roleUsers} onPageSelect={setPage}>
        {roleUsers.data.map((user) => (
          <UserRow key={user.uuid} user={user} />
        ))}
      </Table>
    </>
  );
}
