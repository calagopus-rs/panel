import { httpErrorToHuman } from '@/api/axios';
import updateAllocation from '@/api/server/allocations/updateAllocation';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';
import Modal from '@/elements/modals/Modal';
import { load } from '@/lib/debounce';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';

type Props = ModalProps & {
  allocation: ServerAllocation;
};

export default ({ allocation, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { server, setServer, allocations, setAllocations } = useServerStore();

  const [notes, setNotes] = useState(allocation.notes ?? '');
  const [primary, setPrimary] = useState(allocation.isPrimary);
  const [loading, setLoading] = useState(false);

  const doUpdate = () => {
    load(true, setLoading);

    updateAllocation(server.uuid, allocation.uuid, { notes, primary })
      .then(() => {
        allocation.notes = notes || null;

        if (primary) {
          setAllocations({
            ...allocations,
            data: allocations.data.map((a) => ({ ...a, isPrimary: a.uuid === allocation.uuid })),
          });
          setServer({ ...server, allocation });
        }

        onClose();
        addToast('Allocation updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => load(false, setLoading));
  };

  return (
    <Modal title={'Edit Allocation'} onClose={onClose} opened={opened}>
      <Stack>
        <TextArea
          label={'Notes'}
          placeholder={'Notes'}
          value={notes}
          rows={3}
          onChange={(e) => setNotes(e.target.value)}
        />
        <Switch label={'Primary'} checked={primary} onChange={(e) => setPrimary(e.target.checked)} />

        <Group>
          <Button onClick={doUpdate} loading={loading}>
            Edit
          </Button>
          <Button variant={'default'} onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
