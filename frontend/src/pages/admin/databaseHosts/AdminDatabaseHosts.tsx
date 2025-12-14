import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, TextInput, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getDatabaseHosts from '@/api/admin/database-hosts/getDatabaseHosts.ts';
import Button from '@/elements/Button.tsx';
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
    <>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Database Hosts
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/database-hosts/new')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      <Table columns={databaseHostTableColumns} loading={loading} pagination={databaseHosts} onPageSelect={setPage}>
        {databaseHosts.data.map((dh) => (
          <DatabaseHostRow key={dh.uuid} databaseHost={dh} />
        ))}
      </Table>
    </>
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
