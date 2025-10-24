import { getEmptyPaginationSet } from '@/api/axios';
import { useState } from 'react';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import getUserServers from '@/api/admin/users/servers/getUserServers';
import ServerRow from '@/pages/admin/servers/ServerRow';

export default ({ user }: { user: User }) => {
  const [userServers, setUserServers] = useState<ResponseMeta<AdminServer>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getUserServers(user.uuid, page, search),
    setStoreData: setUserServers,
  });

  return (
    <>
      <Title order={2}>User Servers</Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table
          columns={['Id', 'Name', 'Node', 'Owner', 'Allocation', 'Created']}
          pagination={userServers}
          onPageSelect={setPage}
        >
          {userServers.data.map((server) => (
            <ServerRow key={server.uuid} server={server} />
          ))}
        </Table>
      )}
    </>
  );
};
