import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Route, Routes, useNavigate } from 'react-router';
import getEggRepositories from '@/api/admin/egg-repositories/getEggRepositories.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { eggRepositoryTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import EggRepositoryCreateOrUpdate from './EggRepositoryCreateOrUpdate.tsx';
import EggRepositoryRow from './EggRepositoryRow.tsx';
import EggRepositoryView from './EggRepositoryView.tsx';

function EggRepositoriesContainer() {
  const navigate = useNavigate();
  const { eggRepositories, setEggRepositories } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getEggRepositories,
    setStoreData: setEggRepositories,
  });

  return (
    <AdminContentContainer
      title='Egg Repositories'
      search={search}
      setSearch={setSearch}
      contentRight={
        <Button
          onClick={() => navigate('/admin/egg-repositories/new')}
          color='blue'
          leftSection={<FontAwesomeIcon icon={faPlus} />}
        >
          Create
        </Button>
      }
    >
      <Table columns={eggRepositoryTableColumns} loading={loading} pagination={eggRepositories} onPageSelect={setPage}>
        {eggRepositories.data.map((eggRepository) => (
          <EggRepositoryRow key={eggRepository.uuid} eggRepository={eggRepository} />
        ))}
      </Table>
    </AdminContentContainer>
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
