import NumberInput from '@/elements/input/NumberInput';
import Switch from '@/elements/input/Switch';
import TextInput from '@/elements/input/TextInput';
import { Divider, Group, Title } from '@mantine/core';
import { Dispatch } from 'react';

export default ({
  backupConfig,
  setBackupConfigs,
}: {
  backupConfig: LocationConfigBackupConfigsS3;
  setBackupConfigs: Dispatch<LocationConfigBackupConfigsS3>;
}) => {
  return (
    <>
      <Title mt={'md'} order={2}>
        S3 Settings
      </Title>
      <Divider my={'sm'} />

      <Group grow>
        <TextInput
          label={'Access Key'}
          placeholder={'Access Key'}
          value={backupConfig?.accessKey || ''}
          onChange={(e) => setBackupConfigs({ ...backupConfig, accessKey: e.target.value })}
          mt={'sm'}
        />
        <TextInput
          label={'Secret Key'}
          placeholder={'Secret Key'}
          type={'password'}
          value={backupConfig?.secretKey || ''}
          onChange={(e) => setBackupConfigs({ ...backupConfig, secretKey: e.target.value })}
          mt={'sm'}
        />
      </Group>

      <Group grow>
        <TextInput
          label={'Bucket'}
          placeholder={'Bucket'}
          value={backupConfig?.bucket || ''}
          onChange={(e) => setBackupConfigs({ ...backupConfig, bucket: e.target.value })}
          mt={'sm'}
        />
        <TextInput
          label={'Region'}
          placeholder={'Region'}
          value={backupConfig?.region || ''}
          onChange={(e) => setBackupConfigs({ ...backupConfig, region: e.target.value })}
          mt={'sm'}
        />
      </Group>

      <Group grow>
        <TextInput
          label={'Endpoint'}
          placeholder={'Endpoint'}
          value={backupConfig?.endpoint || ''}
          onChange={(e) => setBackupConfigs({ ...backupConfig, endpoint: e.target.value })}
          mt={'sm'}
        />
        <NumberInput
          label={'Part Size'}
          placeholder={'Part Size'}
          value={backupConfig?.partSize || 0}
          onChange={(value) => setBackupConfigs({ ...backupConfig, partSize: Number(value) })}
          mt={'sm'}
        />
      </Group>

      <Switch
        label={backupConfig?.pathStyle ? 'Using path-style URLs' : 'Using virtual-hosted-style URLs'}
        checked={backupConfig?.pathStyle || false}
        onChange={(e) => setBackupConfigs({ ...backupConfig, pathStyle: e.currentTarget.checked })}
        mt={'sm'}
      />
    </>
  );
};
