import { useEffect, useState } from 'react';
import { Stack, Group, Paper, Title, Alert } from '@mantine/core';
import TextInput from '@/elements/input/TextInput';
import TextArea from '@/elements/input/TextArea';
import NumberInput from '@/elements/input/NumberInput';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import Button from '@/elements/Button';
import getNodes from '@/api/admin/nodes/getNodes';
import getUsers from '@/api/admin/users/getUsers';
import getNests from '@/api/admin/nests/getNests';
import getEggs from '@/api/admin/nests/eggs/getEggs';
import { zones } from 'tzdata';
import updateServer from '@/api/admin/servers/updateServer';
import createServer from '@/api/admin/servers/createServer';
import getAvailableNodeAllocations from '@/api/admin/nodes/allocations/getAvailableNodeAllocations';
import { formatAllocation } from '@/lib/server';
import MultiSelect from '@/elements/input/MultiSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import SizeInput from '@/elements/input/SizeInput';
import { bytesToString, mbToBytes } from '@/lib/size';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import { NIL as uuidNil } from 'uuid';
import getBackupConfigurations from '@/api/admin/backup-configurations/getBackupConfigurations';
import { useForm } from '@mantine/form';
import { useResourceForm } from '@/plugins/useResourceForm';

const timezones = Object.keys(zones)
  .sort()
  .map((zone) => ({
    value: zone,
    label: zone,
  }));

export default ({ contextServer }: { contextServer?: AdminServer }) => {
  const form = useForm<Partial<UpdateAdminServer>>({
    initialValues: {
      externalId: '',
      name: '',
      description: '',
      startOnCompletion: true,
      skipInstaller: false,
      limits: {
        cpu: 100,
        memory: 1024,
        swap: 0,
        disk: 10240,
        ioWeight: null,
      },
      pinnedCpus: [],
      startup: '',
      image: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      featureLimits: {
        allocations: 5,
        databases: 5,
        backups: 5,
        schedules: 5,
      },
      nodeUuid: '',
      ownerUuid: '',
      eggUuid: '',
      backupConfigurationUuid: uuidNil,
      allocationUuid: null,
      allocationUuids: [],
    },
  });

  const { loading, doCreateOrUpdate } = useResourceForm<Partial<UpdateAdminServer>, AdminServer>({
    form,
    createFn: () => createServer(form.values),
    updateFn: () => updateServer(contextServer?.uuid, form.values),
    doUpdate: !!contextServer,
    basePath: '/admin/servers',
    resourceName: 'Server',
    toResetOnStay: ['allocationUuid', 'allocationUuids'],
  });

  useEffect(() => {
    if (contextServer) {
      form.setValues({
        ...contextServer,
        nodeUuid: contextServer.node.uuid,
        ownerUuid: contextServer.owner.uuid,
        eggUuid: contextServer.egg.uuid,
        backupConfigurationUuid: contextServer.backupConfiguration?.uuid ?? uuidNil,
      });
    }
  }, [contextServer]);

  const [memoryInput, setMemoryInput] = useState('');
  const [diskInput, setDiskInput] = useState('');
  const [swapInput, setSwapInput] = useState('');
  const [selectedNestUuid, setSelectedNestUuid] = useState<string>(contextServer?.nest.uuid ?? '');

  const nodes = useSearchableResource<Node>({ fetcher: (search) => getNodes(1, search) });
  const users = useSearchableResource<User>({ fetcher: (search) => getUsers(1, search) });
  const nests = useSearchableResource<AdminNest>({ fetcher: (search) => getNests(1, search) });
  const eggs = useSearchableResource<AdminNestEgg>({
    fetcher: (search) => getEggs(selectedNestUuid, 1, search),
    deps: [selectedNestUuid],
  });
  const availablePrimaryAllocations = useSearchableResource<NodeAllocation>({
    fetcher: (search) => getAvailableNodeAllocations(form.values.nodeUuid, 1, search),
    deps: [form.values.nodeUuid],
  });
  const availableAllocations = useSearchableResource<NodeAllocation>({
    fetcher: (search) => getAvailableNodeAllocations(form.values.nodeUuid, 1, search),
    deps: [form.values.nodeUuid],
  });
  const backupConfigurations = useSearchableResource<BackupConfiguration>({
    fetcher: (search) => getBackupConfigurations(1, search),
  });

  useEffect(() => {
    setMemoryInput(
      contextServer ? bytesToString(mbToBytes(contextServer?.limits.memory)) : bytesToString(mbToBytes(1024)),
    );
    setDiskInput(
      contextServer ? bytesToString(mbToBytes(contextServer?.limits.disk)) : bytesToString(mbToBytes(10240)),
    );
    setSwapInput(contextServer ? bytesToString(mbToBytes(contextServer?.limits.swap)) : bytesToString(mbToBytes(0)));
  }, [contextServer]);

  useEffect(() => {
    if (!form.values.eggUuid) {
      return;
    }

    const egg = eggs.items.find((egg) => egg.uuid === form.values.eggUuid);
    if (!egg) {
      return;
    }

    form.setFieldValue('image', Object.values(egg.dockerImages)[0] ?? '');
    form.setFieldValue('startup', egg.startup);
  }, [form.values.eggUuid, eggs.items]);

  return (
    <>
      <Stack>
        <Title order={2}>{contextServer ? 'Update' : 'Create'} Server</Title>

        {contextServer?.suspended && (
          <Alert title='Server Suspended' color='orange' icon={<FontAwesomeIcon icon={faCircleInfo} />}>
            This server is suspended.
          </Alert>
        )}

        <Group grow align={'normal'}>
          <Paper withBorder p='md'>
            <Stack>
              <Title order={3}>Basic Information</Title>

              <Group grow>
                <TextInput
                  withAsterisk
                  label={'Server Name'}
                  placeholder={'My Game Server'}
                  {...form.getInputProps('name')}
                />
                <TextInput
                  label={'External ID'}
                  placeholder={'Optional external identifier'}
                  {...form.getInputProps('externalId')}
                />
              </Group>

              <TextArea
                label='Description'
                placeholder='Server description'
                rows={3}
                {...form.getInputProps('description')}
              />
            </Stack>
          </Paper>

          <Paper withBorder p='md'>
            <Stack>
              <Title order={3}>Server Assignment</Title>

              <Group grow>
                <Select
                  withAsterisk
                  label={'Node'}
                  placeholder={'Node'}
                  data={nodes.items.map((node) => ({
                    label: node.name,
                    value: node.uuid,
                  }))}
                  searchable
                  searchValue={nodes.search}
                  onSearchChange={nodes.setSearch}
                  {...form.getInputProps('nodeUuid')}
                />
                <Select
                  withAsterisk
                  label={'Owner'}
                  placeholder={'Owner'}
                  data={users.items.map((user) => ({
                    label: user.username,
                    value: user.uuid,
                  }))}
                  searchable
                  searchValue={users.search}
                  onSearchChange={users.setSearch}
                  {...form.getInputProps('ownerUuid')}
                />
              </Group>

              <Group grow>
                <Select
                  withAsterisk
                  label={'Nest'}
                  placeholder={'Nest'}
                  value={selectedNestUuid}
                  onChange={(value) => setSelectedNestUuid(value)}
                  data={nests.items.map((nest) => ({
                    label: nest.name,
                    value: nest.uuid,
                  }))}
                  searchable
                  searchValue={nests.search}
                  onSearchChange={nests.setSearch}
                />
                <Select
                  withAsterisk
                  label={'Egg'}
                  placeholder={'Egg'}
                  disabled={!selectedNestUuid}
                  data={eggs.items.map((egg) => ({
                    label: egg.name,
                    value: egg.uuid,
                  }))}
                  searchable
                  searchValue={eggs.search}
                  onSearchChange={eggs.setSearch}
                  {...form.getInputProps('eggUuid')}
                />
              </Group>

              <Group grow>
                <Select
                  allowDeselect
                  label={'Backup Configuration'}
                  data={[
                    {
                      label: 'Inherit from Node/Location',
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
            </Stack>
          </Paper>
        </Group>

        <Group grow align={'normal'}>
          <Paper withBorder p='md'>
            <Stack>
              <Title order={3}>Resource Limits</Title>

              <Group grow>
                <NumberInput
                  withAsterisk
                  label={'CPU Limit (%)'}
                  placeholder={'100'}
                  min={0}
                  {...form.getInputProps('limits.cpu')}
                />
                <SizeInput
                  withAsterisk
                  label={'Memory + Unit (e.g. 1 GiB)'}
                  value={memoryInput}
                  setState={setMemoryInput}
                  onChange={(value) => form.setFieldValue('limits.memory', value / 1024 / 1024)}
                />
              </Group>

              <Group grow>
                <SizeInput
                  withAsterisk
                  label={'Disk Space + Unit (e.g. 10 GiB)'}
                  value={diskInput}
                  setState={setDiskInput}
                  onChange={(value) => form.setFieldValue('limits.disk', value / 1024 / 1024)}
                />
                <SizeInput
                  withAsterisk
                  label={'Swap + Unit (e.g. 500 MiB)'}
                  value={swapInput}
                  setState={setSwapInput}
                  onChange={(value) => form.setFieldValue('limits.swap', value / 1024 / 1024)}
                />
                <NumberInput label={'IO Weight'} {...form.getInputProps('limits.ioWeight')} />
              </Group>
            </Stack>
          </Paper>

          <Paper withBorder p='md'>
            <Stack>
              <Title order={3}>Server Configuration</Title>

              <Group grow>
                <Select
                  withAsterisk
                  label={'Docker Image'}
                  placeholder={'ghcr.io/...'}
                  data={Object.entries(
                    eggs.items.find((egg) => egg.uuid === form.values.eggUuid)?.dockerImages || {},
                  ).map(([label, value]) => ({
                    label,
                    value,
                  }))}
                  searchable
                  {...form.getInputProps('image')}
                />
                <Select
                  withAsterisk
                  label={'Timezone'}
                  placeholder={'Europe/Amsterdam'}
                  data={[
                    {
                      label: 'System',
                      value: '',
                    },
                    ...timezones,
                  ]}
                  searchable
                  {...form.getInputProps('timezone')}
                />
              </Group>

              <TextArea
                label={'Startup Command'}
                placeholder={'npm start'}
                required
                rows={2}
                {...form.getInputProps('startup')}
              />

              {!contextServer && (
                <Group grow>
                  <Switch
                    label={'Start on Completion'}
                    description={'Start server after installation completes'}
                    {...form.getInputProps('startOnCompletion')}
                  />
                  <Switch
                    label={'Skip Installer'}
                    description={'Skip running the install script'}
                    {...form.getInputProps('skipInstaller')}
                  />
                </Group>
              )}
            </Stack>
          </Paper>
        </Group>

        <Group grow align={'normal'}>
          <Paper withBorder p='md'>
            <Stack>
              <Title order={3}>Feature Limits</Title>

              <Group grow>
                <NumberInput
                  withAsterisk
                  label={'Allocations'}
                  placeholder={'0'}
                  min={0}
                  {...form.getInputProps('featureLimits.allocations')}
                />
                <NumberInput
                  withAsterisk
                  label={'Databases'}
                  placeholder={'0'}
                  min={0}
                  {...form.getInputProps('featureLimits.databases')}
                />
                <NumberInput
                  withAsterisk
                  label={'Backups'}
                  placeholder={'0'}
                  min={0}
                  {...form.getInputProps('featureLimits.backups')}
                />
                <NumberInput
                  withAsterisk
                  label={'Schedules'}
                  placeholder={'0'}
                  min={0}
                  {...form.getInputProps('featureLimits.schedules')}
                />
              </Group>
            </Stack>
          </Paper>

          {!contextServer && (
            <Paper withBorder p='md'>
              <Stack>
                <Title order={3}>Allocations</Title>

                <Group grow>
                  <Select
                    label={'Primary Allocation'}
                    placeholder={'Primary Allocation'}
                    disabled={!form.values.nodeUuid}
                    data={availablePrimaryAllocations.items
                      .filter((alloc) => !form.values.allocationUuids.includes(alloc.uuid))
                      .map((alloc) => ({
                        label: formatAllocation(alloc),
                        value: alloc.uuid,
                      }))}
                    searchable
                    searchValue={availablePrimaryAllocations.search}
                    onSearchChange={availablePrimaryAllocations.setSearch}
                    allowDeselect
                    {...form.getInputProps('allocationUuid')}
                  />
                  <MultiSelect
                    label={'Additional Allocations'}
                    placeholder={'Additional Allocations'}
                    disabled={!form.values.nodeUuid}
                    data={availableAllocations.items
                      .filter((alloc) => alloc.uuid !== form.values.allocationUuid)
                      .map((alloc) => ({
                        label: formatAllocation(alloc),
                        value: alloc.uuid,
                      }))}
                    searchable
                    searchValue={availableAllocations.search}
                    onSearchChange={availableAllocations.setSearch}
                    {...form.getInputProps('allocationUuids')}
                  />
                </Group>
              </Stack>
            </Paper>
          )}
        </Group>

        <Group>
          <Button onClick={() => doCreateOrUpdate(false)} loading={loading}>
            Save
          </Button>
          {!contextServer && (
            <Button onClick={() => doCreateOrUpdate(true)} loading={loading}>
              Save & Stay
            </Button>
          )}
        </Group>
      </Stack>
    </>
  );
};
