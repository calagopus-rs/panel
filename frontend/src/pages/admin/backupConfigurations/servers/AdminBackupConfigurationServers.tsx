import { getEmptyPaginationSet, httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Title } from '@mantine/core';
import { load } from '@/lib/debounce';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import ServerRow from '@/pages/admin/servers/ServerRow';
import getBackupConfigurationServers from '@/api/admin/backup-configurations/servers/getBackupConfigurationServers';

export default ({ backupConfiguration }: { backupConfiguration?: BackupConfiguration }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const [backupConfigurationServers, setBackupConfigurationServers] =
    useState<ResponseMeta<AdminServer>>(getEmptyPaginationSet());

  const [loading, setLoading] = useState(backupConfigurationServers.data.length === 0);
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
    getBackupConfigurationServers(backupConfiguration.uuid, page, search)
      .then((data) => {
        setBackupConfigurationServers(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <Title order={2}>Backup Configuration Servers</Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table
          columns={['Id', 'Name', 'Node', 'Owner', 'Allocation', 'Created']}
          pagination={backupConfigurationServers}
          onPageSelect={setPage}
        >
          {backupConfigurationServers.data.map((server) => (
            <ServerRow key={server.uuid} server={server} />
          ))}
        </Table>
      )}
    </>
  );
};
