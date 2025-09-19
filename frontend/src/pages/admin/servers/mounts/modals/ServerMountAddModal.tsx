import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Select from '@/elements/input/Select';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { Group, ModalProps, Stack } from '@mantine/core';
import debounce from 'debounce';
import { useCallback, useEffect, useState } from 'react';
import createServerMount from "@/api/admin/servers/mounts/createServerMount";
import getAvailableServerMounts from "@/api/admin/servers/mounts/getAvailableServerMounts";

export default ({ server, opened, onClose }: ModalProps & { server: AdminServer }) => {
  const { addToast } = useToast();
  const { addServerMount } = useAdminStore();

  const [selectedMount, setSelectedMount] = useState<NodeMount | null>(null);
  const [mounts, setMounts] = useState<NodeMount[]>([]);
  const [search, setSearch] = useState('');
  const [doRefetch, setDoRefetch] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchMounts = (search: string) => {
    getAvailableServerMounts(server.uuid, 1, search)
      .then((response) => {
        setMounts(response.data);

        if (response.total > response.data.length) {
          setDoRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const setDebouncedSearch = useCallback(
    debounce((search: string) => {
      fetchMounts(search);
    }, 150),
    [],
  );

  useEffect(() => {
    if (doRefetch) {
      setDebouncedSearch(search);
    }
  }, [search]);

  useEffect(() => {
    if (opened) {
      fetchMounts('');
    } else {
      setSelectedMount(null);
    }
  }, [opened]);

  const doAdd = () => {
    load(true, setLoading);

    createServerMount(server.uuid, { mountUuid: selectedMount.mount.uuid })
      .then(() => {
        addToast('Node Mount added.', 'success');

        onClose();
        addServerMount({ mount: selectedMount.mount, created: new Date() });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <Modal title={'Add Node Mount'} onClose={onClose} opened={opened}>
      <Stack>
        <Select
          withAsterisk
          label={'Mount'}
          placeholder={'Mount'}
          value={selectedMount?.mount.uuid}
          onChange={(value) => setSelectedMount(mounts.find((m) => m.mount.uuid === value))}
          data={mounts.map((mount) => ({
            label: mount.mount.name,
            value: mount.mount.uuid,
          }))}
          searchable
          searchValue={search}
          onSearchChange={setSearch}
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
};
