import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getMountServers from '@/api/admin/mounts/servers/getMountServers.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { serverTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import ServerRow from '../../servers/ServerRow.tsx';

export default function AdminMountServers({ mount }: { mount: Mount }) {
  const [mountServers, setMountServers] = useState<ResponseMeta<AndCreated<{ server: AdminServer }>>>(
    getEmptyPaginationSet(),
  );

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getMountServers(mount.uuid, page, search),
    setStoreData: setMountServers,
  });

  return (
    <AdminContentContainer title='Mount Servers'>
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
    </AdminContentContainer>
  );
}
