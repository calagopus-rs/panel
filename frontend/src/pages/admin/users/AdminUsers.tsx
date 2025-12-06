import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getUsers from '@/api/admin/users/getUsers';
import Button from '@/elements/Button';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { userTableColumns } from '@/lib/tableColumns';
import UserView from '@/pages/admin/users/UserView';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useAdminStore } from '@/stores/admin';
import UserCreateOrUpdate from './UserCreateOrUpdate';
import UserRow from './UserRow';

function UsersContainer() {
  const navigate = useNavigate();
  const { users, setUsers } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getUsers,
    setStoreData: setUsers,
  });

  return (
    <>
      <Group justify='space-between' mb='md'>
        <Title order={1} c='white'>
          Users
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button
            onClick={() => navigate('/admin/users/new')}
            color='blue'
            leftSection={<FontAwesomeIcon icon={faPlus} />}
          >
            Create
          </Button>
        </Group>
      </Group>

      <Table columns={userTableColumns} loading={loading} pagination={users} onPageSelect={setPage}>
        {users.data.map((user) => (
          <UserRow key={user.uuid} user={user} />
        ))}
      </Table>
    </>
  );
}

export default function AdminUsers() {
  return (
    <Routes>
      <Route path='/' element={<UsersContainer />} />
      <Route path='/new' element={<UserCreateOrUpdate />} />
      <Route path='/:id/*' element={<UserView />} />
    </Routes>
  );
}
