import { Input } from '@/elements/inputs';

export default ({
  backupConfigs,
  setBackupConfigs,
}: {
  backupConfigs: LocationConfigBackupS3;
  setBackupConfigs: Function;
}) => {
  return (
    <>
      <div className="mt-4">
        <Input.Label htmlFor="accessKey">Access Key</Input.Label>
        <Input.Text
          id="accessKey"
          placeholder="Access Key"
          value={backupConfigs.accessKey}
          onChange={e => setBackupConfigs((config: any) => ({ ...config, accessKey: e.target.value }))}
        />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor="secretKey">Secret Key</Input.Label>
        <Input.Text
          id="secretKey"
          placeholder="Secret Key"
          type="password"
          value={backupConfigs.secretKey}
          onChange={e => setBackupConfigs((config: any) => ({ ...config, secretKey: e.target.value }))}
        />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor="bucket">Bucket</Input.Label>
        <Input.Text
          id="bucket"
          placeholder="Bucket"
          value={backupConfigs.bucket}
          onChange={e => setBackupConfigs((config: any) => ({ ...config, bucket: e.target.value }))}
        />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor="region">Region</Input.Label>
        <Input.Text
          id="region"
          placeholder="Region"
          value={backupConfigs.region}
          onChange={e => setBackupConfigs((config: any) => ({ ...config, region: e.target.value }))}
        />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor="endpoint">Endpoint</Input.Label>
        <Input.Text
          id="endpoint"
          placeholder="Endpoint"
          value={backupConfigs.endpoint}
          onChange={e => setBackupConfigs((config: any) => ({ ...config, endpoint: e.target.value }))}
        />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor="pathStyle">Path Style</Input.Label>
        <Input.Switch
          name="pathStyle"
          description={backupConfigs.pathStyle ? 'Using path-style URLs' : 'Using virtual-hosted-style URLs'}
          defaultChecked={backupConfigs.pathStyle}
          onChange={e => setBackupConfigs((config: any) => ({ ...config, pathStyle: e.target.checked }))}
        />
      </div>

      <div className="mt-4">
        <Input.Label htmlFor="pathSize">Path Size</Input.Label>
        <Input.Text
          id="pathSize"
          placeholder="Path Size"
          type="number"
          value={backupConfigs.partSize}
          onChange={e => setBackupConfigs((config: any) => ({ ...config, partSize: e.target.value }))}
        />
      </div>
    </>
  );
};
