import { httpErrorToHuman } from '@/api/axios';
import createAllocation from '@/api/server/allocations/createAllocation';
import getAllocations from '@/api/server/allocations/getAllocations';
import createBackup from '@/api/server/backups/createBackup';
import getBackups from '@/api/server/backups/getBackups';
import { Button } from '@/elements/button';
import Code from '@/elements/Code';
import Container from '@/elements/Container';
import Spinner from '@/elements/Spinner';
import Table, {
  ContentWrapper,
  NoItems,
  Pagination,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/elements/table/Table';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';

export default () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();
  const { server, allocations, setAllocations, addAllocation } = useServerStore();

  const [loading, setLoading] = useState(allocations.data.length === 0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(Number(searchParams.get('page')) || 1);
  }, []);

  const onPageSelect = (page: number) => {
    setSearchParams({ page: page.toString() });
  };

  useEffect(() => {
    getAllocations(server.uuid, page).then(data => {
      setAllocations(data);
      setLoading(false);
    });
  }, [page]);

  const doAdd = () => {
    createAllocation(server.uuid)
      .then(alloc => {
        addAllocation(alloc);
        addToast('Allocation created.', 'success');
      })
      .catch(msg => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-bold text-white">Network</h1>
        <div className="flex gap-2">
          <Button onClick={doAdd}>Add new</Button>
        </div>
      </div>
      <Table>
        <Pagination data={allocations} onPageSelect={onPageSelect}>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <TableHead>
                <TableHeader name="ID" />
                <TableHeader name="Hostname" />
                <TableHeader name="Port" />
                <TableHeader name="Note" />
                <TableHeader />
              </TableHead>

              <TableBody>
                {allocations.data.map(allocation => (
                  <TableRow key={allocation.id}>
                    <td className="px-6 text-sm text-neutral-100 text-left whitespace-nowrap">
                      <Code>{allocation.id}</Code>
                    </td>

                    <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                      <Code>{allocation.ipAlias ?? allocation.ip}</Code>
                    </td>

                    <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                      <Code>{allocation.port}</Code>
                    </td>

                    <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap" title={allocation.notes}>
                      {allocation.notes}
                    </td>

                    <td className="px-6 text-sm text-neutral-200 text-left whitespace-nowrap">
                      {allocation.isPrimary ? 'Default' : 'Custom'}
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </table>

            {loading ? <Spinner.Centered /> : allocations.data.length === 0 ? <NoItems /> : null}
          </div>
        </Pagination>
      </Table>
    </Container>
  );
};
