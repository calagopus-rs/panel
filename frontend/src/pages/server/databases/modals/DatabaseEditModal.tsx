import { Group, ModalProps, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import updateDatabase from '@/api/server/databases/updateDatabase';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import Modal from '@/elements/modals/Modal';
import { serverDatabaseEditSchema } from '@/lib/schemas/server/databases';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

type Props = ModalProps & {
  database: ServerDatabase;
};

export default function DatabaseEditModal({ database, opened, onClose }: Props) {
  const { addToast } = useToast();
  const server = useServerStore((state) => state.server);

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverDatabaseEditSchema>>({
    initialValues: {
      locked: database.isLocked,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverDatabaseEditSchema),
  });

  const doUpdate = () => {
    setLoading(true);

    updateDatabase(server.uuid, database.uuid, form.values)
      .then(() => {
        database.isLocked = form.values.locked;
        onClose();
        addToast('Database updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Edit Database' onClose={onClose} opened={opened}>
      <form onSubmit={form.onSubmit(() => doUpdate())}>
        <Stack>
          <Switch
            label='Locked'
            name='locked'
            checked={form.values.locked}
            onChange={(e) => form.setFieldValue('locked', e.target.checked)}
          />

          <Group>
            <Button type='submit' loading={loading}>
              Save
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
