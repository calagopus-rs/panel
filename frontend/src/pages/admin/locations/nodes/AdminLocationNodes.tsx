import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getLocationNodes from '@/api/admin/locations/nodes/getLocationNodes';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import NodeRow, { nodeTableColumns } from '../../nodes/NodeRow';
import TextInput from '@/elements/input/TextInput';

export default function AdminLocationNodes({ location }: { location: Location }) {
  const [locationNodes, setLocationNodes] = useState<ResponseMeta<Node>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getLocationNodes(location.uuid, page, search),
    setStoreData: setLocationNodes,
  });

  return (
    <>
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
    </>
  );
}
