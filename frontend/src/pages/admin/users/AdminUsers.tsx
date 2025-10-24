import Spinner from '@/elements/Spinner';
import { Route, Routes, useNavigate } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import UserRow from './UserRow';
import UserCreateOrUpdate from './UserCreateOrUpdate';
import getUsers from '@/api/admin/users/getUsers';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import UserView from '@/pages/admin/users/UserView';

const UsersContainer = () => {
  const navigate = useNavigate();
  const { users, setUsers } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getUsers,
    setStoreData: setUsers,
  });

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Users
        </Title>
        <Group>
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/users/new')}
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
        <Table columns={['ID', 'Username', 'Created']} pagination={users} onPageSelect={setPage}>
          {users.data.map((user) => (
            <UserRow key={user.uuid} user={user} />
          ))}
        </Table>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<UsersContainer />} />
      <Route path={'/new'} element={<UserCreateOrUpdate />} />
      <Route path={'/:id/*'} element={<UserView />} />
    </Routes>
  );
};
