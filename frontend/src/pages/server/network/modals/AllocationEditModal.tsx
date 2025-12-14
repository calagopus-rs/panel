import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios.ts';
import updateAllocation from '@/api/server/allocations/updateAllocation.ts';
import Button from '@/elements/Button.tsx';
import TextArea from '@/elements/input/TextArea.tsx';
import Modal from '@/elements/modals/Modal.tsx';
import { serverAllocationsEditSchema } from '@/lib/schemas/server/allocations.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

type Props = ModalProps & {
  allocation: ServerAllocation;
};

export default function AllocationEditModal({ allocation, opened, onClose }: Props) {
  const { addToast } = useToast();
  const { server } = useServerStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverAllocationsEditSchema>>({
    initialValues: {
      notes: allocation.notes ?? '',
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverAllocationsEditSchema),
  });

  const doUpdate = () => {
    setLoading(true);

    updateAllocation(server.uuid, allocation.uuid, { notes: form.values.notes })
      .then(() => {
        allocation.notes = form.values.notes || null;

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
      <form onSubmit={form.onSubmit(() => doUpdate())}>
        <Stack>
          <TextArea label='Notes' placeholder='Notes' rows={3} {...form.getInputProps('notes')} />

          <Group>
            <Button type='submit' loading={loading}>
              Edit
            </Button>
            <Button variant='default' onClick={onClose}>
              Close
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
