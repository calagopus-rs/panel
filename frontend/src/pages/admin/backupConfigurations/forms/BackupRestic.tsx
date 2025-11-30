import { Divider, Group, Stack, Title } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { z } from 'zod';
import MultiKeyValueInput from '@/elements/input/MultiKeyValueInput';
import NumberInput from '@/elements/input/NumberInput';
import PasswordInput from '@/elements/input/PasswordInput';
import TextInput from '@/elements/input/TextInput';
import { adminBackupConfigurationSchema } from '@/lib/schemas';

export default function BackupRestic({ form }: { form: UseFormReturnType<z.infer<typeof adminBackupConfigurationSchema>> }) {
  return (
    <Stack gap='xs'>
      <Stack gap={0}>
        <Title order={2}>Restic Settings</Title>
        <Divider />
      </Stack>

      <Stack>
        <Group grow>
          <TextInput
            withAsterisk
            label='Repository'
            placeholder='Repository'
            {...form.getInputProps('backupConfigs.restic.repository')}
          />
          <NumberInput
            withAsterisk
            label='Retry Lock Seconds'
            placeholder='Retry Lock Seconds'
            {...form.getInputProps('backupConfigs.restic.retryLockSeconds')}
          />
        </Group>

        <PasswordInput
          withAsterisk
          label='Password'
          placeholder='Password'
          value={form.values.backupConfigs.restic?.environment?.RESTIC_PASSWORD || ''}
          onChange={(e) =>
            form.setFieldValue('form.values.backupConfigs.restic.environment.RESTIC_PASSWORD', e.target.value)
          }
        />

        <MultiKeyValueInput
          label='Environment Variables'
          allowReordering={false}
          options={form.values.backupConfigs.restic?.environment}
          onChange={(e) => form.setFieldValue('form.values.backupConfigs.restic.environment', e)}
          transformValue={(key, value) => (key === 'AWS_SECRET_ACCESS_KEY' ? '*'.repeat(value.length) : value)}
          hideKey={(key) => key === 'RESTIC_PASSWORD'}
        />
      </Stack>
    </Stack>
  );
}
