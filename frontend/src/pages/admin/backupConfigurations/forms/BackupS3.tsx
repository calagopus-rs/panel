import { Divider, Group, Stack, Title } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { z } from 'zod';
import NumberInput from '@/elements/input/NumberInput';
import PasswordInput from '@/elements/input/PasswordInput';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { backupConfigurationSchema } from '@/schemas';

export default function BackupS3({ form }: { form: UseFormReturnType<z.infer<typeof backupConfigurationSchema>> }) {
  return (
    <Stack gap='xs'>
      <Stack gap={0}>
        <Title order={2}>S3 Settings</Title>
        <Divider />
      </Stack>

      <Stack>
        <Group grow>
          <TextInput
            withAsterisk
            label='Access Key'
            placeholder='Access Key'
            {...form.getInputProps('backupConfigs.s3.accessKey')}
          />
          <PasswordInput
            withAsterisk
            label='Secret Key'
            placeholder='Secret Key'
            {...form.getInputProps('backupConfigs.s3.secretKey')}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label='Bucket'
            placeholder='Bucket'
            {...form.getInputProps('backupConfigs.s3.bucket')}
          />
          <TextInput
            withAsterisk
            label='Region'
            placeholder='Region'
            {...form.getInputProps('backupConfigs.s3.region')}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label='Endpoint'
            placeholder='Endpoint'
            {...form.getInputProps('backupConfigs.s3.endpoint')}
          />
          <NumberInput
            withAsterisk
            label='Part Size'
            placeholder='Part Size'
            {...form.getInputProps('backupConfigs.s3.partSize')}
          />
        </Group>

        <Switch
          label={form.values.backupConfigs.s3.pathStyle ? 'Using path-style URLs' : 'Using virtual-hosted-style URLs'}
          checked={form.values.backupConfigs.s3.pathStyle || false}
          onChange={(e) => form.setFieldValue('form.values.backupConfigs.s3.pathStyle', e.target.checked)}
        />
      </Stack>
    </Stack>
  );
}
