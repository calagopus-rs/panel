import { MultiKeyValueInput } from '@/elements/inputnew/MultiKeyValueInput';
import NumberInput from '@/elements/inputnew/NumberInput';
import TextInput from '@/elements/inputnew/TextInput';
import { Input } from '@/elements/inputs';
import { Divider, Title } from '@mantine/core';
import { Dispatch } from 'react';

export default ({
  backupConfig,
  setBackupConfigs,
}: {
  backupConfig: LocationConfigBackupConfigsRestic;
  setBackupConfigs: Dispatch<LocationConfigBackupConfigsRestic>;
}) => {
  return (
    <>
      <Title mt={'md'} order={2}>
        Restic Settings
      </Title>
      <Divider my={'sm'} />

      <TextInput
        label={'Repository'}
        placeholder={'Repository'}
        value={backupConfig?.repository || ''}
        onChange={(e) => setBackupConfigs({ ...backupConfig, repository: e.target.value })}
        mt={'sm'}
      />

      <NumberInput
        label={'Retry Lock Seconds'}
        placeholder={'Retry Lock Seconds'}
        value={backupConfig?.retryLockSeconds || 0}
        onChange={(value) => setBackupConfigs({ ...backupConfig, retryLockSeconds: Number(value) })}
        mt={'sm'}
      />

      <TextInput
        label={'Password'}
        placeholder={'Password'}
        type={'password'}
        value={backupConfig?.environment?.RESTIC_PASSWORD || ''}
        onChange={(e) =>
          setBackupConfigs({
            ...backupConfig,
            environment: { ...backupConfig.environment, RESTIC_PASSWORD: e.target.value },
          })
        }
        mt={'sm'}
      />

      <div className={'mt-4'}>
        <Input.Label htmlFor={'environment'}>Environment</Input.Label>
        <MultiKeyValueInput
          options={backupConfig.environment || {}}
          onChange={(e) => setBackupConfigs({ ...backupConfig, environment: e })}
          transformValue={(key, value) => (key === 'AWS_SECRET_ACCESS_KEY' ? '*'.repeat(value.length) : value)}
          hideKey={(key) => key === 'RESTIC_PASSWORD'}
        />
      </div>
    </>
  );
};
