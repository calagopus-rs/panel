import React, { useCallback, useEffect, useState } from 'react';
import { Stack, Group, Paper, Title } from '@mantine/core';
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
import debounce from 'debounce';
import getUsers from '@/api/admin/users/getUsers';
import getNests from '@/api/admin/nests/getNests';
import getEggs from '@/api/admin/eggs/getEggs';
import { zones } from 'tzdata';
import { load } from '@/lib/debounce';
import updateServer from '@/api/admin/servers/updateServer';
import createServer from '@/api/admin/servers/createServer';
import deleteServer from '@/api/admin/servers/deleteServer';
import Modal from '@/elements/modals/Modal';
import getAvailableNodeAllocations from '@/api/admin/nodes/allocations/getAvailableNodeAllocations';
import { formatAllocation } from '@/lib/server';
import MultiSelect from '@/elements/input/MultiSelect';

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
  const [openModal, setOpenModal] = useState<'delete'>(null);
  const [deleteDoForce, setDeleteDoForce] = useState(false);
  const [deleteDoDeleteBackups, setDeleteDoDeleteBackups] = useState(false);
  const [deleteServerName, setDeleteServerName] = useState('');

  const [nodes, setNodes] = useState<Node[]>([]);
  const [doNodesRefetch, setDoNodesRefetch] = useState(false);
  const [nodeSearch, setNodeSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [doUsersRefetch, setDoUsersRefetch] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [nests, setNests] = useState<Nest[]>([]);
  const [selectedNestUuid, setSelectedNestUuid] = useState<string>(contextServer?.nest.uuid ?? '');
  const [doNestsRefetch, setDoNestsRefetch] = useState(false);
  const [nestSearch, setNestSearch] = useState('');
  const [eggs, setEggs] = useState<AdminNestEgg[]>([]);
  const [doEggsRefetch, setDoEggsRefetch] = useState(false);
  const [eggSearch, setEggSearch] = useState('');
  const [availableAllocations, setAvailableAllocations] = useState<NodeAllocation[]>([]);
  const [doAllocationsRefetch, setDoAllocationsRefetch] = useState(false);
  const [allocationsSearch, setAllocationsSearch] = useState('');
  const [primaryAllocationsSearch, setPrimaryAllocationsSearch] = useState('');

  const [server, setServer] = useState<UpdateAdminServer>({
    externalId: '',
    name: '',
    description: '',
    startOnCompletion: true,
    skipScripts: false,
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
      allocations: 1,
      databases: 0,
      backups: 0,
      schedules: 0,
    },
    nodeUuid: '',
    ownerUuid: '',
    eggUuid: '',
    allocationUuid: null,
    allocationUuids: [],
  });

  useEffect(() => {
    setServer({
      externalId: contextServer?.externalId ?? '',
      name: contextServer?.name ?? '',
      description: contextServer?.description ?? '',
      startOnCompletion: true,
      skipScripts: false,
      limits: contextServer?.limits ?? {
        cpu: 100,
        memory: 1024,
        swap: 0,
        disk: 10240,
        ioWeight: 500,
      },
      pinnedCpus: contextServer?.pinnedCpus ?? [],
      startup: contextServer?.startup ?? '',
      image: contextServer?.image ?? '',
      timezone: contextServer?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      featureLimits: contextServer?.featureLimits ?? {
        allocations: 1,
        databases: 0,
        backups: 0,
        schedules: 0,
      },
      nodeUuid: contextServer?.node.uuid ?? '',
      ownerUuid: contextServer?.owner.uuid ?? '',
      eggUuid: contextServer?.egg.uuid ?? '',
      allocationUuid: contextServer?.allocation?.uuid ?? null,
      allocationUuids: [],
    });
  }, [contextServer]);

  const fetchNodes = (search: string) => {
    getNodes(1, search)
      .then((response) => {
        setNodes(response.data);

        if (response.total > response.data.length) {
          setDoNodesRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const setDebouncedNodeSearch = useCallback(
    debounce((search: string) => {
      fetchNodes(search);
    }, 150),
    [],
  );

  useEffect(() => {
    if (doNodesRefetch) {
      setDebouncedNodeSearch(nodeSearch);
    }
  }, [nodeSearch]);

  const fetchUsers = (search: string) => {
    getUsers(1, search)
      .then((response) => {
        setUsers(response.data);

        if (response.total > response.data.length) {
          setDoUsersRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const setDebouncedUserSearch = useCallback(
    debounce((search: string) => {
      fetchUsers(search);
    }, 150),
    [],
  );

  useEffect(() => {
    if (doUsersRefetch) {
      setDebouncedUserSearch(userSearch);
    }
  }, [userSearch]);

  const fetchNests = (search: string) => {
    getNests(1, search)
      .then((response) => {
        setNests(response.data);

        if (response.total > response.data.length) {
          setDoNestsRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const setDebouncedNestSearch = useCallback(
    debounce((search: string) => {
      fetchNests(search);
    }, 150),
    [],
  );

  useEffect(() => {
    if (doNestsRefetch) {
      setDebouncedNestSearch(nestSearch);
    }
  }, [nestSearch]);

  const fetchEggs = (search: string) => {
    getEggs(selectedNestUuid, 1, search)
      .then((response) => {
        setEggs(response.data);

        if (response.total > response.data.length) {
          setDoEggsRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const setDebouncedEggSearch = useCallback(
    debounce((search: string) => {
      fetchEggs(search);
    }, 150),
    [],
  );

  useEffect(() => {
    if (doEggsRefetch) {
      setDebouncedEggSearch(eggSearch);
    }
  }, [eggSearch]);

  const fetchAvailableAllocations = (search: string) => {
    getAvailableNodeAllocations(server.nodeUuid, 1, search)
      .then((response) => {
        setAvailableAllocations(response.data);

        if (response.total > response.data.length) {
          setDoAllocationsRefetch(true);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  const setDebouncedAllocationSearch = useCallback(
    debounce((search: string) => {
      fetchAvailableAllocations(search);
    }, 150),
    [],
  );

  useEffect(() => {
    if (doAllocationsRefetch) {
      setDebouncedAllocationSearch(allocationsSearch);
    }
  }, [allocationsSearch]);

  useEffect(() => {
    if (doAllocationsRefetch) {
      setDebouncedAllocationSearch(primaryAllocationsSearch);
    }
  }, [primaryAllocationsSearch]);

  useEffect(() => {
    fetchNodes('');
    fetchUsers('');
    fetchNests('');
  }, []);

  useEffect(() => {
    if (!server.nodeUuid) {
      return;
    }

    fetchAvailableAllocations('');
  }, [server.nodeUuid]);

  useEffect(() => {
    if (!selectedNestUuid) {
      return;
    }

    fetchEggs('');
  }, [selectedNestUuid]);

  useEffect(() => {
    if (!server.eggUuid) {
      return;
    }

    const egg = eggs.find((egg) => egg.uuid === server.eggUuid);
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

  const doDelete = () => {
    load(true, setLoading);
    deleteServer(params.id, {
      force: deleteDoForce,
      deleteBackups: deleteDoDeleteBackups,
    })
      .then(() => {
        addToast('Server deleted.', 'success');
        navigate('/admin/servers');
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
      <Modal title={'Confirm Server Deletion'} onClose={() => setOpenModal(null)} opened={openModal === 'delete'}>
        <Stack>
          <Switch
            label={'Do you want to forcefully delete this server?'}
            name={'force'}
            defaultChecked={deleteDoForce}
            onChange={(e) => setDeleteDoForce(e.target.checked)}
          />

          <Switch
            label={'Do you want to delete backups of this server?'}
            name={'deleteBackups'}
            defaultChecked={deleteDoDeleteBackups}
            onChange={(e) => setDeleteDoDeleteBackups(e.target.checked)}
          />

          <TextInput
            withAsterisk
            label={'Confirm Server Name'}
            placeholder={'Server Name'}
            value={deleteServerName}
            onChange={(e) => setDeleteServerName(e.target.value)}
          />
        </Stack>

        <Group mt={'md'}>
          <Button color={'red'} disabled={server.name != deleteServerName} onClick={doDelete}>
            Okay
          </Button>
          <Button variant={'default'} onClick={() => setOpenModal(null)}>
            Cancel
          </Button>
        </Group>
      </Modal>

      <Stack>
        <Title order={2}>{params.id ? 'Update' : 'Create'} Server</Title>

        <Group grow align={'inherit'}>
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
                  data={nodes.map((node) => ({
                    label: node.name,
                    value: node.uuid,
                  }))}
                  searchable
                  searchValue={nodeSearch}
                  onSearchChange={setNodeSearch}
                />
                <Select
                  withAsterisk
                  label={'Owner'}
                  placeholder={'Owner'}
                  value={server.ownerUuid || ''}
                  onChange={(value) => setServer({ ...server, ownerUuid: value })}
                  data={users.map((user) => ({
                    label: user.username,
                    value: user.uuid,
                  }))}
                  searchable
                  searchValue={userSearch}
                  onSearchChange={setUserSearch}
                />
              </Group>

              <Group grow>
                <Select
                  withAsterisk
                  label={'Nest'}
                  placeholder={'nest'}
                  value={selectedNestUuid}
                  onChange={(value) => setSelectedNestUuid(value)}
                  data={nests.map((nest) => ({
                    label: nest.name,
                    value: nest.uuid,
                  }))}
                  searchable
                  searchValue={nestSearch}
                  onSearchChange={setNestSearch}
                />
                <Select
                  withAsterisk
                  label={'Egg'}
                  placeholder={'Egg'}
                  value={server.eggUuid || ''}
                  onChange={(value) => setServer({ ...server, eggUuid: value })}
                  disabled={!selectedNestUuid}
                  data={eggs.map((egg) => ({
                    label: egg.name,
                    value: egg.uuid,
                  }))}
                  searchable
                  searchValue={eggSearch}
                  onSearchChange={setEggSearch}
                />
              </Group>
            </Stack>
          </Paper>
        </Group>

        <Group grow align={'inherit'}>
          <Paper withBorder p='md'>
            <Stack>
              <Title order={3}>Resource Limits</Title>

              <Group grow>
                <NumberInput
                  withAsterisk
                  label={'CPU Limit (%)'}
                  placeholder={'100'}
                  value={server.limits.cpu || 100}
                  min={1}
                  onChange={(value) => setServer({ ...server, limits: { ...server.limits, cpu: Number(value) } })}
                />
                <NumberInput
                  withAsterisk
                  label={'Memory (MB)'}
                  placeholder={'1024'}
                  value={server.limits.memory || 100}
                  min={1}
                  onChange={(value) => setServer({ ...server, limits: { ...server.limits, memory: Number(value) } })}
                />
              </Group>

              <Group grow>
                <NumberInput
                  withAsterisk
                  label={'Disk Space (MB)'}
                  placeholder={'10240'}
                  value={server.limits.disk || 10240}
                  min={1}
                  onChange={(value) => setServer({ ...server, limits: { ...server.limits, disk: Number(value) } })}
                />
                <NumberInput
                  withAsterisk
                  label={'Swap (MB)'}
                  placeholder={'0'}
                  value={server.limits.swap || 0}
                  min={-1}
                  onChange={(value) => setServer({ ...server, limits: { ...server.limits, swap: Number(value) } })}
                />
                <NumberInput
                  label={'IO Weight'}
                  value={server.limits.ioWeight || null}
                  onChange={(value) => setServer({ ...server, limits: { ...server.limits, ioWeight: Number(value) } })}
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
                  data={Object.entries(eggs.find((egg) => egg.uuid === server.eggUuid)?.dockerImages || {}).map(
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
                label='Startup Command'
                placeholder='npm start'
                required
                rows={2}
                value={server.startup || ''}
                onChange={(event) => setServer({ ...server, startup: event.target.value })}
              />

              {!contextServer && (
                <Group grow>
                  <Switch
                    label='Start on Completion'
                    description='Start server after installation completes'
                    checked={server.startOnCompletion}
                    onChange={(event) => setServer({ ...server, startOnCompletion: event.target.checked })}
                  />
                  <Switch
                    label='Skip Scripts'
                    description='Skip running install scripts'
                    checked={server.skipScripts}
                    onChange={(event) => setServer({ ...server, skipScripts: event.target.checked })}
                  />
                </Group>
              )}
            </Stack>
          </Paper>
        </Group>

        <Group grow align={'inherit'}>
          <Paper withBorder p='md'>
            <Stack>
              <Title order={3}>Feature Limits</Title>

              <Group grow>
                <NumberInput
                  withAsterisk
                  label={'Allocations'}
                  placeholder={'1'}
                  min={0}
                  value={server.featureLimits.allocations || 1}
                  onChange={(value) =>
                    setServer({ ...server, featureLimits: { ...server.featureLimits, allocations: Number(value) } })
                  }
                />
                <NumberInput
                  withAsterisk
                  label={'Databases'}
                  placeholder={'0'}
                  min={0}
                  value={server.featureLimits.databases || 0}
                  onChange={(value) =>
                    setServer({ ...server, featureLimits: { ...server.featureLimits, databases: Number(value) } })
                  }
                />
                <NumberInput
                  withAsterisk
                  label={'Backups'}
                  placeholder={'0'}
                  min={0}
                  value={server.featureLimits.backups || 0}
                  onChange={(value) =>
                    setServer({ ...server, featureLimits: { ...server.featureLimits, backups: Number(value) } })
                  }
                />
                <NumberInput
                  withAsterisk
                  label={'Schedules'}
                  placeholder={'0'}
                  min={0}
                  value={server.featureLimits.schedules || 0}
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
                    placeholder={'host:port'}
                    value={server.allocationUuid}
                    disabled={!server.nodeUuid}
                    onChange={(value) => setServer({ ...server, allocationUuid: value })}
                    data={availableAllocations
                      .filter((alloc) => !server.allocationUuids.includes(alloc.uuid))
                      .map((alloc) => ({
                        label: formatAllocation(alloc),
                        value: alloc.uuid,
                      }))}
                    searchable
                    searchValue={primaryAllocationsSearch}
                    onSearchChange={setPrimaryAllocationsSearch}
                    allowDeselect
                  />
                  <MultiSelect
                    label={'Allocations'}
                    placeholder={'host:port'}
                    value={server.allocationUuids}
                    disabled={!server.nodeUuid}
                    onChange={(value) => setServer({ ...server, allocationUuids: value })}
                    data={availableAllocations
                      .filter((alloc) => alloc.uuid !== server.allocationUuid)
                      .map((alloc) => ({
                        label: formatAllocation(alloc),
                        value: alloc.uuid,
                      }))}
                    searchable
                    searchValue={allocationsSearch}
                    onSearchChange={setAllocationsSearch}
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
          {params.id && (
            <Button color={'red'} onClick={() => setOpenModal('delete')} loading={loading}>
              Delete
            </Button>
          )}
        </Group>
      </Stack>
    </>
  );
};
