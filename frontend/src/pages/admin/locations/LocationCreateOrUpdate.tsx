import createLocation from '@/api/admin/locations/createLocation';
import updateLocation from '@/api/admin/locations/updateLocation';
import { httpErrorToHuman } from '@/api/axios';
import { useToast } from '@/providers/ToastProvider';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import deleteLocation from '@/api/admin/locations/deleteLocation';
import Code from '@/elements/Code';
import { Group, Stack, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Select from '@/elements/input/Select';
import Button from '@/elements/Button';
import { load } from '@/lib/debounce';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import TextArea from '@/elements/input/TextArea';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import getBackupConfigurations from '@/api/admin/backup-configurations/getBackupConfigurations';
import { NIL as uuidNil } from 'uuid';

export default ({ contextLocation }: { contextLocation?: Location }) => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<UpdateLocation>({
    name: '',
    description: '',
    backupConfigurationUuid: uuidNil,
  } as UpdateLocation);

  const backupConfigurations = useSearchableResource<BackupConfiguration>({
    fetcher: (search) => getBackupConfigurations(1, search),
  });

  useEffect(() => {
    if (contextLocation) {
      setLocation({
        name: contextLocation.name,
        description: contextLocation.description,
        backupConfigurationUuid: contextLocation.backupConfiguration?.uuid ?? uuidNil,
      });
    }
  }, [contextLocation]);

  const doCreateOrUpdate = (stay: boolean) => {
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
    } else if (!stay) {
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
    } else {
      createLocation(location)
        .then(() => {
          addToast('Location created.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    }
  };

  const doDelete = async () => {
    await deleteLocation(params.id)
      .then(() => {
        addToast('Location deleted.', 'success');
        navigate('/admin/locations');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
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

      <Stack>
        <Title order={2} mb={'md'}>
          {params.id ? 'Update' : 'Create'} Location
        </Title>

        <Group grow>
          <TextInput
            withAsterisk
            label={'Name'}
            placeholder={'Name'}
            value={location.name || ''}
            onChange={(e) => setLocation({ ...location, name: e.target.value })}
          />
          <Select
            allowDeselect
            label={'Backup Configuration'}
            value={location.backupConfigurationUuid ?? uuidNil}
            onChange={(value) => setLocation({ ...location, backupConfigurationUuid: value ?? uuidNil })}
            data={[
              {
                label: 'None',
                value: uuidNil,
              },
              ...backupConfigurations.items.map((backupConfiguration) => ({
                label: backupConfiguration.name,
                value: backupConfiguration.uuid,
              })),
            ]}
            searchable
            searchValue={backupConfigurations.search}
            onSearchChange={backupConfigurations.setSearch}
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
        </Group>

        <Group>
          <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
            Save
          </Button>
          {!contextLocation && (
            <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
              Save & Stay
            </Button>
          )}
          {contextLocation && (
            <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>
      </Stack>
    </>
  );
};
