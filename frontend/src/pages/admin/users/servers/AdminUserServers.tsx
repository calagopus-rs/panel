import { Title } from '@mantine/core';
import { useState } from 'react';
import getUserServers from '@/api/admin/users/servers/getUserServers';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import ServerRow, { serverTableColumns } from '@/pages/admin/servers/ServerRow';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default function AdminUserServers({ user }: { user: User }) {
  const [userServers, setUserServers] = useState<ResponseMeta<AdminServer>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getUserServers(user.uuid, page, search),
    setStoreData: setUserServers,
  });

  return (
    <>
      <Title order={2} mb='md'>
        User Servers
      </Title>

      <Table columns={serverTableColumns} loading={loading} pagination={userServers} onPageSelect={setPage}>
        {userServers.data.map((server) => (
          <ServerRow key={server.uuid} server={server} />
        ))}
      </Table>
    </>
  );
}
