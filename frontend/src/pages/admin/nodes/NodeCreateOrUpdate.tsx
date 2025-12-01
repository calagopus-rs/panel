import { Group, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { NIL as uuidNil } from 'uuid';
import getBackupConfigurations from '@/api/admin/backup-configurations/getBackupConfigurations';
import getLocations from '@/api/admin/locations/getLocations';
import createNode from '@/api/admin/nodes/createNode';
import deleteNode from '@/api/admin/nodes/deleteNode';
import resetNodeToken from '@/api/admin/nodes/resetNodeToken';
import updateNode from '@/api/admin/nodes/updateNode';
import { httpErrorToHuman } from '@/api/axios';
import Button from '@/elements/Button';
import Code from '@/elements/Code';
import NumberInput from '@/elements/input/NumberInput';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import ConfirmationModal from '@/elements/modals/ConfirmationModal';
import { useResourceForm } from '@/plugins/useResourceForm';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import { useToast } from '@/providers/ToastProvider';

export default function NodeCreateOrUpdate({ contextNode }: { contextNode?: Node }) {
  const { addToast } = useToast();

  const [openModal, setOpenModal] = useState<'delete'>(null);

  const form = useForm<UpdateNode>({
    initialValues: {
      locationUuid: '',
      backupConfigurationUuid: uuidNil,
      name: '',
      public: false,
      description: null,
      publicUrl: null,
      url: '',
      sftpHost: null,
      sftpPort: 2022,
      maintenanceMessage: null,
      memory: 8192,
      disk: 10240,
    },
  });

  const { loading, setLoading, doCreateOrUpdate, doDelete } = useResourceForm<UpdateNode, Node>({
    form,
    createFn: () => createNode(form.values),
    updateFn: () => updateNode(contextNode?.uuid, form.values),
    deleteFn: () => deleteNode(contextNode?.uuid),
    doUpdate: !!contextNode,
    basePath: '/admin/nodes',
    resourceName: 'Node',
  });

  useEffect(() => {
    if (contextNode) {
      form.setValues({
        ...contextNode,
        locationUuid: contextNode.location.uuid,
        backupConfigurationUuid: contextNode.backupConfiguration?.uuid ?? uuidNil,
      });
    }
  }, [contextNode]);

  const locations = useSearchableResource<Location>({
    fetcher: (search) => getLocations(1, search),
    defaultSearchValue: contextNode?.location.name,
  });
  const backupConfigurations = useSearchableResource<BackupConfiguration>({
    fetcher: (search) => getBackupConfigurations(1, search),
    defaultSearchValue: contextNode?.backupConfiguration?.name,
  });

  const doResetToken = () => {
    setLoading(true);
    resetNodeToken(contextNode.uuid)
      .then(({ tokenId, token }) => {
        addToast('Node token reset.', 'success');
        contextNode.tokenId = tokenId;
        contextNode.token = token;
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <ConfirmationModal
        opened={openModal === 'delete'}
        onClose={() => setOpenModal(null)}
        title='Confirm Node Deletion'
        confirm='Delete'
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{form.values.name}</Code>?
      </ConfirmationModal>

      <Stack>
        <Title order={2}>{contextNode ? 'Update' : 'Create'} Node</Title>

        <Group grow>
          <TextInput withAsterisk label='Name' placeholder='Name' {...form.getInputProps('name')} />
          <Select
            withAsterisk
            label='Location'
            placeholder='Location'
            data={locations.items.map((location) => ({
              label: location.name,
              value: location.uuid,
            }))}
            searchable
            searchValue={locations.search}
            onSearchChange={locations.setSearch}
            {...form.getInputProps('locationUuid')}
          />
        </Group>

        <Group grow>
          <TextInput
            withAsterisk
            label='URL'
            description='used for internal communication with the node'
            placeholder='URL'
            {...form.getInputProps('url')}
          />
          <TextInput
            label='Public URL'
            description='used for websocket/downloads'
            placeholder='URL'
            {...form.getInputProps('publicUrl')}
          />
        </Group>

        <Group grow>
          <TextInput label='SFTP Host' placeholder='SFTP Host' {...form.getInputProps('sftpHost')} />
          <NumberInput
            withAsterisk
            label='SFTP Port'
            placeholder='SFTP Port'
            min={1}
            max={65535}
            {...form.getInputProps('sftpPort')}
          />
        </Group>

        <Group grow>
          <NumberInput
            withAsterisk
            label='Memory MB'
            placeholder='Memory MB'
            min={1024}
            {...form.getInputProps('memory')}
          />
          <NumberInput withAsterisk label='Disk MB' placeholder='Disk MB' min={1024} {...form.getInputProps('disk')} />
        </Group>

        <Group grow align='start'>
          <Select
            allowDeselect
            label='Backup Configuration'
            data={[
              {
                label: 'Inherit from Location',
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
          <TextInput
            label='Maintenance Message'
            placeholder='Maintenance Message'
            {...form.getInputProps('maintenanceMessage')}
          />
        </Group>

        <TextArea label='Description' placeholder='Description' rows={3} {...form.getInputProps('description')} />

        <Switch
          label='Public'
          checked={form.values.public}
          onChange={(e) => form.setFieldValue('public', e.target.checked)}
        />

        <Group>
          <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
            Save
          </Button>
          {!contextNode && (
            <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
              Save & Stay
            </Button>
          )}
          {contextNode && (
            <Button color='red' variant='outline' onClick={doResetToken} loading={loading}>
              Reset Token
            </Button>
          )}
          {contextNode && (
            <Button color='red' onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>
      </Stack>
    </>
  );
}
