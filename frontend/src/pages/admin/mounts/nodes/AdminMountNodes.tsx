import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getMountNodes from '@/api/admin/mounts/nodes/getMountNodes.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { nodeTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import NodeRow from '../../nodes/NodeRow.tsx';

export default function AdminMountNodes({ mount }: { mount: Mount }) {
  const [mountNodes, setMountNodes] = useState<ResponseMeta<AndCreated<{ node: Node }>>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getMountNodes(mount.uuid, page, search),
    setStoreData: setMountNodes,
  });

  return (
    <AdminContentContainer title='Mount Nodes'>
      <Group justify='space-between' mb='md'>
        <Title order={2}>Mount Nodes</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table columns={nodeTableColumns} loading={loading} pagination={mountNodes} onPageSelect={setPage}>
        {mountNodes.data.map((nodeMount) => (
          <NodeRow key={nodeMount.node.uuid} node={nodeMount.node} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}
