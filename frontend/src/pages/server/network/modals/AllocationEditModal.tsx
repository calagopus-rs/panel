import { httpErrorToHuman } from '@/api/axios';
import updateAllocation from '@/api/server/allocations/updateAllocation';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';
import Modal from '@/elements/modals/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';
import { Group, ModalProps } from '@mantine/core';
import { useState } from 'react';

type Props = ModalProps & {
  allocation: ServerAllocation;
};

export default ({ allocation, opened, onClose }: Props) => {
  const { addToast } = useToast();
  const { server, allocations, setAllocations } = useServerStore();

  const [notes, setNotes] = useState(allocation.notes ?? '');
  const [primary, setPrimary] = useState(allocation.isPrimary);

  const doUpdate = () => {
    updateAllocation(server.uuid, allocation.uuid, { notes, primary })
      .then(() => {
        allocation.notes = notes || null;

        if (primary) {
          setAllocations({
            ...allocations,
            data: allocations.data.map((a) => ({ ...a, isPrimary: a.uuid === allocation.uuid })),
          });
        }

        onClose();
        addToast('Allocation updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <Modal title={'Edit Allocation'} onClose={onClose} opened={opened}>
      <TextArea
        label={'Notes'}
        placeholder={'Notes'}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        mt={'sm'}
      />

      <Switch label={'Primary'} checked={primary} onChange={(e) => setPrimary(e.target.checked)} mt={'sm'} />

      <Group mt={'md'}>
        <Button onClick={doUpdate}>Edit</Button>
        <Button variant={'default'} onClick={onClose}>
          Close
        </Button>
      </Group>
    </Modal>
  );
};
