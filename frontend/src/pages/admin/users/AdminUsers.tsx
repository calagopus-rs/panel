import { httpErrorToHuman } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { useAdminStore } from '@/stores/admin';
import UserRow from './UserRow';
import UserCreateOrUpdate from './UserCreateOrUpdate';
import getUsers from '@/api/admin/users/getUsers';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/inputnew/TextInput';
import NewButton from '@/elements/button/NewButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import TableNew from '@/elements/table/TableNew';

const UsersContainer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { users, setUsers } = useAdminStore();

  const [loading, setLoading] = useState(users.data.length === 0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getUsers(page, search)
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Users
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
          <NewButton onClick={() => navigate('/admin/users/new')} color={'blue'}>
            <FontAwesomeIcon icon={faPlus} className={'mr-2'} />
            Create
          </NewButton>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <TableNew columns={['ID', 'Username', 'Created']} pagination={users} onPageSelect={setPage}>
          {users.data.map((user) => (
            <UserRow key={user.uuid} user={user} />
          ))}
        </TableNew>
      )}
    </>
  );
};

export default () => {
  return (
    <Routes>
      <Route path={'/'} element={<UsersContainer />} />
      <Route path={'/new'} element={<UserCreateOrUpdate />} />
      <Route path={'/:id'} element={<UserCreateOrUpdate />} />
    </Routes>
  );
};
