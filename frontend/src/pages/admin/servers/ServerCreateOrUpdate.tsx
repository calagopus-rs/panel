import React, { useEffect, useState } from 'react';
import { Stack, Group, Paper, Title, Alert } from '@mantine/core';
import { useNavigate, useParams } from 'react-router';
import TextInput from '@/elements/input/TextInput';
import TextArea from '@/elements/input/TextArea';
import NumberInput from '@/elements/input/NumberInput';
import Select from '@/elements/input/Select';
import Switch from '@/elements/input/Switch';
import Button from '@/elements/Button';
import getNodes from '@/api/admin/nodes/getNodes';
import { useToast } from '@/providers/ToastProvider';
import { httpErrorToHuman } from '@/api/axios';
import getUsers from '@/api/admin/users/getUsers';
import getNests from '@/api/admin/nests/getNests';
import getEggs from '@/api/admin/eggs/getEggs';
import { zones } from 'tzdata';
import { load } from '@/lib/debounce';
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

const timezones = Object.keys(zones)
  .sort()
  .map((zone) => ({
    value: zone,
    label: zone,
  }));

export default ({ contextServer }: { contextServer?: AdminServer }) => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [memoryInput, setMemoryInput] = useState('');
  const [diskInput, setDiskInput] = useState('');
  const [swapInput, setSwapInput] = useState('');
  const [selectedNestUuid, setSelectedNestUuid] = useState<string>(contextServer?.nest.uuid ?? '');

  const [server, setServer] = useState<Partial<UpdateAdminServer>>({
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
  });

  const nodes = useSearchableResource<Node>({ fetcher: (search) => getNodes(1, search) });
  const users = useSearchableResource<User>({ fetcher: (search) => getUsers(1, search) });
  const nests = useSearchableResource<Nest>({ fetcher: (search) => getNests(1, search) });
  const eggs = useSearchableResource<AdminNestEgg>({
    fetcher: (search) => getEggs(selectedNestUuid, 1, search),
    deps: [selectedNestUuid],
  });
  const availablePrimaryAllocations = useSearchableResource<NodeAllocation>({
    fetcher: (search) => getAvailableNodeAllocations(server.nodeUuid, 1, search),
    deps: [server.nodeUuid],
  });
  const availableAllocations = useSearchableResource<NodeAllocation>({
    fetcher: (search) => getAvailableNodeAllocations(server.nodeUuid, 1, search),
    deps: [server.nodeUuid],
  });
  const backupConfigurations = useSearchableResource<BackupConfiguration>({
    fetcher: (search) => getBackupConfigurations(1, search),
  });

  useEffect(() => {
    if (contextServer) {
      setServer({
        externalId: contextServer.externalId,
        name: contextServer.name,
        description: contextServer.description,
        limits: contextServer.limits,
        pinnedCpus: contextServer.pinnedCpus,
        startup: contextServer.startup,
        image: contextServer.image,
        timezone: contextServer.timezone,
        featureLimits: contextServer.featureLimits,
        nodeUuid: contextServer.node.uuid,
        ownerUuid: contextServer.owner.uuid,
        eggUuid: contextServer.egg.uuid,
        backupConfigurationUuid: contextServer.backupConfiguration?.uuid ?? uuidNil,
      });
    }
    setMemoryInput(
      contextServer ? bytesToString(mbToBytes(contextServer?.limits.memory)) : bytesToString(mbToBytes(1024)),
    );
    setDiskInput(
      contextServer ? bytesToString(mbToBytes(contextServer?.limits.disk)) : bytesToString(mbToBytes(10240)),
    );
    setSwapInput(contextServer ? bytesToString(mbToBytes(contextServer?.limits.swap)) : bytesToString(mbToBytes(0)));
  }, [contextServer]);

  useEffect(() => {
    if (!server.eggUuid) {
      return;
    }

    const egg = eggs.items.find((egg) => egg.uuid === server.eggUuid);
    if (!egg) {
      return;
    }

    setServer({
      ...server,
      image: Object.values(egg.dockerImages)[0] ?? '',
      startup: egg.startup ?? '',
    });
  }, [server.eggUuid]);

  const doCreateOrUpdate = () => {
    load(true, setLoading);
    if (params?.id) {
      updateServer(params.id, server)
        .then(() => {
          addToast('Server updated.', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    } else {
      createServer(server)
        .then((server) => {
          addToast('Server created.', 'success');
          navigate(`/admin/servers/${server.uuid}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => {
          load(false, setLoading);
        });
    }
  };

  return (
    <>
      <Stack>
        <Title order={2}>{params.id ? 'Update' : 'Create'} Server</Title>

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
                  value={server.name || ''}
                  onChange={(e) => setServer({ ...server, name: e.target.value })}
                />
                <TextInput
                  label={'External ID'}
                  placeholder={'Optional external identifier'}
                  value={server.externalId || ''}
                  onChange={(e) => setServer({ ...server, externalId: e.target.value })}
                />
              </Group>

              <TextArea
                label='Description'
                placeholder='Server description'
                rows={3}
                value={server.description || ''}
                onChange={(e) => setServer({ ...server, description: e.target.value })}
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
                  value={server.nodeUuid || ''}
                  onChange={(value) => setServer({ ...server, nodeUuid: value })}
                  data={nodes.items.map((node) => ({
                    label: node.name,
                    value: node.uuid,
                  }))}
                  searchable
                  searchValue={nodes.search}
                  onSearchChange={nodes.setSearch}
                />
                <Select
                  withAsterisk
                  label={'Owner'}
                  placeholder={'Owner'}
                  value={server.ownerUuid || ''}
                  onChange={(value) => setServer({ ...server, ownerUuid: value })}
                  data={users.items.map((user) => ({
                    label: user.username,
                    value: user.uuid,
                  }))}
                  searchable
                  searchValue={users.search}
                  onSearchChange={users.setSearch}
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
                  value={server.eggUuid || ''}
                  onChange={(value) => setServer({ ...server, eggUuid: value })}
                  disabled={!selectedNestUuid}
                  data={eggs.items.map((egg) => ({
                    label: egg.name,
                    value: egg.uuid,
                  }))}
                  searchable
                  searchValue={eggs.search}
                  onSearchChange={eggs.setSearch}
                />
              </Group>

              <Group grow>
                <Select
                  allowDeselect
                  label={'Backup Configuration'}
                  value={server.backupConfigurationUuid ?? uuidNil}
                  onChange={(value) => setServer({ ...server, backupConfigurationUuid: value ?? uuidNil })}
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
                  value={server.limits.cpu || 100}
                  min={0}
                  onChange={(value) => setServer({ ...server, limits: { ...server.limits, cpu: Number(value) } })}
                />
                <SizeInput
                  withAsterisk
                  label={'Memory + Unit (e.g. 1 GiB)'}
                  value={memoryInput}
                  setState={setMemoryInput}
                  onChange={(value) =>
                    setServer({ ...server, limits: { ...server.limits, memory: value / 1024 / 1024 } })
                  }
                />
              </Group>

              <Group grow>
                <SizeInput
                  withAsterisk
                  label={'Disk Space + Unit (e.g. 10 GiB)'}
                  value={diskInput}
                  setState={setDiskInput}
                  onChange={(value) =>
                    setServer({ ...server, limits: { ...server.limits, disk: value / 1024 / 1024 } })
                  }
                />
                <SizeInput
                  withAsterisk
                  label={'Swap + Unit (e.g. 500 MiB)'}
                  value={swapInput}
                  setState={setSwapInput}
                  onChange={(value) =>
                    setServer({ ...server, limits: { ...server.limits, swap: value / 1024 / 1024 } })
                  }
                />
                <NumberInput
                  label={'IO Weight'}
                  value={server.limits.ioWeight || null}
                  onChange={(value) =>
                    setServer({ ...server, limits: { ...server.limits, ioWeight: Number(value) || null } })
                  }
                />
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
                  value={server.image || ''}
                  onChange={(value) => setServer({ ...server, image: value })}
                  data={Object.entries(eggs.items.find((egg) => egg.uuid === server.eggUuid)?.dockerImages || {}).map(
                    ([label, value]) => ({
                      label,
                      value,
                    }),
                  )}
                  searchable
                />
                <Select
                  withAsterisk
                  label={'Timezone'}
                  placeholder={'Europe/Amsterdam'}
                  value={server.timezone || ''}
                  onChange={(value) => setServer({ ...server, timezone: value })}
                  data={timezones}
                  searchable
                />
              </Group>

              <TextArea
                label={'Startup Command'}
                placeholder={'npm start'}
                required
                rows={2}
                value={server.startup || ''}
                onChange={(event) => setServer({ ...server, startup: event.target.value })}
              />

              {!contextServer && (
                <Group grow>
                  <Switch
                    label={'Start on Completion'}
                    description={'Start server after installation completes'}
                    checked={server.startOnCompletion}
                    onChange={(event) => setServer({ ...server, startOnCompletion: event.target.checked })}
                  />
                  <Switch
                    label={'Skip Installer'}
                    description={'Skip running the install script'}
                    checked={server.skipInstaller}
                    onChange={(event) => setServer({ ...server, skipInstaller: event.target.checked })}
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
                  value={server.featureLimits.allocations}
                  onChange={(value) =>
                    setServer({ ...server, featureLimits: { ...server.featureLimits, allocations: Number(value) } })
                  }
                />
                <NumberInput
                  withAsterisk
                  label={'Databases'}
                  placeholder={'0'}
                  min={0}
                  value={server.featureLimits.databases}
                  onChange={(value) =>
                    setServer({ ...server, featureLimits: { ...server.featureLimits, databases: Number(value) } })
                  }
                />
                <NumberInput
                  withAsterisk
                  label={'Backups'}
                  placeholder={'0'}
                  min={0}
                  value={server.featureLimits.backups}
                  onChange={(value) =>
                    setServer({ ...server, featureLimits: { ...server.featureLimits, backups: Number(value) } })
                  }
                />
                <NumberInput
                  withAsterisk
                  label={'Schedules'}
                  placeholder={'0'}
                  min={0}
                  value={server.featureLimits.schedules}
                  onChange={(value) =>
                    setServer({ ...server, featureLimits: { ...server.featureLimits, schedules: Number(value) } })
                  }
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
                    value={server.allocationUuid}
                    disabled={!server.nodeUuid}
                    onChange={(value) => setServer({ ...server, allocationUuid: value })}
                    data={availablePrimaryAllocations.items
                      .filter((alloc) => !server.allocationUuids.includes(alloc.uuid))
                      .map((alloc) => ({
                        label: formatAllocation(alloc),
                        value: alloc.uuid,
                      }))}
                    searchable
                    searchValue={availablePrimaryAllocations.search}
                    onSearchChange={availablePrimaryAllocations.setSearch}
                    allowDeselect
                  />
                  <MultiSelect
                    label={'Additional Allocations'}
                    placeholder={'Additional Allocations'}
                    value={server.allocationUuids}
                    disabled={!server.nodeUuid}
                    onChange={(value) => setServer({ ...server, allocationUuids: value })}
                    data={availableAllocations.items
                      .filter((alloc) => alloc.uuid !== server.allocationUuid)
                      .map((alloc) => ({
                        label: formatAllocation(alloc),
                        value: alloc.uuid,
                      }))}
                    searchable
                    searchValue={availableAllocations.search}
                    onSearchChange={availableAllocations.setSearch}
                  />
                </Group>
              </Stack>
            </Paper>
          )}
        </Group>

        <Group>
          <Button onClick={doCreateOrUpdate} loading={loading}>
            Save
          </Button>
        </Group>
      </Stack>
    </>
  );
};
