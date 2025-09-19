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

  const [mount, setMount] = useState<Mount | null>(null);
  const [mounts, setMounts] = useState<Mount[]>([]);
  const [search, setSearch] = useState('');
  const [doRefetch, setDoRefetch] = useState(false);
  const [loading, setLoading] = useState(false);

  const setDebouncedSearch = useCallback(
    debounce((search: string) => {
      getMounts(1, search)
        .then((data) => {
          setMounts(data.data);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }, 150),
    [],
  );

  useEffect(() => {
    getMounts(1)
      .then((data) => {
        setMounts(data.data);

        if (data.total > data.data.length) {
          setDoRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, []);

  useEffect(() => {
    if (doRefetch) {
      setDebouncedSearch(search);
    }
  }, [search]);

  const doAdd = () => {
    load(true, setLoading);

    createNodeMount(node.uuid, mount.uuid)
      .then(() => {
        addToast('Node Mount added.', 'success');

        onClose();
        addNodeMount({ mount, created: new Date() });
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
          value={mount?.uuid}
          onChange={(value) => setMount(mounts.find((m) => m.uuid === value))}
          data={mounts.map((mount) => ({
            label: mount.name,
            value: mount.uuid,
          }))}
          searchable
          searchValue={search}
          onSearchChange={setSearch}
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
