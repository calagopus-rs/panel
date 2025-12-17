import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { Route, Routes, useNavigate } from 'react-router';
import getUsers from '@/api/admin/users/getUsers.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { userTableColumns } from '@/lib/tableColumns.ts';
import UserView from '@/pages/admin/users/UserView.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useAdminStore } from '@/stores/admin.tsx';
import UserCreateOrUpdate from './UserCreateOrUpdate.tsx';
import UserRow from './UserRow.tsx';

function UsersContainer() {
  const navigate = useNavigate();
  const { users, setUsers } = useAdminStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: getUsers,
    setStoreData: setUsers,
  });

  return (
    <AdminContentContainer
      title='Users'
      search={search}
      setSearch={setSearch}
      contentRight={
        <Button
          onClick={() => navigate('/admin/users/new')}
          color='blue'
          leftSection={<FontAwesomeIcon icon={faPlus} />}
        >
          Create
        </Button>
      }
    >
      <Table columns={userTableColumns} loading={loading} pagination={users} onPageSelect={setPage}>
        {users.data.map((user) => (
          <UserRow key={user.uuid} user={user} />
        ))}
      </Table>
    </AdminContentContainer>
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
