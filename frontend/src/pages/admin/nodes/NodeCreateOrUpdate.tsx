import createNode from '@/api/admin/nodes/createNode';
import updateNode from '@/api/admin/nodes/updateNode';
import getNode from '@/api/admin/nodes/getNode';
import deleteNode from '@/api/admin/nodes/deleteNode';
import getAllLocations from '@/api/admin/locations/getAllLocations';
import { httpErrorToHuman } from '@/api/axios';
import AdminSettingContainer from '@/elements/AdminSettingContainer';
import { Button } from '@/elements/button';
import { Input } from '@/elements/inputs';
import { useToast } from '@/providers/ToastProvider';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Dialog } from '@/elements/dialog';
import Code from '@/elements/Code';
import classNames from 'classnames';

export default () => {
  const params = useParams<'id'>();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState<'delete'>(null);
  const [node, setNode] = useState<Node | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  // Basic Details
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [locationId, setLocationId] = useState<number>(0);
  const [isPublic, setIsPublic] = useState<boolean>(true);

  // Connection Settings
  const [fqdn, setFqdn] = useState<string>('');
  const [useSSL, setUseSSL] = useState<boolean>(true);
  const [behindProxy, setBehindProxy] = useState<boolean>(false);

  // Configuration
  const [daemonDirectory, setDaemonDirectory] = useState<string>('/var/lib/pterodactyl/volumes');
  const [totalMemory, setTotalMemory] = useState<number>(0);
  const [memoryOverAllocation, setMemoryOverAllocation] = useState<number>(0);
  const [totalDiskSpace, setTotalDiskSpace] = useState<number>(0);
  const [diskOverAllocation, setDiskOverAllocation] = useState<number>(0);
  const [daemonPort, setDaemonPort] = useState<number>(8080);
  const [daemonSftpPort, setDaemonSftpPort] = useState<number>(2022);

  // Maintenance
  const [maintenanceMessage, setMaintenanceMessage] = useState<string>('');

  useEffect(() => {
    // Load locations for dropdown
    getAllLocations()
      .then((locs) => {
        setLocations(locs);
        if (locs.length > 0 && !params.id) {
          setLocationId(locs[0].id);
        }
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });

    // Load existing node if editing
    if (params.id) {
      getNode(Number(params.id))
        .then((n) => {
          setNode(n);
          setName(n.name);
          setDescription(n.description || '');
          setLocationId(n.location.id);
          setIsPublic(n.public);
          setFqdn(n.url);
          setUseSSL(n.url.startsWith('https://'));
          setDaemonDirectory('/var/lib/pterodactyl/volumes'); // Default as not stored in model
          setTotalMemory(n.memory);
          setTotalDiskSpace(n.disk);
          setDaemonPort(8080); // Default as URL parsing would be complex
          setDaemonSftpPort(n.sftpPort);
          setMaintenanceMessage(n.maintenanceMessage || '');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        });
    }
  }, [params.id]);

  const doCreateOrUpdate = () => {
    if (!name.trim() || !fqdn.trim() || locationId === 0) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    setLoading(true);
    const nodeUrl = useSSL ? `https://${fqdn}:${daemonPort}` : `http://${fqdn}:${daemonPort}`;

    const data = {
      locationId,
      name: name.trim(),
      public: isPublic,
      description: description.trim() || undefined,
      url: nodeUrl,
      sftpPort: daemonSftpPort,
      memory: totalMemory,
      disk: totalDiskSpace,
      maintenanceMessage: maintenanceMessage.trim() || undefined,
    };

    if (node?.id) {
      updateNode(node.id, data)
        .then(() => {
          addToast('Node updated successfully', 'success');
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => setLoading(false));
    } else {
      createNode(data)
        .then((createdNode) => {
          addToast('Node created successfully', 'success');
          navigate(`/admin/nodes/${createdNode.id}`);
        })
        .catch((msg) => {
          addToast(httpErrorToHuman(msg), 'error');
        })
        .finally(() => setLoading(false));
    }
  };

  const doDelete = () => {
    if (!node) return;

    deleteNode(node.id)
      .then(() => {
        addToast('Node deleted successfully', 'success');
        navigate('/admin/nodes');
      })
      .catch((msg) => {
        addToast(httpErrorToHuman(msg), 'error');
      });
  };

  return (
    <>
      <Dialog.Confirm
        open={openDialog === 'delete'}
        hideCloseIcon
        onClose={() => setOpenDialog(null)}
        title={'Confirm Node Deletion'}
        confirm={'Delete'}
        onConfirmed={doDelete}
      >
        Are you sure you want to delete <Code>{node?.name}</Code>?
        {node?.servers > 0 && (
          <div className={'mt-2 p-2 bg-red-900/20 border border-red-500 rounded'}>
            <p className={'text-red-400'}>This node has {node.servers} servers and cannot be deleted.</p>
          </div>
        )}
      </Dialog.Confirm>

      <div className={'mb-4'}>
        <h1 className={'text-4xl font-bold text-white'}>{params.id ? 'Update' : 'Create'} Node</h1>
        <p className={'text-neutral-400 mt-1'}>Create a new local or remote node for servers to be installed to.</p>
      </div>

      <div className={'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
        {/* Basic Details */}
        <AdminSettingContainer title={'Basic Details'}>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'name'}>Name</Input.Label>
            <Input.Text
              id={'name'}
              placeholder={'Node Name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
            <p className={'text-xs text-neutral-400 mt-1'}>
              Character limits: a-zA-Z0-9_.- and [Space] (min 1, max 100 characters).
            </p>
          </div>

          <div className={'mt-4'}>
            <Input.Label htmlFor={'description'}>Description</Input.Label>
            <Input.Textarea
              id={'description'}
              placeholder={'Node Description (optional)'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className={'mt-4'}>
            <Input.Label htmlFor={'location'}>Location</Input.Label>
            <Input.Dropdown
              id={'location'}
              options={locations.map((loc) => ({ label: loc.name, value: loc.id.toString() }))}
              selected={locationId.toString()}
              onChange={(e) => setLocationId(Number(e.target.value))}
            />
          </div>

          <div className={'mt-4'}>
            <Input.Label htmlFor={'node-visibility'}>Node Visibility</Input.Label>
            <div className={'flex gap-4 mt-2'}>
              <label className={'flex items-center gap-2 cursor-pointer'}>
                <input
                  type={'radio'}
                  name={'visibility'}
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className={'text-blue-600'}
                />
                <span className={'text-sm text-neutral-200'}>Public</span>
              </label>
              <label className={'flex items-center gap-2 cursor-pointer'}>
                <input
                  type={'radio'}
                  name={'visibility'}
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className={'text-blue-600'}
                />
                <span className={'text-sm text-neutral-200'}>Private</span>
              </label>
            </div>
            {!isPublic && (
              <p className={'text-xs text-neutral-400 mt-1'}>
                By setting a node to private you will be denying the ability to auto-deploy to this node.
              </p>
            )}
          </div>

          <div className={'mt-4'}>
            <Input.Label htmlFor={'fqdn'}>FQDN</Input.Label>
            <Input.Text
              id={'fqdn'}
              placeholder={'node.example.com'}
              value={fqdn}
              onChange={(e) => setFqdn(e.target.value)}
            />
            <p className={'text-xs text-neutral-400 mt-1'}>
              Please enter domain name (e.g <Code>node.example.com</Code>) to be used for connecting to the daemon. An
              IP address may be used <strong>only</strong> if you are not using SSL for this node.
            </p>
          </div>

          <div className={'mt-4'}>
            <Input.Switch
              name={'useSSL'}
              label={'Use SSL Connection'}
              defaultChecked={useSSL}
              onChange={(e) => setUseSSL(e.target.checked)}
            />
            {!useSSL && (
              <p className={'text-xs text-red-400 mt-1'}>
                You Panel is currently configured to use a secure connection. In order for browsers to connect to your
                node it <strong>must</strong> use a SSL connection.
              </p>
            )}
          </div>

          <div className={'mt-4'}>
            <Input.Switch
              name={'behindProxy'}
              label={'Behind Proxy'}
              defaultChecked={behindProxy}
              onChange={(e) => setBehindProxy(e.target.checked)}
            />
            <p className={'text-xs text-neutral-400 mt-1'}>
              If you are running the daemon behind a proxy such as Cloudflare, select this to have the daemon skip
              looking for certificates on boot.
            </p>
          </div>
        </AdminSettingContainer>

        {/* Configuration */}
        <AdminSettingContainer title={'Configuration'}>
          <div className={'mt-4'}>
            <Input.Label htmlFor={'daemon-directory'}>Daemon Server File Directory</Input.Label>
            <Input.Text
              id={'daemon-directory'}
              value={daemonDirectory}
              onChange={(e) => setDaemonDirectory(e.target.value)}
            />
            <p className={'text-xs text-neutral-400 mt-1'}>
              Enter the directory where server files should be stored. If you use OVH you should check your partition
              scheme. You may need to use <Code>/home/daemon-data</Code> to have enough space.
            </p>
          </div>

          <div className={'grid grid-cols-2 gap-4 mt-4'}>
            <div>
              <Input.Label htmlFor={'memory'}>Total Memory</Input.Label>
              <div className={'relative'}>
                <Input.Text
                  id={'memory'}
                  type={'number'}
                  value={totalMemory.toString()}
                  onChange={(e) => setTotalMemory(Number(e.target.value))}
                  className={'pr-12'}
                />
                <span className={'absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-sm'}>
                  MiB
                </span>
              </div>
            </div>
            <div>
              <Input.Label htmlFor={'memory-over'}>Memory Over-Allocation</Input.Label>
              <div className={'relative'}>
                <Input.Text
                  id={'memory-over'}
                  type={'number'}
                  value={memoryOverAllocation.toString()}
                  onChange={(e) => setMemoryOverAllocation(Number(e.target.value))}
                  className={'pr-8'}
                />
                <span className={'absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-sm'}>
                  %
                </span>
              </div>
            </div>
          </div>
          <p className={'text-xs text-neutral-400 mt-1'}>
            Enter the total amount of memory available for new servers. If you would like to allow overallocation of
            memory enter the percentage that you want to allow. To disable checking for overallocation enter{' '}
            <Code>-1</Code> into the field. Entering <Code>0</Code> will prevent creating new servers if it would put
            the node over the limit.
          </p>

          <div className={'grid grid-cols-2 gap-4 mt-4'}>
            <div>
              <Input.Label htmlFor={'disk'}>Total Disk Space</Input.Label>
              <div className={'relative'}>
                <Input.Text
                  id={'disk'}
                  type={'number'}
                  value={totalDiskSpace.toString()}
                  onChange={(e) => setTotalDiskSpace(Number(e.target.value))}
                  className={'pr-12'}
                />
                <span className={'absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-sm'}>
                  MiB
                </span>
              </div>
            </div>
            <div>
              <Input.Label htmlFor={'disk-over'}>Disk Over-Allocation</Input.Label>
              <div className={'relative'}>
                <Input.Text
                  id={'disk-over'}
                  type={'number'}
                  value={diskOverAllocation.toString()}
                  onChange={(e) => setDiskOverAllocation(Number(e.target.value))}
                  className={'pr-8'}
                />
                <span className={'absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-sm'}>
                  %
                </span>
              </div>
            </div>
          </div>
          <p className={'text-xs text-neutral-400 mt-1'}>
            Enter the total amount of disk space available for new servers. If you would like to allow overallocation of
            disk space enter the percentage that you want to allow. To disable checking for overallocation enter{' '}
            <Code>-1</Code> into the field. Entering <Code>0</Code> will prevent creating new servers if it would put
            the node over the limit.
          </p>

          <div className={'grid grid-cols-2 gap-4 mt-4'}>
            <div>
              <Input.Label htmlFor={'daemon-port'}>Daemon Port</Input.Label>
              <Input.Text
                id={'daemon-port'}
                type={'number'}
                value={daemonPort.toString()}
                onChange={(e) => setDaemonPort(Number(e.target.value))}
              />
            </div>
            <div>
              <Input.Label htmlFor={'daemon-sftp-port'}>Daemon SFTP Port</Input.Label>
              <Input.Text
                id={'daemon-sftp-port'}
                type={'number'}
                value={daemonSftpPort.toString()}
                onChange={(e) => setDaemonSftpPort(Number(e.target.value))}
              />
            </div>
          </div>
          <p className={'text-xs text-neutral-400 mt-1'}>
            The daemon runs its own SFTP management container and does not use the SSHd process on the main physical
            server.{' '}
            <strong>
              Do not use the same port that you have assigned for your physical server&apos;s SSH process.
            </strong>{' '}
            If you will be running the daemon behind CloudFlare® you should set the daemon port to <Code>8443</Code> to
            allow websocket proxying over SSL.
          </p>

          {params.id && (
            <div className={'mt-4'}>
              <Input.Label htmlFor={'maintenance'}>Maintenance Message</Input.Label>
              <Input.Textarea
                id={'maintenance'}
                placeholder={'Optional maintenance message'}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </AdminSettingContainer>
      </div>

      <div className={classNames('mt-6 flex', node ? 'justify-between' : 'justify-end')}>
        {node && (
          <Button style={Button.Styles.Red} onClick={() => setOpenDialog('delete')} disabled={node.servers > 0}>
            Delete
          </Button>
        )}
        <Button onClick={doCreateOrUpdate} disabled={loading}>
          {loading ? 'Saving...' : params.id ? 'Update Node' : 'Create Node'}
        </Button>
      </div>
    </>
  );
};
