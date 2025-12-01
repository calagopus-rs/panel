import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getMountServers from '@/api/admin/mounts/servers/getMountServers';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import ServerRow, { serverTableColumns } from '../../servers/ServerRow';
import TextInput from '@/elements/input/TextInput';

export default function AdminMountServers({ mount }: { mount?: Mount }) {
  const [mountServers, setMountServers] = useState<ResponseMeta<AndCreated<{ server: AdminServer }>>>(
    getEmptyPaginationSet(),
  );

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getMountServers(mount.uuid, page, search),
    setStoreData: setMountServers,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={2}>Mount Servers</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table columns={serverTableColumns} loading={loading} pagination={mountServers} onPageSelect={setPage}>
        {mountServers.data.map((serverMount) => (
          <ServerRow key={serverMount.server.uuid} server={serverMount.server} />
        ))}
      </Table>
    </>
  );
}
