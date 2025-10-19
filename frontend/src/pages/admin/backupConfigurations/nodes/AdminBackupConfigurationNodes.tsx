import { getEmptyPaginationSet, httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Title } from '@mantine/core';
import { load } from '@/lib/debounce';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import NodeRow from '../../nodes/NodeRow';
import getBackupConfigurationNodes from '@/api/admin/backup-configurations/nodes/getBackupConfigurationNodes';

export default ({ backupConfiguration }: { backupConfiguration?: BackupConfiguration }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const [backupConfigurationNodes, setBackupConfigurationNodes] = useState<ResponseMeta<Node>>(getEmptyPaginationSet());

  const [loading, setLoading] = useState(backupConfigurationNodes.data.length === 0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getBackupConfigurationNodes(backupConfiguration.uuid, page, search)
      .then((data) => {
        setBackupConfigurationNodes(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

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
