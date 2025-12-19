import { useState } from 'react';
import getBackupConfigurationNodes from '@/api/admin/backup-configurations/nodes/getBackupConfigurationNodes.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { nodeTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import NodeRow from '../../nodes/NodeRow.tsx';

export default function AdminBackupConfigurationNodes({
  backupConfiguration,
}: {
  backupConfiguration: BackupConfiguration;
}) {
  const [backupConfigurationNodes, setBackupConfigurationNodes] = useState<ResponseMeta<Node>>(getEmptyPaginationSet());

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackupConfigurationNodes(backupConfiguration.uuid, page, search),
    setStoreData: setBackupConfigurationNodes,
  });

  return (
    <AdminContentContainer title={`Backup Config Nodes`} titleOrder={2} search={search} setSearch={setSearch}>
      <Table columns={nodeTableColumns} loading={loading} pagination={backupConfigurationNodes} onPageSelect={setPage}>
        {backupConfigurationNodes.data.map((node) => (
          <NodeRow key={node.uuid} node={node} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}
