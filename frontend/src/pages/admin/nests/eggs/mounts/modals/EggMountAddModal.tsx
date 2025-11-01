import getMounts from '@/api/admin/mounts/getMounts';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import createEggMount from '@/api/admin/nests/eggs/mounts/createEggMount';
import { useSearchableResource } from '@/plugins/useSearchableResource';

export default ({ nest, egg, opened, onClose }: ModalProps & { nest: Nest; egg: AdminNestEgg }) => {
  const { addToast } = useToast();
  const { addEggMount } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [mount, setMount] = useState<Mount | null>(null);

  const mounts = useSearchableResource<Mount>({ fetcher: (search) => getMounts(1, search) });

  const doAdd = () => {
    load(true, setLoading);

    createEggMount(nest.uuid, egg.uuid, mount.uuid)
      .then(() => {
        addToast('Egg Mount added.', 'success');

        onClose();
        addEggMount({ mount, created: new Date() });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <Modal title={'Add Egg Mount'} onClose={onClose} opened={opened}>
      <Stack>
        <Select
          withAsterisk
          label={'Mount'}
          placeholder={'Mount'}
          value={mount?.uuid}
          onChange={(value) => setMount(mounts.items.find((m) => m.uuid === value))}
          data={mounts.items.map((mount) => ({
            label: mount.name,
            value: mount.uuid,
          }))}
          searchable
          searchValue={mounts.search}
          onSearchChange={mounts.setSearch}
        />

        <Group mt={'md'}>
          <Button onClick={doAdd} loading={loading} disabled={!mount}>
            Add
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
