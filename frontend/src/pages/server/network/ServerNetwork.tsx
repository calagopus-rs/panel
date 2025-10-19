import { httpErrorToHuman } from '@/api/axios';
import createAllocation from '@/api/server/allocations/createAllocation';
import getAllocations from '@/api/server/allocations/getAllocations';
import Spinner from '@/elements/Spinner';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import AllocationRow from './AllocationRow';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import { Group, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Button from '@/elements/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';

export default () => {
  const { addToast } = useToast();
  const { server, allocations, setAllocations, addAllocation } = useServerStore();

  const { loading, search, setSearch, setPage } = useSearchablePaginatedTable({
    fetcher: (page, search) => getAllocations(server.uuid, page, search),
    setStoreData: setAllocations,
  });

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
          <TextInput placeholder={'Search...'} value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <Button onClick={doAdd} color={'blue'} leftSection={<FontAwesomeIcon icon={faPlus} />}>
            Add
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Spinner.Centered />
      ) : (
        <ContextMenuProvider>
          <Table columns={['Hostname', 'Port', 'Note', '', '']} pagination={allocations} onPageSelect={setPage}>
            {allocations.data.map((allocation) => (
              <AllocationRow key={allocation.uuid} allocation={allocation} />
            ))}
          </Table>
        </ContextMenuProvider>
      )}
    </>
  );
};
