import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, TextInput, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getBackupConfigurations from '@/api/admin/backup-configurations/getBackupConfigurations.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { backupConfigurationTableColumns } from '@/lib/tableColumns.ts';
import BackupConfigurationCreateOrUpdate from '@/pages/admin/backupConfigurations/BackupConfigurationCreateOrUpdate.tsx';
import BackupConfigurationRow from '@/pages/admin/backupConfigurations/BackupConfigurationRow.tsx';
import BackupConfigurationView from '@/pages/admin/backupConfigurations/BackupConfigurationView.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';

function BackupConfigurationsContainer() {
  const navigate = useNavigate();
  const { backupConfigurations, setBackupConfigurations } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getBackupConfigurations,
    setStoreData: setBackupConfigurations,
  });

  return (
    <AdminContentContainer title='Backup Configurations'>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Backup Configurations
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/backup-configurations/new')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      <Table
        columns={backupConfigurationTableColumns}
        loading={loading}
        pagination={backupConfigurations}
        onPageSelect={setPage}
      >
        {backupConfigurations.data.map((bc) => (
          <BackupConfigurationRow key={bc.uuid} backupConfiguration={bc} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}

export default function AdminBackupConfigurations() {
  return (
    <Routes>
      <Route path='/' element={<BackupConfigurationsContainer />} />
      <Route path='/new' element={<BackupConfigurationCreateOrUpdate />} />
      <Route path='/:id/*' element={<BackupConfigurationView />} />
    </Routes>
  );
}
