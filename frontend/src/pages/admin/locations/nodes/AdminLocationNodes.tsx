import { Title } from '@mantine/core';
import { useState } from 'react';
import getLocationNodes from '@/api/admin/locations/nodes/getLocationNodes';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import NodeRow, { nodeTableColumns } from '../../nodes/NodeRow';

export default function AdminLocationNodes({ location }: { location: Location }) {
  const [locationNodes, setLocationNodes] = useState<ResponseMeta<Node>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getLocationNodes(location.uuid, page, search),
    setStoreData: setLocationNodes,
  });

  return (
    <>
      <Title order={2} mb={'md'}>
        Location Nodes
      </Title>

      <Table columns={nodeTableColumns} loading={loading} pagination={locationNodes} onPageSelect={setPage}>
        {locationNodes.data.map((node) => (
          <NodeRow key={node.uuid} node={node} />
        ))}
      </Table>
    </>
  );
}
