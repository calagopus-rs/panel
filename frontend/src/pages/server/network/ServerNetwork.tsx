import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { httpErrorToHuman } from '@/api/axios';
import createAllocation from '@/api/server/allocations/createAllocation';
import getAllocations from '@/api/server/allocations/getAllocations';
import Button from '@/elements/Button';
import ConditionalTooltip from '@/elements/ConditionalTooltip';
import { ContextMenuProvider } from '@/elements/ContextMenu';
import TextInput from '@/elements/input/TextInput';
import Table from '@/elements/Table';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import AllocationRow from './AllocationRow';

export default function ServerNetwork() {
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
      <Group justify='space-between' align='start' mb='md'>
        <Title order={1} c='white'>
          Network
          <p className='text-xs text-gray-300!'>
            {allocations.total} of {server.featureLimits.allocations} maximum allocations assigned.
          </p>
        </Title>
        <Group>
          <TextInput placeholder='Search...' value={search} onChange={(e) => setSearch(e.target.value)} w={250} />
          <ConditionalTooltip
            enabled={allocations.total >= server.featureLimits.allocations}
            label={`This server is limited to ${server.featureLimits.allocations} allocations.`}
          >
            <Button
              disabled={allocations.total >= server.featureLimits.allocations}
              onClick={doAdd}
              color='blue'
              leftSection={<FontAwesomeIcon icon={faPlus} />}
            >
              Add
            </Button>
          </ConditionalTooltip>
        </Group>
      </Group>

      <ContextMenuProvider>
        <Table
          columns={['Hostname', 'Port', 'Note', '', '']}
          loading={loading}
          pagination={allocations}
          onPageSelect={setPage}
        >
          {allocations.data.map((allocation) => (
            <AllocationRow key={allocation.uuid} allocation={allocation} />
          ))}
        </Table>
      </ContextMenuProvider>
    </>
  );
}
