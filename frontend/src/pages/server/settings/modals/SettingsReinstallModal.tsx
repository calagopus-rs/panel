import { Group, ModalProps } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { httpErrorToHuman } from '@/api/axios';
import installServer from '@/api/server/settings/installServer';
import Button from '@/elements/Button';
import Switch from '@/elements/input/Switch';
import Modal from '@/elements/modals/Modal';
import { serverSettingssReinstallSchema } from '@/lib/schemas/server/settings.ts';
import { useToast } from '@/providers/ToastProvider';
import { useServerStore } from '@/stores/server';

export default function SettingsReinstallModal({ opened, onClose }: ModalProps) {
  const { addToast } = useToast();
  const { server, updateServer } = useServerStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof serverSettingssReinstallSchema>>({
    initialValues: {
      truncateDirectory: false,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(serverSettingssReinstallSchema),
  });

  const doReinstall = () => {
    setLoading(true);

    installServer(server.uuid, form.values)
      .then(() => {
        addToast('Reinstalling server...', 'success');

        navigate(`/server/${server.uuidShort}`);
        updateServer({ status: 'installing' });
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <Modal title='Reinstall Server' onClose={onClose} opened={opened}>
      <form onSubmit={form.onSubmit(() => doReinstall())}>
        <Switch
          label='Do you want to empty the filesystem of this server before reinstallation?'
          name='truncate'
          defaultChecked={form.values.truncateDirectory}
          onChange={(e) => form.setFieldValue('truncateDirectory', e.target.checked)}
        />

        <Group mt='md'>
          <Button color='red' type='submit' loading={loading} disabled={!form.isValid()}>
            Reinstall
          </Button>
          <Button variant='default' onClick={onClose}>
            Close
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
