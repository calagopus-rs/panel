import { Input } from '@/elements/inputs';
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
      <div className={'mt-4'}>
        <Input.Label htmlFor={'repository'}>Repository</Input.Label>
        <Input.Text
          id={'repository'}
          placeholder={'Repository'}
          value={backupConfig?.repository || ''}
          onChange={(e) => setBackupConfigs({ ...backupConfig, repository: e.target.value })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'retryLockSeconds'}>Retry Lock Seconds</Input.Label>
        <Input.Text
          id={'retryLockSeconds'}
          placeholder={'Retry Lock Seconds'}
          type={'number'}
          value={backupConfig?.retryLockSeconds || 0}
          onChange={(e) => setBackupConfigs({ ...backupConfig, retryLockSeconds: Number(e.target.value) })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'password'}>Password</Input.Label>
        <Input.Text
          id={'password'}
          placeholder={'Password'}
          type={'password'}
          value={backupConfig?.environment?.RESTIC_PASSWORD || ''}
          onChange={(e) =>
            setBackupConfigs({
              ...backupConfig,
              environment: { ...backupConfig.environment, RESTIC_PASSWORD: e.target.value },
            })
          }
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'environment'}>Environment</Input.Label>
        <Input.MultiKeyValueInput
          options={backupConfig.environment || {}}
          onChange={(e) => setBackupConfigs({ ...backupConfig, environment: e })}
          transformValue={(key, value) => (key === 'AWS_SECRET_ACCESS_KEY' ? '*'.repeat(value.length) : value)}
          hideKey={(key) => key === 'RESTIC_PASSWORD'}
        />
      </div>
    </>
  );
};
