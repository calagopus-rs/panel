import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getLocationNodes from '@/api/admin/locations/nodes/getLocationNodes.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { nodeTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import NodeRow from '../../nodes/NodeRow.tsx';

export default function AdminLocationNodes({ location }: { location: Location }) {
  const [locationNodes, setLocationNodes] = useState<ResponseMeta<Node>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getLocationNodes(location.uuid, page, search),
    setStoreData: setLocationNodes,
  });

  return (
    <AdminContentContainer title='Location Nodes'>
      <Group justify='space-between' mb='md'>
        <Title order={2}>Location Nodes</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

      <Table columns={nodeTableColumns} loading={loading} pagination={locationNodes} onPageSelect={setPage}>
        {locationNodes.data.map((node) => (
          <NodeRow key={node.uuid} node={node} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}
