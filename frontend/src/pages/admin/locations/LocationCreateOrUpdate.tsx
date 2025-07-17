import createLocation from '@/api/admin/locations/createLocation';
import updateLocation from '@/api/admin/locations/updateLocation';
import { httpErrorToHuman } from '@/api/axios';
import AdminSettingContainer from '@/elements/AdminSettingContainer';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useAdminStore } from '@/stores/admin';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import BackupS3 from './forms/BackupS3';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const { locations } = useAdminStore();
  const navigate = useNavigate();

  const [location, setLocation] = useState<Location | null>(null);
  const [shortName, setShortName] = useState<string>(location?.shortName ?? '');
  const [name, setName] = useState<string>(location?.name ?? '');
  const [description, setDescription] = useState<string>(location?.description ?? '');
  const [backupDisk, setBackupDisk] = useState<LocationConfigBackupType>(location?.backupDisk ?? 'local');
  const [backupConfigs, setBackupConfigs] = useState<LocationConfigBackup>(location?.backupConfigs ?? null);

  useEffect(() => {
    if (params.id) {
      const location = locations.data.find(l => l.id === Number(params.id));
      if (location) {
        setLocation(location);
      }
    }
  }, [params.id]);

  const handleCreateOrUpdate = () => {
    if (location?.id) {
      updateLocation(location.id, {
        shortName,
        name,
        description,
        backupDisk: null,
        backupConfigs: null,
      })
        .then(() => {
          addToast('Location updated.', 'success');
        })
        .catch(msg => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    } else {
      createLocation({
        shortName,
        name,
        description,
        backupDisk: null,
        backupConfigs: null,
      })
        .then(location => {
          addToast('Location created.', 'success');
          navigate(`/admin/locations/${location.id}`);
        })
        .catch(msg => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-white">{params.id ? 'Update' : 'Create'} Location</h1>
      </div>
      <AdminSettingContainer title="Location Settings">
        <div className="mt-4">
          <Input.Label htmlFor="shortName">Short Name</Input.Label>
          <Input.Text
            id="shortName"
            placeholder="Short Name"
            value={shortName}
            onChange={e => setShortName(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <Input.Label htmlFor="name">Name</Input.Label>
          <Input.Text id="name" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="mt-4">
          <Input.Label htmlFor="description">Description</Input.Label>
          <Input.Text
            id="description"
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <Input.Label htmlFor="type">Type</Input.Label>
          <Input.Dropdown
            id="type"
            options={[
              { label: 'Local', value: 'local' },
              { label: 'S3', value: 's3' },
              { label: 'Ddup-Bak', value: 'ddup-bak' },
              { label: 'Btrfs', value: 'btrfs' },
              { label: 'Zfs', value: 'zfs' },
              { label: 'Restic', value: 'restic' },
            ]}
            selected={backupDisk}
            onChange={e => setBackupDisk(e.target.value as LocationConfigBackupType)}
          />
        </div>

        {backupDisk === 's3' ? (
          <BackupS3 backupConfigs={backupConfigs as LocationConfigBackupS3} setBackupConfigs={setBackupConfigs} />
        ) : null}

        <div className="mt-4 flex justify-end">
          <Button onClick={handleCreateOrUpdate}>Save</Button>
        </div>
      </AdminSettingContainer>
    </>
  );
};
