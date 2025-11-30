import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getServers from '@/api/admin/servers/getServers';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { serverTableColumns } from '@/lib/tableColumns';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';
import ServerCreateOrUpdate from './ServerCreateOrUpdate';
import ServerRow from './ServerRow';
import ServerView from './ServerView';

function ServersContainer() {
  const navigate = useNavigate();
  const { servers, setServers } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getServers,
    setStoreData: setServers,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Servers
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/servers/new')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      <Table columns={serverTableColumns} loading={loading} pagination={servers} onPageSelect={setPage}>
        {servers.data.map((server) => (
          <ServerRow key={server.uuid} server={server} />
        ))}
      </Table>
    </>
  );
}

export default function AdminServers() {
  return (
    <Routes>
      <Route path='/' element={<ServersContainer />} />
      <Route path='/new' element={<ServerCreateOrUpdate />} />
      <Route path='/:id/*' element={<ServerView />} />
    </Routes>
  );
}
