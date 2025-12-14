import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import getMounts from '@/api/admin/mounts/getMounts.ts';
import createEggMount from '@/api/admin/nests/eggs/mounts/createEggMount.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import Select from '@/elements/input/Select.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { useSearchableResource } from '@/plugins/useSearchableResource.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';

export default function EggMountAddModal({
  nest,
  egg,
  opened,
  onClose,
}: ModalProps & { nest: AdminNest; egg: AdminNestEgg }) {
  const { addToast } = useToast();
  const { addEggMount } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [mount, setMount] = useState<Mount | null>(null);

  const mounts = useSearchableResource<Mount>({ fetcher: (search) => getMounts(1, search) });

  const doAdd = () => {
    setLoading(true);

    createEggMount(nest.uuid, egg.uuid, mount!.uuid)
      .then(() => {
        addToast('Egg Mount added.', 'success');

        onClose();
        addEggMount({ mount: mount!, created: new Date() });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Add Egg Mount' onClose={onClose} opened={opened}>
      <Stack>
        <Select
          withAsterisk
          label='Mount'
          placeholder='Mount'
          value={mount?.uuid}
          onChange={(value) => setMount(mounts.items.find((m) => m.uuid === value) ?? null)}
          data={mounts.items.map((mount) => ({
            label: mount.name,
            value: mount.uuid,
          }))}
          searchable
          searchValue={mounts.search}
          onSearchChange={mounts.setSearch}
        />

        <Group mt='md'>
          <Button onClick={doAdd} loading={loading} disabled={!mount}>
            Add
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
