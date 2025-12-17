import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Route, Routes, useNavigate } from 'react-router';
import getServers from '@/api/admin/servers/getServers.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import Table from '@/elements/Table.tsx';
import { serverTableColumns } from '@/lib/tableColumns.ts';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import ServerCreate from './ServerCreate.tsx';
import ServerRow from './ServerRow.tsx';
import ServerView from './ServerView.tsx';

function ServersContainer() {
  const navigate = useNavigate();
  const { servers, setServers } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getServers,
    setStoreData: setServers,
  });

  return (
    <AdminContentContainer
      title='Servers'
      search={search}
      setSearch={setSearch}
      contentRight={
        <Button
          onClick={() => navigate('/admin/servers/new')}
          color='blue'
          leftSection={<FontAwesomeIcon icon={faPlus} />}
        >
          Create
        </Button>
      }
    >
      <Table columns={serverTableColumns} loading={loading} pagination={servers} onPageSelect={setPage}>
        {servers.data.map((server) => (
          <ServerRow key={server.uuid} server={server} />
        ))}
      </Table>
    </AdminContentContainer>
  );
}

export default function AdminServers() {
  return (
    <Routes>
      <Route path='/' element={<ServersContainer />} />
      <Route path='/new' element={<ServerCreate />} />
      <Route path='/:id/*' element={<ServerView />} />
    </Routes>
  );
}
