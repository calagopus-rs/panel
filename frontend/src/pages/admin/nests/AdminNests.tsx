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
import NestRow from './NestRow';
import NestCreateOrUpdate from './NestCreateOrUpdate';
import getNests from '@/api/admin/nests/getNests';

const NestsContainer = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { nests, setNests } = useAdminStore();

  const [loading, setLoading] = useState(nests.data.length === 0);
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
    getNests(page, search)
      .then((data) => {
        setNests(data);
        setLoading(false);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, [page, search]);

  return (
    <>
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Nests</h1>
        <div className={'flex gap-2'}>
          <Button onClick={() => navigate('/admin/nests/new')}>New Nest</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper onSearch={setSearch}>
          <Pagination data={nests} onPageSelect={setPage}>
            <div className={'overflow-x-auto'}>
              <table className={'w-full table-auto'}>
                <TableHead>
                  <TableHeader name={'ID'} />
                  <TableHeader name={'Name'} />
                  <TableHeader name={'Description'} />
                </TableHead>

                <ContextMenuProvider>
                  <TableBody>
                    {nests.data.map((nest) => (
                      <NestRow key={nest.id} nest={nest} />
                    ))}
                  </TableBody>
                </ContextMenuProvider>
              </table>

              {loading ? <Spinner.Centered /> : nests.data.length === 0 ? <NoItems /> : null}
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
        <Route path={'/'} element={<NestsContainer />} />
        <Route path={'/new'} element={<NestCreateOrUpdate />} />
        <Route path={'/:id'} element={<NestCreateOrUpdate />} />
      </Routes>
    </Container>
  );
};
