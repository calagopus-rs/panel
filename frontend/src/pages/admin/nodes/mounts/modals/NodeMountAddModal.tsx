import { Group, ModalProps, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import getMounts from '@/api/admin/mounts/getMounts';
import createNodeMount from '@/api/admin/nodes/mounts/createNodeMount';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import Modal from '@/elements/modals/Modal';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';

export default function NodeMountAddModal({ node, opened, onClose }: ModalProps & { node: Node }) {
  const { addToast } = useToast();
  const { addNodeMount } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [selectedMount, setSelectedMount] = useState<Mount | null>(null);

  const mounts = useSearchableResource<Mount>({ fetcher: (search) => getMounts(1, search) });

  useEffect(() => {
    if (!opened) {
      mounts.setSearch('');
      setSelectedMount(null);
    }
  }, [opened]);

  const doAdd = () => {
    setLoading(true);

    createNodeMount(node.uuid, selectedMount.uuid)
      .then(() => {
        addToast('Node Mount added.', 'success');

        onClose();
        addNodeMount({ mount: selectedMount, created: new Date() });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title={'Add Node Mount'} onClose={onClose} opened={opened}>
      <Stack>
        <Select
          withAsterisk
          label={'Mount'}
          placeholder={'Mount'}
          value={selectedMount?.uuid}
          onChange={(value) => setSelectedMount(mounts.items.find((m) => m.uuid === value))}
          data={mounts.items.map((mount) => ({
            label: mount.name,
            value: mount.uuid,
          }))}
          searchable
          searchValue={mounts.search}
          onSearchChange={mounts.setSearch}
        />

        <Group mt={'md'}>
          <Button onClick={doAdd} loading={loading} disabled={!selectedMount}>
            Add
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
