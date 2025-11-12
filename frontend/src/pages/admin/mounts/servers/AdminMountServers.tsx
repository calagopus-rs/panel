import { Title } from '@mantine/core';
import { useState } from 'react';
import { getEmptyPaginationSet } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import ServerRow, { serverTableColumns } from '../../servers/ServerRow';
import getMountServers from '@/api/admin/mounts/servers/getMountServers';

export default function AdminMountServers({ mount }: { mount?: Mount }) {
  const [mountServers, setMountServers] = useState<ResponseMeta<AndCreated<{ server: AdminServer }>>>(
    getEmptyPaginationSet(),
  );

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getMountServers(mount.uuid, page, search),
    setStoreData: setMountServers,
  });

  return (
    <>
      <Title order={2} mb={'md'}>
        Mount Servers
      </Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={serverTableColumns} pagination={mountServers} onPageSelect={setPage}>
          {mountServers.data.map((serverMount) => (
            <ServerRow key={serverMount.server.uuid} server={serverMount.server} />
          ))}
        </Table>
      )}
    </>
  );
}
