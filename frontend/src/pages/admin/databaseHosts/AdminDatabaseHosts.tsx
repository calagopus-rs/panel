import Spinner from '@/elements/Spinner';
import { Route, Routes, useNavigate } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import DatabaseHostCreateOrUpdate from './DatabaseHostCreateOrUpdate';
import getDatabaseHosts from '@/api/admin/database-hosts/getDatabaseHosts';
import DatabaseHostRow, { databaseHostTableColumns } from './DatabaseHostRow';
import { Group, TextInput, Title } from '@mantine/core';
import Table from '@/elements/Table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Button from '@/elements/Button';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import DatabaseHostView from './DatabaseHostView';

const DatabaseHostsContainer = () => {
  const navigate = useNavigate();
  const { databaseHosts, setDatabaseHosts } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getDatabaseHosts,
    setStoreData: setDatabaseHosts,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Database Hosts
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/database-hosts/new')}
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
        <Table columns={databaseHostTableColumns} pagination={databaseHosts} onPageSelect={setPage}>
          {databaseHosts.data.map((dh) => (
            <DatabaseHostRow key={dh.uuid} databaseHost={dh} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<DatabaseHostsContainer />} />
      <Route path={'/new'} element={<DatabaseHostCreateOrUpdate />} />
      <Route path={'/:id/*'} element={<DatabaseHostView />} />
    </Routes>
  );
};
