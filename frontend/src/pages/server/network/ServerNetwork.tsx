import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Group, Title } from '@mantine/core';
import { httpErrorToHuman } from '@/api/axios.ts';
import createAllocation from '@/api/server/allocations/createAllocation.ts';
import getAllocations from '@/api/server/allocations/getAllocations.ts';
import Button from '@/elements/Button.tsx';
import ConditionalTooltip from '@/elements/ConditionalTooltip.tsx';
import { ContextMenuProvider } from '@/elements/ContextMenu.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import Table from '@/elements/Table.tsx';
import { useSearchablePaginatedTable } from '@/plugins/useSearchablePageableTable.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import AllocationRow from './AllocationRow.tsx';

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
    <ServerContentContainer
      title='Network'
      subtitle={`${allocations.total} of ${server.featureLimits.allocations} maximum allocations assigned.`}
      search={search}
      setSearch={setSearch}
      contentRight={
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
      }
    >
      <ContextMenuProvider>
        <Table
          columns={['', 'Hostname', 'Port', 'Notes', 'Created', '']}
          loading={loading}
          pagination={allocations}
          onPageSelect={setPage}
        >
          {allocations.data.map((allocation) => (
            <AllocationRow key={allocation.uuid} allocation={allocation} />
          ))}
        </Table>
      </ContextMenuProvider>
    </ServerContentContainer>
  );
}
