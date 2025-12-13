import { Group, ModalProps, Stack } from '@mantine/core';
import { useState } from 'react';
import { httpErrorToHuman } from '@/api/axios';
import updateAllocation from '@/api/server/allocations/updateAllocation';
import Button from '@/elements/Button';
import TextArea from '@/elements/input/TextArea';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

type Props = ModalProps & {
  allocation: ServerAllocation;
};

export default function AllocationEditModal({ allocation, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { server } = useServerStore();

  const [notes, setNotes] = useState(allocation.notes ?? '');
  const [loading, setLoading] = useState(false);

  const doUpdate = () => {
    setLoading(true);

    updateAllocation(server.uuid, allocation.uuid, { notes })
      .then(() => {
        allocation.notes = notes || null;

        onClose();
        addToast('Allocation updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Edit Allocation' onClose={onClose} opened={opened}>
      <Stack>
        <TextArea label='Notes' placeholder='Notes' value={notes} rows={3} onChange={(e) => setNotes(e.target.value)} />

        <Group>
          <Button onClick={doUpdate} loading={loading}>
            Edit
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
