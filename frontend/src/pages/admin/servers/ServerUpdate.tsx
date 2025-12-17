import { faCircleInfo, faReply } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon, Group, Paper, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useEffect, useState } from 'react';
import { zones } from 'tzdata';
import { NIL as uuidNil } from 'uuid';
import { z } from 'zod';
import getBackupConfigurations from '@/api/admin/backup-configurations/getBackupConfigurations.ts';
import getEggs from '@/api/admin/nests/eggs/getEggs.ts';
import getNests from '@/api/admin/nests/getNests.ts';
import updateServer from '@/api/admin/servers/updateServer.ts';
import getUsers from '@/api/admin/users/getUsers.ts';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import Alert from '@/elements/Alert.tsx';
import Button from '@/elements/Button.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import NumberInput from '@/elements/input/NumberInput.tsx';
import Select from '@/elements/input/Select.tsx';
import SizeInput from '@/elements/input/SizeInput.tsx';
import TextArea from '@/elements/input/TextArea.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { adminServerUpdateSchema } from '@/lib/schemas/admin/servers.ts';
import { useResourceForm } from '@/plugins/useResourceForm.ts';
import { useSearchableResource } from '@/plugins/useSearchableResource.ts';

const timezones = Object.keys(zones)
  .sort()
  .map((zone) => ({
    value: zone,
    label: zone,
  }));

export default function ServerUpdate({ contextServer }: { contextServer: AdminServer }) {
  const form = useForm<z.infer<typeof adminServerUpdateSchema>>({
    initialValues: {
      ownerUuid: uuidNil,
      eggUuid: uuidNil,
      backupConfigurationUuid: uuidNil,
      externalId: null,
      name: '',
      description: null,
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
    },
    validateInputOnBlur: true,
    validate: zod4Resolver(adminServerUpdateSchema),
  });

  const { loading, doCreateOrUpdate } = useResourceForm<z.infer<typeof adminServerUpdateSchema>, AdminServer>({
    form,
    updateFn: () => updateServer(contextServer.uuid, form.values),
    doUpdate: true,
    basePath: '/admin/servers',
    resourceName: 'Server',
  });

  useEffect(() => {
    if (contextServer) {
      form.setValues({
        ownerUuid: contextServer.owner.uuid,
        eggUuid: contextServer.egg.uuid,
        backupConfigurationUuid: contextServer.backupConfiguration?.uuid ?? uuidNil,
        externalId: contextServer.externalId,
        name: contextServer.name,
        description: contextServer.description,
        limits: contextServer.limits,
        pinnedCpus: contextServer.pinnedCpus,
        startup: contextServer.startup,
        image: contextServer.image,
        timezone: contextServer.timezone,
        featureLimits: contextServer.featureLimits,
      });
    }
  }, [contextServer]);

  const [selectedNestUuid, setSelectedNestUuid] = useState<string | null>(contextServer?.nest.uuid ?? '');

  const users = useSearchableResource<User>({
    fetcher: (search) => getUsers(1, search),
    defaultSearchValue: contextServer?.owner.username,
  });
  const nests = useSearchableResource<AdminNest>({
    fetcher: (search) => getNests(1, search),
    defaultSearchValue: contextServer?.nest.name,
  });
  const eggs = useSearchableResource<AdminNestEgg>({
    fetcher: (search) =>
      selectedNestUuid ? getEggs(selectedNestUuid, 1, search) : Promise.resolve(getEmptyPaginationSet()),
    defaultSearchValue: contextServer?.egg.name,
    deps: [selectedNestUuid],
  });
  const backupConfigurations = useSearchableResource<BackupConfiguration>({
    fetcher: (search) => getBackupConfigurations(1, search),
    defaultSearchValue: contextServer?.backupConfiguration?.name,
  });

  useEffect(() => {
    if (!form.values.eggUuid || contextServer) {
      return;
    }

    const egg = eggs.items.find((egg) => egg.uuid === form.values.eggUuid);
    if (!egg) {
      return;
    }

    form.setFieldValue('image', Object.values(egg.dockerImages)[0] ?? '');
    form.setFieldValue('startup', egg.startup);
  }, [form.values.eggUuid, eggs.items, contextServer]);

  return (
    <AdminContentContainer title='Update Server'>
      <form onSubmit={form.onSubmit(() => doCreateOrUpdate(false))}>
        <Stack>
          <Title order={2}>Update Server</Title>

          {contextServer.suspended && (
            <Alert title='Server Suspended' color='orange' icon={<FontAwesomeIcon icon={faCircleInfo} />}>
              This server is suspended.
            </Alert>
          )}

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
                    min={0}
                    value={form.values.limits.memory}
                    onChange={(value) => form.setFieldValue('limits.memory', value)}
                  />
                </Group>

                <Group grow>
                  <SizeInput
                    withAsterisk
                    label='Disk Space'
                    mode='mb'
                    min={0}
                    value={form.values.limits.disk}
                    onChange={(value) => form.setFieldValue('limits.disk', value)}
                  />
                  <SizeInput
                    withAsterisk
                    label='Swap'
                    mode='mb'
                    min={-1}
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
                        form.setFieldValue(
                          'startup',
                          eggs.items.find((e) => e.uuid === form.values.eggUuid)?.startup || '',
                        )
                      }
                    >
                      <FontAwesomeIcon icon={faReply} />
                    </ActionIcon>
                  }
                  {...form.getInputProps('startup')}
                />
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
          </Group>

          <Group>
            <Button type='submit' disabled={!form.isValid()} loading={loading}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </AdminContentContainer>
  );
}
