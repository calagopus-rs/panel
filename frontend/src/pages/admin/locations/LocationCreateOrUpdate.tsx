import createLocation from '@/api/admin/locations/createLocation';
import updateLocation from '@/api/admin/locations/updateLocation';
import { useEffect, useState } from 'react';
import deleteLocation from '@/api/admin/locations/deleteLocation';
import Code from '@/elements/Code';
import { Group, Stack, Title } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import Select from '@/elements/input/Select';
import Button from '@/elements/Button';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import TextArea from '@/elements/input/TextArea';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import getBackupConfigurations from '@/api/admin/backup-configurations/getBackupConfigurations';
import { NIL as uuidNil } from 'uuid';
import { useForm } from '@mantine/form';
import { useResourceForm } from '@/plugins/useResourceForm';

export default ({ contextLocation }: { contextLocation?: Location }) => {
  const [openModal, setOpenModal] = useState<'delete'>(null);

  const form = useForm<UpdateLocation>({
    initialValues: {
      name: '',
      description: '',
      backupConfigurationUuid: uuidNil,
    },
  });

  const { loading, doCreateOrUpdate, doDelete } = useResourceForm<UpdateLocation, Location>({
    form,
    createFn: () => createLocation(form.values),
    updateFn: () => updateLocation(contextLocation?.uuid, form.values),
    deleteFn: () => deleteLocation(contextLocation?.uuid),
    doUpdate: !!contextLocation,
    basePath: '/admin/locations',
    resourceName: 'Location',
  });

  useEffect(() => {
    if (contextLocation) {
      form.setValues({
        ...contextLocation,
      });
    }
  }, [contextLocation]);

  const backupConfigurations = useSearchableResource<BackupConfiguration>({
    fetcher: (search) => getBackupConfigurations(1, search),
  });

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title={'Confirm Location Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2} mb={'md'}>
          {contextLocation ? 'Update' : 'Create'} Location
        </Title>

        <Group grow>
          <TextInput withAsterisk label={'Name'} placeholder={'Name'} {...form.getInputProps('name')} />
          <Select
            allowDeselect
            label={'Backup Configuration'}
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
            {...form.getInputProps('backupConfigurationUuid')}
          />
        </Group>

        <Group grow align={'start'}>
          <TextArea label={'Description'} placeholder={'Description'} rows={3} {...form.getInputProps('description')} />
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
