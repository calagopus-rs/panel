import { httpErrorToHuman } from '@/api/axios';
import createAllocation from '@/api/server/allocations/createAllocation';
import getAllocations from '@/api/server/allocations/getAllocations';
import { Button } from '@/elements/button';
import Spinner from '@/elements/Spinner';
import Table, { ContentWrapper, NoItems, Pagination, TableBody, TableHead, TableHeader } from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import AllocationRow from './AllocationRow';
import { ContextMenuProvider } from '@/elements/ContextMenu';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { server, allocations, setAllocations, addAllocation } = useServerStore();

  const [loading, setLoading] = useState(allocations.data.length === 0);
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
    getAllocations(server.uuid, page, search).then((data) => {
      setAllocations(data);
      setLoading(false);
    });
  }, [page, search]);

  const doAdd = () => {
    createAllocation(server.uuid)
      .then((alloc) => {
        addAllocation(alloc);
        addToast('Allocation created.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <div className={'mb-4 flex justify-between'}>
        <h1 className={'text-4xl font-bold text-white'}>Network</h1>
        <div className={'flex gap-2'}>
          <Button onClick={doAdd}>Add new</Button>
        </div>
      </div>
      <Table>
        <ContentWrapper onSearch={setSearch}>
          <Pagination data={allocations} onPageSelect={setPage}>
            <div className={'overflow-x-auto'}>
              <table className={'w-full table-auto'}>
                <TableHead>
                  <TableHeader name={'Hostname'} />
                  <TableHeader name={'Port'} />
                  <TableHeader name={'Note'} />
                  <TableHeader />
                  <TableHeader />
                </TableHead>

                <ContextMenuProvider>
                  <TableBody>
                    {allocations.data.map((allocation) => (
                      <AllocationRow key={allocation.uuid} allocation={allocation} />
                    ))}
                  </TableBody>
                </ContextMenuProvider>
              </table>

              {loading ? <Spinner.Centered /> : allocations.data.length === 0 ? <NoItems /> : null}
            </div>
          </Pagination>
        </ContentWrapper>
      </Table>
    </>
  );
};
