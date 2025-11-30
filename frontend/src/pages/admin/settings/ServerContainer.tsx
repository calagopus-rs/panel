import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import updateServerSettings from '@/api/admin/settings/updateServerSettings';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import NumberInput from '@/elements/input/NumberInput';
import SizeInput from '@/elements/input/SizeInput';
import Switch from '@/elements/input/Switch';
import { adminSettingsEmailSchema, adminSettingsServerSchema } from '@/lib/schemas';
import { bytesToString } from '@/lib/size';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';

export default function ServerContainer() {
  const { addToast } = useToast();
  const { server } = useAdminStore();

  const [loading, setLoading] = useState(false);
  const [maxFileManagerViewSizeInput, setMaxFileManagerViewSizeInput] = useState<string>(
    bytesToString(server.maxFileManagerViewSize),
  );

  const form = useForm<z.infer<typeof adminSettingsServerSchema>>({
    initialValues: {
      maxFileManagerViewSize: 0,
      maxSchedulesStepCount: 0,
      allowOverwritingCustomDockerImage: false,
      allowEditingStartupCommand: false,
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminSettingsEmailSchema),
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
    <>
      <Title mt='md' order={2}>
        Server Settings
      </Title>

      <Stack>
        <Group grow>
          <SizeInput
            label='Max File Manager View Size + Unit (e.g. 2GB)'
            placeholder='Max File Manager View Size'
            value={maxFileManagerViewSizeInput}
            setState={setMaxFileManagerViewSizeInput}
            onChange={(value) => form.setFieldValue('maxFileManagerViewSize', value)}
          />

          <NumberInput
            label='Max Server Schedule Steps'
            placeholder='Max Server Schedule Steps'
            {...form.getInputProps('maxSchedulesStepCount')}
          />
        </Group>

        <Group grow>
          <Switch
            label='Allow Overwriting Custom Docker Image'
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
        <Button onClick={doUpdate} loading={loading}>
          Save
        </Button>
      </Group>
    </>
  );
}
