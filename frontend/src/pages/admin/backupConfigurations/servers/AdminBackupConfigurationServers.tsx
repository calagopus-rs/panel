import { getEmptyPaginationSet } from '@/api/axios';
import { useState } from 'react';
import { Title } from '@mantine/core';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import ServerRow, { serverTableColumns } from '@/pages/admin/servers/ServerRow';
import getBackupConfigurationServers from '@/api/admin/backup-configurations/servers/getBackupConfigurationServers';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default ({ backupConfiguration }: { backupConfiguration?: BackupConfiguration }) => {
  const [backupConfigurationServers, setBackupConfigurationServers] =
    useState<ResponseMeta<AdminServer>>(getEmptyPaginationSet());

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackupConfigurationServers(backupConfiguration.uuid, page, search),
    setStoreData: setBackupConfigurationServers,
  });

  return (
    <>
      <Title order={2} mb={'md'}>
        Backup Configuration Servers
      </Title>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={serverTableColumns} pagination={backupConfigurationServers} onPageSelect={setPage}>
          {backupConfigurationServers.data.map((server) => (
            <ServerRow key={server.uuid} server={server} />
          ))}
        </Table>
      )}
    </>
  );
};
