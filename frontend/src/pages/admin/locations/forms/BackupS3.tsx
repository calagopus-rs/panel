import { Input } from '@/elements/inputs';
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
      <div className={'mt-4'}>
        <Input.Label htmlFor={'accessKey'}>Access Key</Input.Label>
        <Input.Text
          id={'accessKey'}
          placeholder={'Access Key'}
          value={backupConfig?.accessKey || ''}
          onChange={(e) => setBackupConfigs({ ...backupConfig, accessKey: e.target.value })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'secretKey'}>Secret Key</Input.Label>
        <Input.Text
          id={'secretKey'}
          placeholder={'Secret Key'}
          type={'password'}
          value={backupConfig?.secretKey || ''}
          onChange={(e) => setBackupConfigs({ ...backupConfig, secretKey: e.target.value })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'bucket'}>Bucket</Input.Label>
        <Input.Text
          id={'bucket'}
          placeholder={'Bucket'}
          value={backupConfig?.bucket || ''}
          onChange={(e) => setBackupConfigs({ ...backupConfig, bucket: e.target.value })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'region'}>Region</Input.Label>
        <Input.Text
          id={'region'}
          placeholder={'Region'}
          value={backupConfig?.region || ''}
          onChange={(e) => setBackupConfigs({ ...backupConfig, region: e.target.value })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'endpoint'}>Endpoint</Input.Label>
        <Input.Text
          id={'endpoint'}
          placeholder={'Endpoint'}
          value={backupConfig?.endpoint || ''}
          onChange={(e) => setBackupConfigs({ ...backupConfig, endpoint: e.target.value })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'pathStyle'}>Path Style</Input.Label>
        <Input.Switch
          name={'pathStyle'}
          label={backupConfig?.pathStyle ? 'Using path-style URLs' : 'Using virtual-hosted-style URLs'}
          defaultChecked={backupConfig?.pathStyle || false}
          onChange={(e) => setBackupConfigs({ ...backupConfig, pathStyle: e.target.checked })}
        />
      </div>

      <div className={'mt-4'}>
        <Input.Label htmlFor={'partSize'}>Part Size</Input.Label>
        <Input.Text
          id={'partSize'}
          placeholder={'Part Size'}
          type={'number'}
          value={backupConfig?.partSize || 0}
          onChange={(e) => setBackupConfigs({ ...backupConfig, partSize: Number(e.target.value) })}
        />
      </div>
    </>
  );
};
