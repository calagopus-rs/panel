import Modal from '@/elements/modals/Modal';
import { Group, ModalProps, Stack } from '@mantine/core';
import Button from '@/elements/Button';
import React, { useCallback, useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import getAvailableNodeAllocations from '@/api/admin/nodes/allocations/getAvailableNodeAllocations';
import debounce from 'debounce';
import { useToast } from '@/providers/ToastProvider';
import MultiSelect from '@/elements/input/MultiSelect';
import { formatAllocation } from '@/lib/server';
import { load } from '@/lib/debounce';
import createServerAllocation from '@/api/admin/servers/allocations/createServerAllocation';
import { useAdminStore } from '@/stores/admin';

export default ({ server, opened, onClose }: ModalProps & { server: AdminServer }) => {
  const { addToast } = useToast();
  const { addServerAllocation } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [selectedAllocationUuids, setSelectedAllocationUuids] = useState([]);
  const [availableAllocations, setAvailableAllocations] = useState<NodeAllocation[]>([]);
  const [doAllocationsRefetch, setDoAllocationsRefetch] = useState(false);
  const [allocationsSearch, setAllocationsSearch] = useState('');

  const fetchAvailableAllocations = (search: string) => {
    getAvailableNodeAllocations(server.node.uuid, 1, search)
      .then((response) => {
        setAvailableAllocations(response.data);

        if (response.total > response.data.length) {
          setDoAllocationsRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const setDebouncedAvailableAllocationsSearch = useCallback(
    debounce((search: string) => {
      fetchAvailableAllocations(search);
    }, 150),
    [],
  );

  useEffect(() => {
    if (doAllocationsRefetch) {
      setDebouncedAvailableAllocationsSearch(allocationsSearch);
    }
  }, [allocationsSearch]);

  useEffect(() => {
    if (opened) {
      fetchAvailableAllocations('');
    } else {
      setSelectedAllocationUuids([]);
    }
  }, [opened]);

  const doAdd = () => {
    load(true, setLoading);

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
          load(false, setLoading);
        });
    }

    if (!didError) {
      addToast(`${selectedAllocationUuids.length} allocations added.`, 'success');
      onClose();
    }
  };

  return (
    <Modal title={'Add Server Allocations'} onClose={onClose} opened={opened}>
      <Stack>
        <MultiSelect
          withAsterisk
          label={'Allocations'}
          placeholder={'host:port'}
          value={selectedAllocationUuids}
          onChange={(value) => setSelectedAllocationUuids(value)}
          data={availableAllocations.map((alloc) => ({
            label: formatAllocation(alloc),
            value: alloc.uuid,
          }))}
          searchable
          searchValue={allocationsSearch}
          onSearchChange={setAllocationsSearch}
        />

        <Group mt={'md'}>
          <Button onClick={doAdd} loading={loading} disabled={!selectedAllocationUuids.length}>
            Add {selectedAllocationUuids.length}
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
