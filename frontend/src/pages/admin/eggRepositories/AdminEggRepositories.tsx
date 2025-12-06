import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getEggRepositories from '@/api/admin/egg-repositories/getEggRepositories';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { eggRepositoryTableColumns } from '@/lib/tableColumns';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';
import EggRepositoryCreateOrUpdate from './EggRepositoryCreateOrUpdate';
import EggRepositoryRow from './EggRepositoryRow';
import EggRepositoryView from './EggRepositoryView';

function EggRepositoriesContainer() {
  const navigate = useNavigate();
  const { eggRepositories, setEggRepositories } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getEggRepositories,
    setStoreData: setEggRepositories,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Egg Repositories
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/egg-repositories/new')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      <Table columns={eggRepositoryTableColumns} loading={loading} pagination={eggRepositories} onPageSelect={setPage}>
        {eggRepositories.data.map((eggRepository) => (
          <EggRepositoryRow key={eggRepository.uuid} eggRepository={eggRepository} />
        ))}
      </Table>
    </>
  );
}

export default function AdminNests() {
  return (
    <Routes>
      <Route path='/' element={<EggRepositoriesContainer />} />
      <Route path='/new' element={<EggRepositoryCreateOrUpdate />} />
      <Route path='/:eggRepositoryId/*' element={<EggRepositoryView />} />
    </Routes>
  );
}
