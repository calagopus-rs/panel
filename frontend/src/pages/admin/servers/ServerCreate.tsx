import { faReply } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Group, Paper, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { zones } from 'tzdata';
import { NIL as uuidNil } from 'uuid';
import { z } from 'zod';
import getBackupConfigurations from '@/api/admin/backup-configurations/getBackupConfigurations';
import getEggs from '@/api/admin/nests/eggs/getEggs';
import getEggVariables from '@/api/admin/nests/eggs/variables/getEggVariables';
import getNests from '@/api/admin/nests/getNests';
import getAvailableNodeAllocations from '@/api/admin/nodes/allocations/getAvailableNodeAllocations';
import getNodes from '@/api/admin/nodes/getNodes';
import createServer from '@/api/admin/servers/createServer';
import getUsers from '@/api/admin/users/getUsers';
import { httpErrorToHuman } from '@/api/axios';
import Alert from '@/elements/Alert';
import Button from '@/elements/Button';
import MultiSelect from '@/elements/input/MultiSelect';
import NumberInput from '@/elements/input/NumberInput';
import Select from '@/elements/input/Select';
import SizeInput from '@/elements/input/SizeInput';
import Switch from '@/elements/input/Switch';
import TextArea from '@/elements/input/TextArea';
import TextInput from '@/elements/input/TextInput';
import Spinner from '@/elements/Spinner';
import VariableContainer from '@/elements/VariableContainer';
import { adminServerCreateSchema } from '@/lib/schemas/admin/servers';
import { formatAllocation } from '@/lib/server';
import { useResourceForm } from '@/plugins/useResourceForm';
import { useSearchableResource } from '@/plugins/useSearchableResource';
import { useToast } from '@/providers/ToastProvider';

const timezones = Object.keys(zones)
  .sort()
  .map((zone) => ({
    value: zone,
    label: zone,
  }));

export default function ServerCreate() {
  const { addToast } = useToast();

  const form = useForm<z.infer<typeof adminServerCreateSchema>>({
    initialValues: {
      externalId: null,
      name: '',
      description: null,
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
      variables: [],
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminServerCreateSchema),
  });

  const { loading, doCreateOrUpdate } = useResourceForm<z.infer<typeof adminServerCreateSchema>, AdminServer>({
    form,
    createFn: () => createServer(form.values),
    doUpdate: false,
    basePath: '/admin/servers',
    resourceName: 'Server',
    toResetOnStay: ['allocationUuid', 'allocationUuids'],
  });

  const [eggVariablesLoading, setEggVariablesLoading] = useState(false);
  const [selectedNestUuid, setSelectedNestUuid] = useState<string | null>('');
  const [eggVariables, setEggVariables] = useState<NestEggVariable[]>([]);

  const nodes = useSearchableResource<Node>({
    fetcher: (search) => getNodes(1, search),
  });
  const users = useSearchableResource<User>({
    fetcher: (search) => getUsers(1, search),
  });
  const nests = useSearchableResource<AdminNest>({
    fetcher: (search) => getNests(1, search),
  });
  const eggs = useSearchableResource<AdminNestEgg>({
    fetcher: (search) => getEggs(selectedNestUuid!, 1, search),
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
    const egg = eggs.items.find((egg) => egg.uuid === form.values.eggUuid);
    if (!egg) {
      return;
    }

    form.setFieldValue('image', Object.values(egg.dockerImages)[0] ?? '');
    form.setFieldValue('startup', egg.startup);
  }, [form.values.eggUuid, eggs.items]);

  useEffect(() => {
    if (!selectedNestUuid || !form.values.eggUuid) {
      return;
    }

    setEggVariablesLoading(true);
    getEggVariables(selectedNestUuid, form.values.eggUuid)
      .then((variables) => {
        setEggVariables(variables);
      })
      .catch((err) => {
        addToast(httpErrorToHuman(err), 'error');
      })
      .finally(() => setEggVariablesLoading(false));
  }, [selectedNestUuid, form.values.eggUuid]);

  return (
    <Stack>
      <Title order={2}>Create Server</Title>

      <Group grow align='normal'>
        <Paper withBorder p='md'>
          <Stack>
            <Title order={3}>Basic Information</Title>

            <Group grow>
              <TextInput
                withAsterisk
                label='Server Name'
                placeholder='My Game Server'
                {...form.getInputProps('name')}
              />
              <TextInput
                label='External ID'
                placeholder='Optional external identifier'
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
                label='Node'
                placeholder='Node'
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
                label='Owner'
                placeholder='Owner'
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
                label='Nest'
                placeholder='Nest'
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
                label='Egg'
                placeholder='Egg'
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
                label='Backup Configuration'
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

      <Group grow align='normal'>
        <Paper withBorder p='md'>
          <Stack>
            <Title order={3}>Resource Limits</Title>

            <Group grow>
              <NumberInput
                withAsterisk
                label='CPU Limit (%)'
                placeholder='100'
                min={0}
                {...form.getInputProps('limits.cpu')}
              />
              <SizeInput
                withAsterisk
                label='Memory'
                mode='mb'
                value={form.values.limits.memory}
                onChange={(value) => form.setFieldValue('limits.memory', value)}
              />
            </Group>

            <Group grow>
              <SizeInput
                withAsterisk
                label='Disk Space'
                mode='mb'
                value={form.values.limits.disk}
                onChange={(value) => form.setFieldValue('limits.disk', value)}
              />
              <SizeInput
                withAsterisk
                label='Swap'
                mode='mb'
                value={form.values.limits.swap}
                onChange={(value) => form.setFieldValue('limits.swap', value)}
              />
              <NumberInput label='IO Weight' {...form.getInputProps('limits.ioWeight')} />
            </Group>
          </Stack>
        </Paper>

        <Paper withBorder p='md'>
          <Stack>
            <Title order={3}>Server Configuration</Title>

            <Group grow>
              <Select
                withAsterisk
                label='Docker Image'
                placeholder='ghcr.io/...'
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
                label='Timezone'
                placeholder='Europe/Amsterdam'
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
              label='Startup Command'
              placeholder='npm start'
              required
              rows={2}
              rightSection={
                <ActionIcon
                  variant='subtle'
                  disabled={form.values.startup === eggs.items.find((e) => e.uuid === form.values.eggUuid)?.startup}
                  onClick={() =>
                    form.setFieldValue('startup', eggs.items.find((e) => e.uuid === form.values.eggUuid)?.startup || '')
                  }
                >
                  <FontAwesomeIcon icon={faReply} />
                </ActionIcon>
              }
              {...form.getInputProps('startup')}
            />

            <Group grow>
              <Switch
                label='Start on Completion'
                description='Start server after installation completes'
                checked={form.values.startOnCompletion}
                onChange={(e) => form.setFieldValue('startOnCompletion', e.target.checked)}
              />
              <Switch
                label='Skip Installer'
                description='Skip running the install script'
                checked={form.values.skipInstaller}
                onChange={(e) => form.setFieldValue('skipInstaller', e.target.checked)}
              />
            </Group>
          </Stack>
        </Paper>
      </Group>

      <Group grow align='normal'>
        <Paper withBorder p='md'>
          <Stack>
            <Title order={3}>Feature Limits</Title>

            <Group grow>
              <NumberInput
                withAsterisk
                label='Allocations'
                placeholder='0'
                min={0}
                {...form.getInputProps('featureLimits.allocations')}
              />
              <NumberInput
                withAsterisk
                label='Databases'
                placeholder='0'
                min={0}
                {...form.getInputProps('featureLimits.databases')}
              />
              <NumberInput
                withAsterisk
                label='Backups'
                placeholder='0'
                min={0}
                {...form.getInputProps('featureLimits.backups')}
              />
              <NumberInput
                withAsterisk
                label='Schedules'
                placeholder='0'
                min={0}
                {...form.getInputProps('featureLimits.schedules')}
              />
            </Group>
          </Stack>
        </Paper>

        <Paper withBorder p='md'>
          <Stack>
            <Title order={3}>Allocations</Title>

            <Group grow>
              <Select
                label='Primary Allocation'
                placeholder='Primary Allocation'
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
                label='Additional Allocations'
                placeholder='Additional Allocations'
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
      </Group>

      <Paper withBorder p='md'>
        <Stack>
          <Title order={3}>Variables</Title>

          {!selectedNestUuid || !form.values.eggUuid ? (
            <Alert>Please select an egg before you can configure variables.</Alert>
          ) : eggVariablesLoading ? (
            <Spinner.Centered />
          ) : (
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
              {eggVariables.map((variable) => (
                <VariableContainer
                  key={variable.envVariable}
                  variable={{ ...variable, value: '', isEditable: variable.userEditable }}
                  loading={loading}
                  overrideReadonly
                  value={
                    form.values.variables.find((v) => v.envVariable === variable.envVariable)?.value ??
                    variable.defaultValue ??
                    ''
                  }
                  setValue={(value) =>
                    form.setFieldValue('variables', (prev) => [
                      ...prev.filter((v) => v.envVariable !== variable.envVariable),
                      { envVariable: variable.envVariable, value },
                    ])
                  }
                />
              ))}
            </div>
          )}
        </Stack>
      </Paper>

      <Group>
        <Button onClick={() => doCreateOrUpdate(false)} disabled={!form.isValid()} loading={loading}>
          Save
        </Button>
        <Button onClick={() => doCreateOrUpdate(true)} disabled={!form.isValid()} loading={loading}>
          Save & Stay
        </Button>
      </Group>
    </Stack>
  );
}
