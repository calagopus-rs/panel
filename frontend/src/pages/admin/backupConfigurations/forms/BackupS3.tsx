import { Divider, Group, Stack, Title } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { z } from 'zod';
import NumberInput from '@/elements/input/NumberInput.tsx';
import PasswordInput from '@/elements/input/PasswordInput.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { adminBackupConfigurationS3Schema } from '@/lib/schemas/admin/backupConfigurations.ts';

export default function BackupS3({
  form,
}: {
  form: UseFormReturnType<z.infer<typeof adminBackupConfigurationS3Schema>>;
}) {
  return (
    <Stack gap='xs'>
      <Stack gap={0}>
        <Title order={2}>S3 Settings</Title>
        <Divider />
      </Stack>

      <Stack>
        <Group grow>
          <TextInput withAsterisk label='Access Key' placeholder='Access Key' {...form.getInputProps('accessKey')} />
          <PasswordInput
            withAsterisk
            label='Secret Key'
            placeholder='Secret Key'
            {...form.getInputProps('secretKey')}
          />
        </Group>

        <Group grow>
          <TextInput withAsterisk label='Bucket' placeholder='Bucket' {...form.getInputProps('bucket')} />
          <TextInput withAsterisk label='Region' placeholder='Region' {...form.getInputProps('region')} />
        </Group>

        <Group grow>
          <TextInput withAsterisk label='Endpoint' placeholder='Endpoint' {...form.getInputProps('endpoint')} />
          <NumberInput withAsterisk label='Part Size' placeholder='Part Size' {...form.getInputProps('partSize')} />
        </Group>

        <Switch
          label={form.values.pathStyle ? 'Using path-style URLs' : 'Using virtual-hosted-style URLs'}
          checked={form.values.pathStyle}
          onChange={(e) => form.setFieldValue('pathStyle', e.target.checked)}
        />
      </Stack>
    </Stack>
  );
}
