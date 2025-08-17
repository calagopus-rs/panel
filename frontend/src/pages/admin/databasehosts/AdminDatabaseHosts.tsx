import { httpErrorToHuman } from '@/api/axios';
import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { useAdminStore } from '@/stores/admin';
import DatabaseHostCreateOrUpdate from './DatabaseHostCreateOrUpdate';
import getDatabaseHosts from '@/api/admin/databaseHosts/getDatabaseHosts';
import DatabaseHostRow from './DatabaseHostRow';

const DatabaseHostsContainer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { databaseHosts, setDatabaseHosts } = useAdminStore();

  const [loading, setLoading] = useState(databaseHosts.data.length === 0);
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
    getDatabaseHosts(page, search)
      .then((data) => {
        setDatabaseHosts(data);
        setLoading(false);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Database Hosts</h1>
        <div className={'flex gap-2'}>
          <Button onClick={() => navigate('/admin/database-hosts/new')}>New Database Host</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper onSearch={setSearch}>
          <Pagination data={databaseHosts} onPageSelect={setPage}>
            <div className={'overflow-x-auto'}>
              <table className={'w-full table-auto'}>
                <TableHead>
                  <TableHeader name={'ID'} />
                  <TableHeader name={'Name'} />
                  <TableHeader name={'Type'} />
                  <TableHeader name={'Address'} />
                  <TableHeader name={'Databases'} />
                  <TableHeader name={'Locations'} />
                </TableHead>

                <ContextMenuProvider>
                  <TableBody>
                    {databaseHosts.data.map((dh) => (
                      <DatabaseHostRow key={dh.uuid} databaseHost={dh} />
                    ))}
                  </TableBody>
                </ContextMenuProvider>
              </table>

              {loading ? <Spinner.Centered /> : databaseHosts.data.length === 0 ? <NoItems /> : null}
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
    </>
  );
};

export default () => {
  return (
    <Container>
      <Routes>
        <Route path={'/'} element={<DatabaseHostsContainer />} />
        <Route path={'/new'} element={<DatabaseHostCreateOrUpdate />} />
        <Route path={'/:id'} element={<DatabaseHostCreateOrUpdate />} />
      </Routes>
    </Container>
  );
};
