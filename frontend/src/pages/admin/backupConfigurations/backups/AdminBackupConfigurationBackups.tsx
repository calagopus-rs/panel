import { useState } from 'react';
import getBackupConfigurationBackups from '@/api/admin/backup-configurations/backups/getBackupConfigurationBackups.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import AdminBackupConfigurationBackupRow from './AdminBackupConfigurationBackupRow.tsx';

export default function AdminBackupConfigurationBackups({
  backupConfiguration,
}: {
  backupConfiguration: BackupConfiguration;
}) {
  const [backupConfigurationBackups, setBackupConfigurationBackups] = useState<ResponseMeta<AdminServerBackup>>(
    getEmptyPaginationSet(),
  );

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getBackupConfigurationBackups(backupConfiguration.uuid, page, search),
    setStoreData: setBackupConfigurationBackups,
  });

  return (
    <AdminContentContainer title={`Backup Config Backups`} titleOrder={2} search={search} setSearch={setSearch}>
      <Table
        columns={['Name', 'Server', 'Checksum', 'Size', 'Files', 'Created At']}
        loading={loading}
        pagination={backupConfigurationBackups}
        onPageSelect={setPage}
      >
        {backupConfigurationBackups.data.map((backup) => (
          <AdminBackupConfigurationBackupRow key={backup.uuid} backup={backup} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}
