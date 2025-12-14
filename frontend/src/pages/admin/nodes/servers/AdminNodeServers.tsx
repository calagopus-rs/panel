import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import Table from '@/elements/Table.tsx';
import ServerRow from '@/pages/admin/servers/ServerRow.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import TextInput from '@/elements/input/TextInput.tsx';
import getNodeServers from '@/api/admin/nodes/servers/getNodeServers.ts';
import { serverTableColumns } from '@/lib/tableColumns.ts';

export default function AdminNodeServers({ node }: { node: Node }) {
  const [nodeServers, setNodeServers] = useState<ResponseMeta<AdminServer>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getNodeServers(node.uuid, page, search),
    setStoreData: setNodeServers,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={2}>Node Servers</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table columns={serverTableColumns} loading={loading} pagination={nodeServers} onPageSelect={setPage}>
        {nodeServers.data.map((server) => (
          <ServerRow key={server.uuid} server={server} />
        ))}
      </Table>
    </>
  );
}
