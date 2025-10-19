import { getEmptyPaginationSet } from '@/api/axios';
import { useState } from 'react';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import NodeRow from '../../nodes/NodeRow';
import getBackupConfigurationNodes from '@/api/admin/backup-configurations/nodes/getBackupConfigurationNodes';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default ({ backupConfiguration }: { backupConfiguration?: BackupConfiguration }) => {
  const [backupConfigurationNodes, setBackupConfigurationNodes] = useState<ResponseMeta<Node>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackupConfigurationNodes(backupConfiguration.uuid, page, search),
    setStoreData: setBackupConfigurationNodes,
  });

  return (
    <>
      <Title order={2}>Backup Configuration Nodes</Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table
          columns={['', 'Id', 'Name', 'Location', 'URL', 'Created']}
          pagination={backupConfigurationNodes}
          onPageSelect={setPage}
        >
          {backupConfigurationNodes.data.map((node) => (
            <NodeRow key={node.uuid} node={node} />
          ))}
        </Table>
      )}
    </>
  );
};
