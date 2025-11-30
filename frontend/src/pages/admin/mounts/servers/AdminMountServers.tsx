import { Title } from '@mantine/core';
import { useState } from 'react';
import getMountServers from '@/api/admin/mounts/servers/getMountServers';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { serverTableColumns } from '@/lib/tableColumns';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import ServerRow from '../../servers/ServerRow';

export default function AdminMountServers({ mount }: { mount: Mount }) {
  const [mountServers, setMountServers] = useState<ResponseMeta<AndCreated<{ server: AdminServer }>>>(
    getEmptyPaginationSet(),
  );

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getMountServers(mount.uuid, page, search),
    setStoreData: setMountServers,
  });

  return (
    <>
      <Title order={2} mb='md'>
        Mount Servers
      </Title>

      <Table columns={serverTableColumns} loading={loading} pagination={mountServers} onPageSelect={setPage}>
        {mountServers.data.map((serverMount) => (
          <ServerRow key={serverMount.server.uuid} server={serverMount.server} />
        ))}
      </Table>
    </>
  );
}
