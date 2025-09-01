import createLocation from '@/api/admin/locations/createLocation';
import updateLocation from '@/api/admin/locations/updateLocation';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import BackupS3 from './forms/BackupS3';
import getLocation from '@/api/admin/locations/getLocation';
import deleteLocation from '@/api/admin/locations/deleteLocation';
import Code from '@/elements/Code';
import BackupRestic from './forms/BackupRestic';
import { Divider, Group, Stack, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Select from '@/elements/input/Select';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { locationConfigBackupDiskLabelMapping } from '@/lib/enums';
import TextArea from '@/elements/input/TextArea';

export default ({ contextLocation }: { contextLocation?: Location }) => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<UpdateLocation>({
    shortName: contextLocation?.shortName ?? '',
    name: contextLocation?.name ?? '',
    description: contextLocation?.description ?? '',
    backupDisk: contextLocation?.backupDisk ?? 'local',
    backupConfigs: contextLocation?.backupConfigs ?? {},
  } as UpdateLocation);

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
    if (params?.id) {
      updateLocation(params.id, location)
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
    deleteLocation(params.id)
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
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Location Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{location?.name}</Code>?
      </ConfirmationModal>

      <Title order={2}>{params.id ? 'Update' : 'Create'} Location</Title>
      <Divider />

      <Stack>
        <Group grow>
          <TextInput
            withAsterisk
            label={'Short Name'}
            placeholder={'Short Name'}
            value={location.shortName || ''}
            onChange={(e) => setLocation({ ...location, shortName: e.target.value })}
          />
          <TextInput
            withAsterisk
            label={'Name'}
            placeholder={'Name'}
            value={location.name || ''}
            onChange={(e) => setLocation({ ...location, name: e.target.value })}
          />
        </Group>

        <Group grow align={'start'}>
          <TextArea
            label={'Description'}
            placeholder={'Description'}
            value={location.description || ''}
            rows={3}
            onChange={(e) => setLocation({ ...location, description: e.target.value || null })}
          />
          <Select
            withAsterisk
            label={'Backup Disk'}
            placeholder={'Backup Disk'}
            value={location.backupDisk || 'local'}
            onChange={(value) => setLocation({ ...location, backupDisk: value as LocationConfigBackupDisk })}
            data={Object.entries(locationConfigBackupDiskLabelMapping).map(([value, label]) => ({
              value,
              label,
            }))}
          />
        </Group>

        <Group>
          <Button onClick={doCreateOrUpdate} loading={loading}>
            Save
          </Button>
          {params.id && (
            <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
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
      </Stack>
    </>
  );
};
