import { Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import updateServerSettings from '@/api/admin/settings/updateServerSettings.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import NumberInput from '@/elements/input/NumberInput.tsx';
import SizeInput from '@/elements/input/SizeInput.tsx';
import Switch from '@/elements/input/Switch.tsx';
import { adminSettingsServerSchema } from '@/lib/schemas/admin/settings.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useAdminStore } from '@/stores/admin.tsx';

export default function ServerContainer() {
  const { addToast } = useToast();
  const { server } = useAdminStore();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof adminSettingsServerSchema>>({
    initialValues: {
      maxFileManagerViewSize: 0,
      maxFileManagerContentSearchSize: 0,
      maxFileManagerSearchResults: 1,
      maxSchedulesStepCount: 0,
      allowOverwritingCustomDockerImage: false,
      allowEditingStartupCommand: false,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminSettingsServerSchema),
  });

  useEffect(() => {
    form.setValues({
      ...server,
    });
  }, [server]);

  const doUpdate = () => {
    setLoading(true);

    updateServerSettings(form.values)
      .then(() => {
        addToast('Server settings updated.', 'success');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <AdminContentContainer title='Server Settings' titleOrder={2}>
      <form onSubmit={form.onSubmit(() => doUpdate())}>
        <Stack>
          <Group grow>
            <SizeInput
              withAsterisk
              label='Max File Manager View Size'
              mode='b'
              min={0}
              value={form.values.maxFileManagerViewSize}
              onChange={(v) => form.setFieldValue('maxFileManagerViewSize', v)}
            />

            <NumberInput
              withAsterisk
              label='Max Server Schedule Steps'
              placeholder='Max Server Schedule Steps'
              {...form.getInputProps('maxSchedulesStepCount')}
            />
          </Group>

          <Group grow>
            <SizeInput
              withAsterisk
              label='Max File Manager Content Search Size'
              mode='b'
              min={0}
              value={form.values.maxFileManagerContentSearchSize}
              onChange={(v) => form.setFieldValue('maxFileManagerContentSearchSize', v)}
            />

            <NumberInput
              withAsterisk
              label='Max File Manager Search Results'
              placeholder='Max File Manager Search Results'
              {...form.getInputProps('maxFileManagerSearchResults')}
            />
          </Group>

          <Group grow>
            <Switch
              label='Allow Overwriting Custom Docker Image'
              description='If enabled, users will be able to overwrite the Docker image specified in the server configuration using the Eggs list, even if an admin has set a custom Docker image.'
              checked={form.values.allowOverwritingCustomDockerImage}
              onChange={(e) => form.setFieldValue('allowOverwritingCustomDockerImage', e.target.checked)}
            />

            <Switch
              label='Allow Editing Startup Command'
              checked={form.values.allowEditingStartupCommand}
              onChange={(e) => form.setFieldValue('allowEditingStartupCommand', e.target.checked)}
            />
          </Group>
        </Stack>

        <Group mt='md'>
          <Button type='submit' disabled={!form.isValid()} loading={loading}>
            Save
          </Button>
        </Group>
      </form>
    </AdminContentContainer>
  );
}
