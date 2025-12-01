import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getBackupConfigurationServers from '@/api/admin/backup-configurations/servers/getBackupConfigurationServers';
import { getEmptyPaginationSet } from '@/api/axios';
import Table from '@/elements/Table';
import ServerRow, { serverTableColumns } from '@/pages/admin/servers/ServerRow';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import TextInput from '@/elements/input/TextInput';

export default function AdminBackupConfigurationServers({
  backupConfiguration,
}: {
  backupConfiguration?: BackupConfiguration;
}) {
  const [backupConfigurationServers, setBackupConfigurationServers] = useState<ResponseMeta<AdminServer>>(
    getEmptyPaginationSet(),
  );

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackupConfigurationServers(backupConfiguration.uuid, page, search),
    setStoreData: setBackupConfigurationServers,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={2}>Backup Configuration Servers</Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
        </Group>
      </Group>

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
