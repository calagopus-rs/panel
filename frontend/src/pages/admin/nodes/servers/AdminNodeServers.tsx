import { useState } from 'react';
import getNodeServers from '@/api/admin/nodes/servers/getNodeServers.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { serverTableColumns } from '@/lib/tableColumns.ts';
import ServerRow from '@/pages/admin/servers/ServerRow.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';

export default function AdminNodeServers({ node }: { node: Node }) {
  const [nodeServers, setNodeServers] = useState<ResponseMeta<AdminServer>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getNodeServers(node.uuid, page, search),
    setStoreData: setNodeServers,
  });

  return (
    <AdminContentContainer title='Node Servers' titleOrder={2} search={search} setSearch={setSearch}>
      <Table columns={serverTableColumns} loading={loading} pagination={nodeServers} onPageSelect={setPage}>
        {nodeServers.data.map((server) => (
          <ServerRow key={server.uuid} server={server} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}
