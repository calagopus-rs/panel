import { Divider, Group, Stack, Title } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { z } from 'zod';
import MultiKeyValueInput from '@/elements/input/MultiKeyValueInput';
import NumberInput from '@/elements/input/NumberInput';
import PasswordInput from '@/elements/input/PasswordInput';
import TextInput from '@/elements/input/TextInput';
import { adminBackupConfigurationResticSchema } from '@/lib/schemas/admin/backupConfigurations';

export default function BackupRestic({
  form,
}: {
  form: UseFormReturnType<z.infer<typeof adminBackupConfigurationResticSchema>>;
}) {
  return (
    <Stack gap='xs'>
      <Stack gap={0}>
        <Title order={2}>Restic Settings</Title>
        <Divider />
      </Stack>

      <Stack>
        <Group grow>
          <TextInput withAsterisk label='Repository' placeholder='Repository' {...form.getInputProps('repository')} />
          <NumberInput
            withAsterisk
            label='Retry Lock Seconds'
            placeholder='Retry Lock Seconds'
            {...form.getInputProps('retryLockSeconds')}
          />
        </Group>

        <PasswordInput
          withAsterisk
          label='Password'
          placeholder='Password'
          value={form.values.environment?.RESTIC_PASSWORD || ''}
          onChange={(e) => form.setFieldValue('environment.RESTIC_PASSWORD', e.target.value)}
        />

        <MultiKeyValueInput
          label='Environment Variables'
          allowReordering={false}
          options={form.values.environment}
          onChange={(e) => form.setFieldValue('environment', e)}
          transformValue={(key, value) => (key === 'AWS_SECRET_ACCESS_KEY' ? '*'.repeat(value.length) : value)}
          hideKey={(key) => key === 'RESTIC_PASSWORD'}
        />
      </Stack>
    </Stack>
  );
}
