import { httpErrorToHuman } from '@/api/axios';
import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, {
  NoItems,
  Pagination,
  TableBody,
  TableHead,
  TableHeader,
} from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, useSearchParams } from 'react-router';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { useAdminStore } from '@/stores/admin';
import getServers from '@/api/admin/servers/getServers';
import ServerRow from './ServerRow';
import ServerCreateOrUpdate from './ServerCreateOrUpdate';

const ServersContainer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { servers, setServers } = useAdminStore();

  const [loading, setLoading] = useState(servers.data.length === 0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
  }, []);

  const onPageSelect = (page: number) => {
    setSearchParams({ page: page.toString() });
  };

  useEffect(() => {
    getServers({ page, perPage: 25 })
      .then((data) => {
        setServers(data);
        setLoading(false);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page]);

  return (
    <>
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Servers</h1>
        <div className={'flex gap-2'}>
          <Button onClick={() => navigate('/admin/servers/new')}>New Server</Button>
        </div>
      </div>
      <Table>
        <Pagination data={servers} onPageSelect={onPageSelect}>
          <div className={'overflow-x-auto'}>
            <table className={'w-full table-auto'}>
              <TableHead>
                <TableHeader name={'ID'} />
                <TableHeader name={'Name'} />
                <TableHeader name={'Owner'} />
                <TableHeader name={'Node'} />
                <TableHeader name={'Status'} />
              </TableHead>

              <ContextMenuProvider>
                <TableBody>
                  {servers.data.map((server) => (
                    <ServerRow key={server.id} server={server} />
                  ))}
                </TableBody>
              </ContextMenuProvider>
            </table>

            {loading ? <Spinner.Centered /> : servers.data.length === 0 ? <NoItems /> : null}
          </div>
        </Pagination>
      </Table>
    </>
  );
};

export default () => {
  return (
    <Container>
      <Routes>
        <Route path={'/'} element={<ServersContainer />} />
        <Route path={'/new'} element={<ServerCreateOrUpdate />} />
        <Route path={'/:id'} element={<ServerCreateOrUpdate />} />
      </Routes>
    </Container>
  );
};