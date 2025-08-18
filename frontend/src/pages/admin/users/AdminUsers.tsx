import { httpErrorToHuman } from '@/api/axios';
import { Button } from '@/elements/button';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { useAdminStore } from '@/stores/admin';
import UserRow from './UserRow';
import UserCreateOrUpdate from './UserCreateOrUpdate';
import getUsers from '@/api/admin/users/getUsers';

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
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Users</h1>
        <div className={'flex gap-2'}>
          <Button onClick={() => navigate('/admin/users/new')}>New User</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper onSearch={setSearch}>
          <Pagination data={users} onPageSelect={setPage}>
            <div className={'overflow-x-auto'}>
              <table className={'w-full table-auto'}>
                <TableHead>
                  <TableHeader name={'ID'} />
                  <TableHeader name={'Username'} />
                  <TableHeader name={'Created'} />
                </TableHead>

                <ContextMenuProvider>
                  <TableBody>
                    {users.data.map((user) => (
                      <UserRow key={user.uuid} user={user} />
                    ))}
                  </TableBody>
                </ContextMenuProvider>
              </table>

              {loading ? <Spinner.Centered /> : users.data.length === 0 ? <NoItems /> : null}
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
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
