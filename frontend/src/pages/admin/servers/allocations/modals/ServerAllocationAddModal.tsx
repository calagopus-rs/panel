import { Group, ModalProps, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import getAvailableNodeAllocations from '@/api/admin/nodes/allocations/getAvailableNodeAllocations.ts';
import createServerAllocation from '@/api/admin/servers/allocations/createServerAllocation.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import MultiSelect from '@/elements/input/MultiSelect.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { formatAllocation } from '@/lib/server.ts';
import { useSearchableResource } from '@/plugins/useSearchableResource.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';

export default function ServerAllocationAddModal({ server, opened, onClose }: ModalProps & { server: AdminServer }) {
  const { addToast } = useToast();
  const { addServerAllocation } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [selectedAllocationUuids, setSelectedAllocationUuids] = useState<string[]>([]);

  const availableAllocations = useSearchableResource<NodeAllocation>({
    fetcher: (search) => getAvailableNodeAllocations(server.node.uuid, 1, search),
  });

  useEffect(() => {
    if (!opened) {
      availableAllocations.setSearch('');
      setSelectedAllocationUuids([]);
    }
  }, [opened]);

  const doAdd = () => {
    setLoading(true);

    let didError = false;
    for (const allocationUuid of selectedAllocationUuids) {
      createServerAllocation(server.uuid, { allocationUuid })
        .then((allocation) => {
          addServerAllocation(allocation);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
          didError = true;
        })
        .finally(() => {
          setLoading(false);
        });
    }

    if (!didError) {
      addToast(`${selectedAllocationUuids.length} allocations added.`, 'success');
      onClose();
    }
  };

  return (
    <Modal title='Add Server Allocations' onClose={onClose} opened={opened}>
      <Stack>
        <MultiSelect
          withAsterisk
          label='Allocations'
          placeholder='Allocations'
          value={selectedAllocationUuids}
          onChange={(value) => setSelectedAllocationUuids(value)}
          data={availableAllocations.items.map((alloc) => ({
            label: formatAllocation(alloc),
            value: alloc.uuid,
          }))}
          searchable
          searchValue={availableAllocations.search}
          onSearchChange={availableAllocations.setSearch}
        />

        <Group mt='md'>
          <Button onClick={doAdd} loading={loading} disabled={!selectedAllocationUuids.length}>
            Add {selectedAllocationUuids.length}
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
