import getMounts from '@/api/admin/mounts/getMounts';
import createNodeMount from '@/api/admin/nodes/mounts/createNodeMount';
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

export default ({ node, opened, onClose }: ModalProps & { node: Node }) => {
  const { addToast } = useToast();
  const { addNodeMount } = useAdminStore();

  const [selectedMount, setSelectedMount] = useState<Mount | null>(null);
  const [mounts, setMounts] = useState<Mount[]>([]);
  const [search, setSearch] = useState('');
  const [doRefetch, setDoRefetch] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchMounts = (search: string) => {
    getMounts(1, search)
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
      setSearch('');
      setSelectedMount(null);
    }
  }, [opened]);

  const doAdd = () => {
    load(true, setLoading);

    createNodeMount(node.uuid, selectedMount.uuid)
      .then(() => {
        addToast('Node Mount added.', 'success');

        onClose();
        addNodeMount({ mount: selectedMount, created: new Date() });
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
          value={selectedMount?.uuid}
          onChange={(value) => setSelectedMount(mounts.find((m) => m.uuid === value))}
          data={mounts.map((mount) => ({
            label: mount.name,
            value: mount.uuid,
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
