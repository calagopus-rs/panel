import { Title } from '@mantine/core';
import { useState } from 'react';
import { getEmptyPaginationSet } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import NodeRow, { nodeTableColumns } from '../../nodes/NodeRow';
import getMountNodes from '@/api/admin/mounts/nodes/getMountNodes';

export default function AdminMountNodes({ mount }: { mount?: Mount }) {
  const [mountNodes, setMountNodes] = useState<ResponseMeta<AndCreated<{ node: Node }>>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getMountNodes(mount.uuid, page, search),
    setStoreData: setMountNodes,
  });

  return (
    <>
      <Title order={2} mb={'md'}>
        Mount Nodes
      </Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={nodeTableColumns} pagination={mountNodes} onPageSelect={setPage}>
          {mountNodes.data.map((nodeMount) => (
            <NodeRow key={nodeMount.node.uuid} node={nodeMount.node} />
          ))}
        </Table>
      )}
    </>
  );
}
