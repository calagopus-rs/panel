import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useServerStore } from '@/stores/server';
import { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useSearchParams } from 'react-router';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import DatabaseRow from './DatabaseRow';
import DatabaseCreateDialog from './dialogs/DatabaseCreateDialog';
import getDatabases from '@/api/server/databases/getDatabases';
import createDatabase from '@/api/server/databases/createDatabase';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { server, databases, setDatabases, addDatabase } = useServerStore();

  const [loading, setLoading] = useState(databases.data.length === 0);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState<'create'>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
    setSearch(searchParams.get('search') || '');
  }, []);

  useEffect(() => {
    setSearchParams({ page: page.toString(), search });
  }, [page, search]);

  useEffect(() => {
    getDatabases(server.uuid, page, search).then((data) => {
      setDatabases(data);
      setLoading(false);
    });
  }, [page, search]);

  const doCreate = (name: string) => {
    createDatabase(server.uuid, { name })
      .then((database) => {
        addDatabase(database);
        addToast('Database created.', 'success');
        setOpenDialog(null);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Container>
      <DatabaseCreateDialog onCreate={doCreate} open={openDialog === 'create'} onClose={() => setOpenDialog(null)} />

      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Databases</h1>
        <div className={'flex gap-2'}>
          <Button onClick={() => setOpenDialog('create')}>Create</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper onSearch={setSearch}>
          <Pagination data={databases} onPageSelect={setPage}>
            <div className={'overflow-x-auto'}>
              <table className={'w-full table-auto'}>
                <TableHead>
                  <TableHeader name={'Name'} />
                  <TableHeader name={'Address'} />
                  <TableHeader name={'Username'} />
                  <TableHeader />
                </TableHead>

                <ContextMenuProvider>
                  <TableBody>
                    {databases.data.map((database) => (
                      <DatabaseRow database={database} key={database.uuid} />
                    ))}
                  </TableBody>
                </ContextMenuProvider>
              </table>

              {loading ? <Spinner.Centered /> : databases.data.length === 0 ? <NoItems /> : null}
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
    </Container>
  );
};
