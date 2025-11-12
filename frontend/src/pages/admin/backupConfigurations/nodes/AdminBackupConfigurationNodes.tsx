import { Title } from '@mantine/core';
import { useState } from 'react';
import getBackupConfigurationNodes from '@/api/admin/backup-configurations/nodes/getBackupConfigurationNodes';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import NodeRow, { nodeTableColumns } from '../../nodes/NodeRow';

export default function AdminBackupConfigurationNodes({
  backupConfiguration,
}: {
  backupConfiguration?: BackupConfiguration;
}) {
  const [backupConfigurationNodes, setBackupConfigurationNodes] = useState<ResponseMeta<Node>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackupConfigurationNodes(backupConfiguration.uuid, page, search),
    setStoreData: setBackupConfigurationNodes,
  });

  return (
    <>
      <Title order={2} mb={'md'}>
        Backup Configuration Nodes
      </Title>

      <Table columns={nodeTableColumns} loading={loading} pagination={backupConfigurationNodes} onPageSelect={setPage}>
        {backupConfigurationNodes.data.map((node) => (
          <NodeRow key={node.uuid} node={node} />
        ))}
      </Table>
    </>
  );
}
