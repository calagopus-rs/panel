import { Group, Title } from '@mantine/core';
import { useState } from 'react';
import getBackupConfigurationServers from '@/api/admin/backup-configurations/servers/getBackupConfigurationServers.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { serverTableColumns } from '@/lib/tableColumns.ts';
import ServerRow from '@/pages/admin/servers/ServerRow.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';

export default function AdminBackupConfigurationServers({
  backupConfiguration,
}: {
  backupConfiguration: BackupConfiguration;
}) {
  const [backupConfigurationServers, setBackupConfigurationServers] = useState<ResponseMeta<AdminServer>>(
    getEmptyPaginationSet(),
  );

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackupConfigurationServers(backupConfiguration.uuid, page, search),
    setStoreData: setBackupConfigurationServers,
  });

  return (
    <AdminContentContainer title={`Backup Config Servers (${backupConfiguration.name})`}>
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
    </AdminContentContainer>
  );
}
