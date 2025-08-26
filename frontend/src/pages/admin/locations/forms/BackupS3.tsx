import NumberInput from '@/elements/input/NumberInput';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { Divider, Group, Stack, Title } from '@mantine/core';
import { Dispatch } from 'react';

export default ({
  backupConfig,
  setBackupConfigs,
}: {
  backupConfig: LocationConfigBackupConfigsS3;
  setBackupConfigs: Dispatch<LocationConfigBackupConfigsS3>;
}) => {
  return (
    <Stack gap={'xs'}>
      <Stack gap={0}>
        <Title order={2}>S3 Settings</Title>
        <Divider />
      </Stack>

      <Stack>
        <Group grow>
          <TextInput
            withAsterisk
            label={'Access Key'}
            placeholder={'Access Key'}
            value={backupConfig?.accessKey || ''}
            onChange={(e) => setBackupConfigs({ ...backupConfig, accessKey: e.target.value })}
          />
          <TextInput
            withAsterisk
            label={'Secret Key'}
            placeholder={'Secret Key'}
            type={'password'}
            value={backupConfig?.secretKey || ''}
            onChange={(e) => setBackupConfigs({ ...backupConfig, secretKey: e.target.value })}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label={'Bucket'}
            placeholder={'Bucket'}
            value={backupConfig?.bucket || ''}
            onChange={(e) => setBackupConfigs({ ...backupConfig, bucket: e.target.value })}
          />
          <TextInput
            withAsterisk
            label={'Region'}
            placeholder={'Region'}
            value={backupConfig?.region || ''}
            onChange={(e) => setBackupConfigs({ ...backupConfig, region: e.target.value })}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label={'Endpoint'}
            placeholder={'Endpoint'}
            value={backupConfig?.endpoint || ''}
            onChange={(e) => setBackupConfigs({ ...backupConfig, endpoint: e.target.value })}
          />
          <NumberInput
            withAsterisk
            label={'Part Size'}
            placeholder={'Part Size'}
            value={backupConfig?.partSize || 0}
            onChange={(value) => setBackupConfigs({ ...backupConfig, partSize: Number(value) })}
          />
        </Group>

        <Switch
          label={backupConfig?.pathStyle ? 'Using path-style URLs' : 'Using virtual-hosted-style URLs'}
          checked={backupConfig?.pathStyle || false}
          onChange={(e) => setBackupConfigs({ ...backupConfig, pathStyle: e.currentTarget.checked })}
        />
      </Stack>
    </Stack>
  );
};
