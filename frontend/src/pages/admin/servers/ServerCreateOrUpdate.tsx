import createServer from '@/api/admin/servers/createServer';
import { httpErrorToHuman } from '@/api/axios';
import AdminSettingContainer from '@/elements/AdminSettingContainer';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import getNodes from '@/api/admin/nodes/getNodes';
import getNests from '@/api/admin/nests/getNests';
import getEggs from '@/api/admin/nests/getEggs';
import getUsers from '@/api/admin/users/getUsers';
import getAllocations from '@/api/admin/nodes/getAllocations';
import { useAdminStore } from '@/stores/admin';
import Spinner from '@/elements/Spinner';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { nodes, setNodes, nests, setNests, eggs, setEggs, users, setUsers, allocations, setAllocations } = useAdminStore();

  const [loading, setLoading] = useState(true);
  const [server, setServer] = useState<AdminServer | null>(null);
  
  // Basic server info
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [externalId, setExternalId] = useState<string>('');
  
  // Server configuration
  const [nodeId, setNodeId] = useState<number>(0);
  const [ownerId, setOwnerId] = useState<number>(0);
  const [nestId, setNestId] = useState<number>(0);
  const [eggId, setEggId] = useState<number>(0);
  
  // Allocations
  const [allocationId, setAllocationId] = useState<number>(0);
  const [additionalAllocations, setAdditionalAllocations] = useState<number[]>([]);
  
  // Resource limits
  const [cpu, setCpu] = useState<number>(100);
  const [memory, setMemory] = useState<number>(1024);
  const [swap, setSwap] = useState<number>(0);
  const [disk, setDisk] = useState<number>(5120);
  const [ioWeight, setIoWeight] = useState<number>(500);
  const [pinnedCpus, setPinnedCpus] = useState<string>('');
  
  // Feature limits
  const [maxAllocations, setMaxAllocations] = useState<number>(5);
  const [maxDatabases, setMaxDatabases] = useState<number>(5);
  const [maxBackups, setMaxBackups] = useState<number>(2);
  
  // Startup configuration
  const [startup, setStartup] = useState<string>('');
  const [image, setImage] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('');
  
  // Options
  const [startOnCompletion, setStartOnCompletion] = useState<boolean>(true);
  const [skipScripts, setSkipScripts] = useState<boolean>(false);

  useEffect(() => {
    Promise.all([
      getNodes({ perPage: 100 }),
      getNests({ perPage: 100 }),
      getUsers({ perPage: 100 })
    ])
      .then(([nodesData, nestsData, usersData]) => {
        setNodes(nodesData);
        setNests(nestsData);
        setUsers(usersData);
        setLoading(false);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  }, []);

  useEffect(() => {
    if (nestId && nestId > 0) {
      getEggs(nestId, { perPage: 100 })
        .then((eggsData) => {
          setEggs(eggsData);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [nestId]);

  useEffect(() => {
    if (nodeId && nodeId > 0) {
      getAllocations(nodeId, { perPage: 100 })
        .then((allocationsData) => {
          setAllocations(allocationsData);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [nodeId]);

  const doCreateServer = () => {
    const pinnedCpusArray = pinnedCpus
      .split(',')
      .map(cpu => parseInt(cpu.trim()))
      .filter(cpu => !isNaN(cpu));

    createServer({
      nodeId,
      ownerId,
      eggId,
      allocationId: allocationId || undefined,
      allocationIds: [allocationId, ...additionalAllocations].filter(id => id > 0),
      startOnCompletion,
      skipScripts,
      externalId: externalId || undefined,
      name,
      description: description || undefined,
      limits: {
        cpu,
        memory,
        swap,
        disk,
        ioWeight,
      },
      pinnedCpus: pinnedCpusArray,
      startup,
      image,
      timezone: timezone || undefined,
      featureLimits: {
        allocations: maxAllocations,
        databases: maxDatabases,
        backups: maxBackups,
      },
    })
      .then((server) => {
        addToast('Server created successfully.', 'success');
        navigate(`/admin/servers/${server.id}`);
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  if (loading) {
    return <Spinner.Centered />;
  }

  return (
    <>
      <div className={'mb-4'}>
        <h1 className={'text-4xl font-bold text-white'}>{params.id ? 'Update' : 'Create'} Server</h1>
      </div>
      
      <AdminSettingContainer title={'Basic Information'}>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'name'}>Server Name</Input.Label>
          <Input.Text
            id={'name'}
            placeholder={'Server Name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'description'}>Description</Input.Label>
          <Input.Text
            id={'description'}
            placeholder={'Server Description'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'externalId'}>External ID</Input.Label>
          <Input.Text
            id={'externalId'}
            placeholder={'External ID (optional)'}
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
          />
        </div>
      </AdminSettingContainer>

      <AdminSettingContainer title={'Server Configuration'}>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'node'}>Node</Input.Label>
          <Input.Dropdown
            id={'node'}
            options={[
              { label: 'Select a node...', value: '0' },
              ...nodes.data.map(node => ({ label: node.name, value: node.id.toString() }))
            ]}
            selected={nodeId.toString()}
            onChange={(e) => setNodeId(parseInt(e.target.value))}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'owner'}>Owner</Input.Label>
          <Input.Dropdown
            id={'owner'}
            options={[
              { label: 'Select an owner...', value: '0' },
              ...users.data.map(user => ({ label: `${user.username} (${user.email})`, value: user.id.toString() }))
            ]}
            selected={ownerId.toString()}
            onChange={(e) => setOwnerId(parseInt(e.target.value))}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'nest'}>Nest</Input.Label>
          <Input.Dropdown
            id={'nest'}
            options={[
              { label: 'Select a nest...', value: '0' },
              ...nests.data.map(nest => ({ label: nest.name, value: nest.id.toString() }))
            ]}
            selected={nestId.toString()}
            onChange={(e) => setNestId(parseInt(e.target.value))}
          />
        </div>
        {nestId > 0 && (
          <div className={'mt-4'}>
            <Input.Label htmlFor={'egg'}>Egg</Input.Label>
            <Input.Dropdown
              id={'egg'}
              options={[
                { label: 'Select an egg...', value: '0' },
                ...eggs.data.map(egg => ({ label: egg.name, value: egg.id.toString() }))
              ]}
              selected={eggId.toString()}
              onChange={(e) => setEggId(parseInt(e.target.value))}
            />
          </div>
        )}
      </AdminSettingContainer>

      {nodeId > 0 && (
        <AdminSettingContainer title={'Allocations'}>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'allocation'}>Primary Allocation</Input.Label>
            <Input.Dropdown
              id={'allocation'}
              options={[
                { label: 'Select an allocation...', value: '0' },
                ...allocations.data.map(alloc => ({ 
                  label: `${alloc.ip}:${alloc.port}`,
                  value: alloc.id.toString()
                }))
              ]}
              selected={allocationId.toString()}
              onChange={(e) => setAllocationId(parseInt(e.target.value))}
            />
          </div>
        </AdminSettingContainer>
      )}

      <AdminSettingContainer title={'Resource Limits'}>
        <div className={'grid grid-cols-2 gap-4'}>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'cpu'}>CPU Limit (%)</Input.Label>
            <Input.Text
              id={'cpu'}
              type={'number'}
              placeholder={'100'}
              value={cpu.toString()}
              onChange={(e) => setCpu(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'memory'}>Memory (MB)</Input.Label>
            <Input.Text
              id={'memory'}
              type={'number'}
              placeholder={'1024'}
              value={memory.toString()}
              onChange={(e) => setMemory(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'swap'}>Swap (MB)</Input.Label>
            <Input.Text
              id={'swap'}
              type={'number'}
              placeholder={'0'}
              value={swap.toString()}
              onChange={(e) => setSwap(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'disk'}>Disk (MB)</Input.Label>
            <Input.Text
              id={'disk'}
              type={'number'}
              placeholder={'5120'}
              value={disk.toString()}
              onChange={(e) => setDisk(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'ioWeight'}>IO Weight</Input.Label>
            <Input.Text
              id={'ioWeight'}
              type={'number'}
              placeholder={'500'}
              value={ioWeight.toString()}
              onChange={(e) => setIoWeight(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'pinnedCpus'}>Pinned CPUs (comma separated)</Input.Label>
            <Input.Text
              id={'pinnedCpus'}
              placeholder={'0,1,2'}
              value={pinnedCpus}
              onChange={(e) => setPinnedCpus(e.target.value)}
            />
          </div>
        </div>
      </AdminSettingContainer>

      <AdminSettingContainer title={'Feature Limits'}>
        <div className={'grid grid-cols-3 gap-4'}>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'maxAllocations'}>Max Allocations</Input.Label>
            <Input.Text
              id={'maxAllocations'}
              type={'number'}
              placeholder={'5'}
              value={maxAllocations.toString()}
              onChange={(e) => setMaxAllocations(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'maxDatabases'}>Max Databases</Input.Label>
            <Input.Text
              id={'maxDatabases'}
              type={'number'}
              placeholder={'5'}
              value={maxDatabases.toString()}
              onChange={(e) => setMaxDatabases(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'maxBackups'}>Max Backups</Input.Label>
            <Input.Text
              id={'maxBackups'}
              type={'number'}
              placeholder={'2'}
              value={maxBackups.toString()}
              onChange={(e) => setMaxBackups(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </AdminSettingContainer>

      <AdminSettingContainer title={'Startup Configuration'}>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'startup'}>Startup Command</Input.Label>
          <Input.Text
            id={'startup'}
            placeholder={'java -Xms128M -XX:MaxRAMPercentage=95.0 -jar server.jar'}
            value={startup}
            onChange={(e) => setStartup(e.target.value)}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'image'}>Docker Image</Input.Label>
          <Input.Text
            id={'image'}
            placeholder={'ghcr.io/pterodactyl/java:17'}
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
        <div className={'mt-4'}>
          <Input.Label htmlFor={'timezone'}>Timezone</Input.Label>
          <Input.Text
            id={'timezone'}
            placeholder={'America/New_York'}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />
        </div>
      </AdminSettingContainer>

      <AdminSettingContainer title={'Options'}>
        <div className={'mt-4 flex items-center gap-4'}>
          <Input.Checkbox
            id={'startOnCompletion'}
            checked={startOnCompletion}
            onChange={(e) => setStartOnCompletion(e.target.checked)}
          />
          <Input.Label htmlFor={'startOnCompletion'}>Start server after installation completes</Input.Label>
        </div>
        <div className={'mt-4 flex items-center gap-4'}>
          <Input.Checkbox
            id={'skipScripts'}
            checked={skipScripts}
            onChange={(e) => setSkipScripts(e.target.checked)}
          />
          <Input.Label htmlFor={'skipScripts'}>Skip egg install script</Input.Label>
        </div>
      </AdminSettingContainer>

      <div className={'mt-6 flex justify-end'}>
        <Button onClick={doCreateServer}>Create Server</Button>
      </div>
    </>
  );
};