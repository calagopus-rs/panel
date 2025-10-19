import Spinner from '@/elements/Spinner';
import { Route, Routes, useNavigate } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import { Group, Title } from '@mantine/core';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import TextInput from '@/elements/input/TextInput';
import getServers from '@/api/admin/servers/getServers';
import ServerRow from './ServerRow';
import ServerCreateOrUpdate from './ServerCreateOrUpdate';
import ServerView from './ServerView';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

const ServersContainer = () => {
  const navigate = useNavigate();
  const { servers, setServers } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getServers,
    setStoreData: setServers,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Servers
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/servers/new')}
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
        <Table
          columns={['Id', 'Name', 'Node', 'Owner', 'Allocation', 'Created']}
          pagination={servers}
          onPageSelect={setPage}
        >
          {servers.data.map((server) => (
            <ServerRow key={server.uuid} server={server} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<ServersContainer />} />
      <Route path={'/new'} element={<ServerCreateOrUpdate />} />
      <Route path={'/:id/*'} element={<ServerView />} />
    </Routes>
  );
};
