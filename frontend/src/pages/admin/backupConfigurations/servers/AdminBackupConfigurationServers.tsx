import { Title } from '@mantine/core';
import { useState } from 'react';
import getBackupConfigurationServers from '@/api/admin/backup-configurations/servers/getBackupConfigurationServers';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import { serverTableColumns } from '@/lib/tableColumns';
import ServerRow from '@/pages/admin/servers/ServerRow';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default function AdminBackupConfigurationServers({
  backupConfiguration,
}: {
  backupConfiguration: BackupConfiguration;
}) {
  const [backupConfigurationServers, setBackupConfigurationServers] = useState<ResponseMeta<AdminServer>>(
    getEmptyPaginationSet(),
  );

  const { loading, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackupConfigurationServers(backupConfiguration.uuid, page, search),
    setStoreData: setBackupConfigurationServers,
  });

  return (
    <>
      <Title order={2} mb='md'>
        Backup Configuration Servers
      </Title>

      <Table
        columns={serverTableColumns}
        loading={loading}
        pagination={backupConfigurationServers}
        onPageSelect={setPage}
      >
        {backupConfigurationServers.data.map((server) => (
          <ServerRow key={server.uuid} server={server} />
        ))}
      </Table>
    </>
  );
}
