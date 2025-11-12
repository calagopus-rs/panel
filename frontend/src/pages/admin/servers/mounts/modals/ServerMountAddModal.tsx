import { Group, ModalProps, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import createServerMount from '@/api/admin/servers/mounts/createServerMount';
import getAvailableServerMounts from '@/api/admin/servers/mounts/getAvailableServerMounts';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import Modal from '@/elements/modals/Modal';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';

export default function ServerMountAddModal({ server, opened, onClose }: ModalProps & { server: AdminServer }) {
  const { addToast } = useToast();
  const { addServerMount } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [selectedMount, setSelectedMount] = useState<NodeMount | null>(null);

  const mounts = useSearchableResource<AdminServerMount>({
    fetcher: (search) => getAvailableServerMounts(server.uuid, 1, search),
  });

  useEffect(() => {
    if (!opened) {
      mounts.setSearch('');
      setSelectedMount(null);
    }
  }, [opened]);

  const doAdd = () => {
    setLoading(true);

    createServerMount(server.uuid, { mountUuid: selectedMount.mount.uuid })
      .then(() => {
        addToast('Node Mount added.', 'success');

        onClose();
        addServerMount({ mount: selectedMount.mount, created: new Date() });
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
          value={selectedMount?.mount.uuid}
          onChange={(value) => setSelectedMount(mounts.items.find((m) => m.mount.uuid === value))}
          data={mounts.items.map((mount) => ({
            label: mount.mount.name,
            value: mount.mount.uuid,
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
