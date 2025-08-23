import { httpErrorToHuman } from '@/api/axios';
import createAllocation from '@/api/server/allocations/createAllocation';
import getAllocations from '@/api/server/allocations/getAllocations';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import AllocationRow from './AllocationRow';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/inputnew/TextInput';
import NewButton from '@/elements/button/NewButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import TableNew from '@/elements/table/TableNew';

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
      <Group justify={'space-between'} mb={'md'}>
        <Title order={1} c={'white'}>
          Network
        </Title>
        <Group>
          <TextInput
            placeholder={'Search...'}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            w={250}
          />
          <NewButton onClick={doAdd} color={'blue'}>
            <FontAwesomeIcon icon={faPlus} className={'mr-2'} />
            Add
          </NewButton>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <TableNew columns={['Hostname', 'Port', 'Note', '', '']} pagination={allocations} onPageSelect={setPage}>
            {allocations.data.map((allocation) => (
              <AllocationRow key={allocation.uuid} allocation={allocation} />
            ))}
          </TableNew>
        </ContextMenuProvider>
      )}
    </>
  );
};
