import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, TextInput, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getBackupConfigurations from '@/api/admin/backup-configurations/getBackupConfigurations';
import Button from '@/elements/Button';
import Spinner from '@/elements/Spinner';
import Table from '@/elements/Table';
import BackupConfigurationCreateOrUpdate from '@/pages/admin/backupConfigurations/BackupConfigurationCreateOrUpdate';
import BackupConfigurationRow, {
  backupConfigurationTableColumns,
} from '@/pages/admin/backupConfigurations/BackupConfigurationRow';
import BackupConfigurationView from '@/pages/admin/backupConfigurations/BackupConfigurationView';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';

function BackupConfigurationsContainer() {
  const navigate = useNavigate();
  const { backupConfigurations, setBackupConfigurations } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getBackupConfigurations,
    setStoreData: setBackupConfigurations,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Backup Configurations
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/backup-configurations/new')}
            color={'blue'}
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <Table columns={backupConfigurationTableColumns} pagination={backupConfigurations} onPageSelect={setPage}>
          {backupConfigurations.data.map((bc) => (
            <BackupConfigurationRow key={bc.uuid} backupConfiguration={bc} />
          ))}
        </Table>
      )}
    </>
  );
}

export default function AdminBackupConfigurations() {
  return (
    <Routes>
      <Route path={'/'} element={<BackupConfigurationsContainer />} />
      <Route path={'/new'} element={<BackupConfigurationCreateOrUpdate />} />
      <Route path={'/:id/*'} element={<BackupConfigurationView />} />
    </Routes>
  );
}
