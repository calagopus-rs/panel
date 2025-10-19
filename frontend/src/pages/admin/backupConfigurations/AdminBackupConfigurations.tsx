import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import { Group, TextInput, Title } from '@mantine/core';
import Table from '@/elements/Table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import BackupConfigurationCreateOrUpdate from '@/pages/admin/backupConfigurations/BackupConfigurationCreateOrUpdate';
import BackupConfigurationRow from '@/pages/admin/backupConfigurations/BackupConfigurationRow';
import getBackupConfigurations from '@/api/admin/backup-configurations/getBackupConfigurations';
import BackupConfigurationView from '@/pages/admin/backupConfigurations/BackupConfigurationView';

const BackupConfigurationsContainer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { backupConfigurations, setBackupConfigurations } = useAdminStore();

  const [loading, setLoading] = useState(backupConfigurations.data.length === 0);
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
    getBackupConfigurations(page, search)
      .then((data) => {
        setBackupConfigurations(data);
        load(false, setLoading);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

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
        <Table columns={['ID', 'Name', 'Disk', 'Created']} pagination={backupConfigurations} onPageSelect={setPage}>
          {backupConfigurations.data.map((bc) => (
            <BackupConfigurationRow key={bc.uuid} backupConfiguration={bc} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<BackupConfigurationsContainer />} />
      <Route path={'/new'} element={<BackupConfigurationCreateOrUpdate />} />
      <Route path={'/:id/*'} element={<BackupConfigurationView />} />
    </Routes>
  );
};
