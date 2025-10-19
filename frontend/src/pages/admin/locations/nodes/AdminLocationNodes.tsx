import { getEmptyPaginationSet } from '@/api/axios';
import { useState } from 'react';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import getLocationNodes from '@/api/admin/locations/nodes/getLocationNodes';
import NodeRow from '../../nodes/NodeRow';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default ({ location }: { location: Location }) => {
  const [locationNodes, setLocationNodes] = useState<ResponseMeta<Node>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getLocationNodes(location.uuid, page, search),
    setStoreData: setLocationNodes,
  });

  return (
    <>
      <Title order={2}>Location Nodes</Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table
          columns={['', 'Id', 'Name', 'Location', 'URL', 'Created']}
          pagination={locationNodes}
          onPageSelect={setPage}
        >
          {locationNodes.data.map((node) => (
            <NodeRow key={node.uuid} node={node} />
          ))}
        </Table>
      )}
    </>
  );
};
