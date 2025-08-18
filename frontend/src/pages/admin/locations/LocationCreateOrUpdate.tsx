import createLocation from '@/api/admin/locations/createLocation';
import updateLocation from '@/api/admin/locations/updateLocation';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import BackupS3 from './forms/BackupS3';
import getLocation from '@/api/admin/locations/getLocation';
import { Dialog } from '@/elements/dialog';
import deleteLocation from '@/api/admin/locations/deleteLocation';
import Code from '@/elements/Code';
import BackupRestic from './forms/BackupRestic';
import { Divider, Group, Title } from '@mantine/core';
import TextInput from '@/elements/inputnew/TextInput';
import Select from '@/elements/inputnew/Select';
import NewButton from '@/elements/button/NewButton';
import { load } from '@/lib/debounce';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState<'delete'>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location>({
    shortName: '',
    name: '',
    backupDisk: 'local',
  } as Location);

  useEffect(() => {
    if (params.id) {
      getLocation(params.id)
        .then((location) => {
          setLocation(location);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  const doCreateOrUpdate = () => {
    load(true, setLoading);
    if (location?.uuid) {
      updateLocation(location.uuid, location)
        .then(() => {
          addToast('Location updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createLocation(location)
        .then((location) => {
          addToast('Location created.', 'success');
          navigate(`/admin/locations/${location.uuid}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    }
  };

  const doDelete = () => {
    load(true, setLoading);
    deleteLocation(location.uuid)
      .then(() => {
        addToast('Location deleted.', 'success');
        navigate('/admin/locations');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => {
        load(false, setLoading);
      });
  };

  return (
    <>
      <Dialog.Confirm
        opened={openDialog === 'delete'}
        onClose={() => setOpenDialog(null)}
        title={'Confirm Location Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{location?.name}</Code>?
      </Dialog.Confirm>

      <Title order={1}>{params.id ? 'Update' : 'Create'} Location</Title>
      <Divider my={'sm'} />

      <Group grow>
        <TextInput
          label={'Short Name'}
          placeholder={'Short Name'}
          value={location.shortName || ''}
          onChange={(e) => setLocation({ ...location, name: e.target.value })}
          mt={'sm'}
        />
        <TextInput
          label={'Name'}
          placeholder={'Name'}
          value={location.name || ''}
          onChange={(e) => setLocation({ ...location, name: e.target.value })}
          mt={'sm'}
        />
      </Group>

      <Group grow>
        <TextInput
          label={'Description'}
          placeholder={'Description'}
          value={location.description || ''}
          onChange={(e) => setLocation({ ...location, description: e.target.value })}
          mt={'sm'}
        />
        <Select
          label={'Backup Disk'}
          placeholder={'Backup Disk'}
          value={location.backupDisk || 'local'}
          onChange={(value) => setLocation({ ...location, backupDisk: value as LocationConfigBackupDisk })}
          data={[
            { label: 'Local', value: 'local' },
            { label: 'S3', value: 's3' },
            { label: 'DdupBak', value: 'ddup-bak' },
            { label: 'Btrfs', value: 'btrfs' },
            { label: 'Zfs', value: 'zfs' },
            { label: 'Restic', value: 'restic' },
          ]}
          mt={'sm'}
        />
      </Group>

      <Group mt={'md'}>
        <NewButton onClick={doCreateOrUpdate} loading={loading}>
          Save
        </NewButton>
        {params.id && (
          <NewButton color={'red'} onClick={() => setOpenDialog('delete')} loading={loading}>
            Delete
          </NewButton>
        )}
      </Group>

      {location.backupDisk === 's3' || location.backupConfigs?.s3 ? (
        <BackupS3
          backupConfig={
            location.backupConfigs?.s3 ?? {
              accessKey: '',
              secretKey: '',
              bucket: '',
              region: '',
              endpoint: '',
              pathStyle: false,
              partSize: 512 * 1024 * 1024,
            }
          }
          setBackupConfigs={(config) =>
            setLocation({ ...location, backupConfigs: { ...location.backupConfigs, s3: config } })
          }
        />
      ) : null}

      {location.backupDisk === 'restic' || location.backupConfigs?.restic ? (
        <BackupRestic
          backupConfig={
            location.backupConfigs?.restic ?? {
              repository: '',
              retryLockSeconds: 60,
              environment: {},
            }
          }
          setBackupConfigs={(config) =>
            setLocation({ ...location, backupConfigs: { ...location.backupConfigs, restic: config } })
          }
        />
      ) : null}
    </>
  );
};
