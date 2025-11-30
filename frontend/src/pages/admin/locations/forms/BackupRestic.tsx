import { Divider, Group, Stack, Title } from '@mantine/core';
import { Dispatch } from 'react';
import MultiKeyValueInput from '@/elements/input/MultiKeyValueInput';
import NumberInput from '@/elements/input/NumberInput';
import TextInput from '@/elements/input/TextInput';

export default function BackupRestic({
  backupConfig,
  setBackupConfigs,
}: {
  backupConfig: BackupDiskConfigurationRestic;
  setBackupConfigs: Dispatch<BackupDiskConfigurationRestic>;
}) {
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
            value={backupConfig?.repository || ''}
            onChange={(e) => setBackupConfigs({ ...backupConfig, repository: e.target.value })}
          />
          <NumberInput
            withAsterisk
            label='Retry Lock Seconds'
            placeholder='Retry Lock Seconds'
            value={backupConfig?.retryLockSeconds || 0}
            onChange={(value) => setBackupConfigs({ ...backupConfig, retryLockSeconds: Number(value) })}
          />
        </Group>

        <TextInput
          withAsterisk
          label='Password'
          placeholder='Password'
          type='password'
          value={backupConfig?.environment?.RESTIC_PASSWORD || ''}
          onChange={(e) =>
            setBackupConfigs({
              ...backupConfig,
              environment: { ...backupConfig.environment, RESTIC_PASSWORD: e.target.value },
            })
          }
        />

        <MultiKeyValueInput
          label='Environment Variables'
          allowReordering={false}
          options={backupConfig.environment || {}}
          onChange={(e) => setBackupConfigs({ ...backupConfig, environment: e })}
          transformValue={(key, value) => (key === 'AWS_SECRET_ACCESS_KEY' ? '*'.repeat(value.length) : value)}
          hideKey={(key) => key === 'RESTIC_PASSWORD'}
        />
      </Stack>
    </Stack>
  );
}
