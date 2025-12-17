import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Route, Routes, useNavigate } from 'react-router';
import getDatabaseHosts from '@/api/admin/database-hosts/getDatabaseHosts.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { databaseHostTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import DatabaseHostCreateOrUpdate from './DatabaseHostCreateOrUpdate.tsx';
import DatabaseHostRow from './DatabaseHostRow.tsx';
import DatabaseHostView from './DatabaseHostView.tsx';

function DatabaseHostsContainer() {
  const navigate = useNavigate();
  const { databaseHosts, setDatabaseHosts } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getDatabaseHosts,
    setStoreData: setDatabaseHosts,
  });

  return (
    <AdminContentContainer
      title='Database Hosts'
      search={search}
      setSearch={setSearch}
      contentRight={
        <Button
          onClick={() => navigate('/admin/database-hosts/new')}
          color='blue'
          leftSection={<FontAwesomeIcon icon={faPlus} />}
        >
          Create
        </Button>
      }
    >
      <Table columns={databaseHostTableColumns} loading={loading} pagination={databaseHosts} onPageSelect={setPage}>
        {databaseHosts.data.map((dh) => (
          <DatabaseHostRow key={dh.uuid} databaseHost={dh} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}

export default function AdminDatabaseHosts() {
  return (
    <Routes>
      <Route path='/' element={<DatabaseHostsContainer />} />
      <Route path='/new' element={<DatabaseHostCreateOrUpdate />} />
      <Route path='/:id/*' element={<DatabaseHostView />} />
    </Routes>
  );
}
