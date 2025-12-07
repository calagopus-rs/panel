import {
  faAdd,
  faExternalLink,
  faHardDrive,
  faInfoCircle,
  faMemory,
  faMicrochip,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ActionIcon } from '@mantine/core';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';
import Badge from '@/elements/Badge';
import Button from '@/elements/Button';
import Card from '@/elements/Card';
import CopyOnClick from '@/elements/CopyOnClick';
import Divider from '@/elements/Divider';
import Spinner from '@/elements/Spinner';
import Tooltip from '@/elements/Tooltip';
import { formatAllocation } from '@/lib/server';
import { bytesToString, mbToBytes } from '@/lib/size';
import { useUserStore } from '@/stores/user';
import ServerAddGroupModal from './modals/ServerAddGroupModal';

const statusToColor = (status: ServerPowerState) => {
  switch (status) {
    case 'running':
      return 'green';
    case 'starting':
      return 'yellow';
    case 'stopping':
      return 'red';
    default:
      return 'red';
  }
};

const statusToText = (status: ServerPowerState) => {
  switch (status) {
    case 'running':
      return 'Online';
    case 'starting':
      return 'Starting';
    case 'stopping':
      return 'Stopping';
    default:
      return 'Offline';
  }
};

export default function ServerItem({
  server,
  showGroupAddButton = false,
}: {
  server: Server;
  showGroupAddButton?: boolean;
}) {
  const { serverGroups } = useUserStore();

  const [openModal, setOpenModal] = useState<'add-group'>(null);
  const [stats, setStats] = useState<ResourceUsage | null>(null);

  useEffect(() => {
    getServerResourceUsage(server.uuid).then(setStats);
  }, [server]);

  const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
  const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
  const cpuLimit = server.limits.cpu !== 0 ? `${server.limits.cpu}%` : 'Unlimited';

  return (
    <>
      <ServerAddGroupModal server={server} opened={openModal === 'add-group'} onClose={() => setOpenModal(null)} />

      <NavLink to={`/server/${server.uuidShort}`}>

        <Card className='hover:border-gray-300! duration-200 h-full'>
          <div className='flex items-center gap-2 justify-between'>
            <span className='text-xl font-medium truncate flex items-center gap-2 flex-row' title={server.name}>

              <Badge color={statusToColor(stats?.state)}>{statusToText(stats?.state)}</Badge>
              {server.name}
              {serverGroups.every((g) => !g.serverOrder.includes(server.uuid)) && (
                <Tooltip className='ml-2' label='This server is not in any group'>
                  <FontAwesomeIcon size='sm' icon={faInfoCircle} />
                </Tooltip>
              )}
            </span>
            <div className='flex flex-row items-center gap-2'>
              {server.allocation ? (
                server.egg.separatePort ? (
                  <div className='flex flex-row gap-2'>
                    <CopyOnClick content={server.allocation.ipAlias ?? server.allocation.ip} className='w-fit'>
                      <Card p='xs'>
                        <p className='text-sm text-gray-400'>{server.allocation.ipAlias ?? server.allocation.ip}</p>
                      </Card>
                    </CopyOnClick>
                    <CopyOnClick content={server.allocation.port.toString()} className='w-fit'>
                      <Card p='xs'>
                        <p className='text-sm text-gray-400'>{server.allocation.port.toString()}</p>
                      </Card>
                    </CopyOnClick>
                  </div>
                ) : (
                  <CopyOnClick content={formatAllocation(server.allocation)} className='w-fit'>
                    <Card p='xs'>
                      <p className='text-sm text-gray-400'>{formatAllocation(server.allocation)}</p>
                    </Card>
                  </CopyOnClick>
                )
              ) : (
                <Card p='xs' className=''>
                  No Allocation
                </Card>
              )}
              <div className='flex flex-row items-center justify-between gap-2'>
                {showGroupAddButton && (
                  <Tooltip label={serverGroups.length === 0 ? 'No groups available to add to' : 'Add to Group'}>
                    <ActionIcon
                      size='input-sm'
                      variant='light'
                      disabled={serverGroups.length === 0}
                      onClick={() => setOpenModal('add-group')}
                    >
                      <FontAwesomeIcon icon={faAdd} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </div>

            </div>
          </div>


          <div className='flex flex-col justify-between gap-2'>


            <Divider my='md' />

            {server.status === 'installing' ? (
              <div className='col-span-3 flex flex-row items-center justify-center'>
                <Spinner />
                <p className='ml-2'>Installing</p>
              </div>
            ) : server.status === 'restoring_backup' ? (
              <div className='col-span-3 flex flex-row items-center justify-center'>
                <Spinner />
                <p className='ml-2'>Restoring Backup</p>
              </div>
            ) : server.status === 'install_failed' ? (
              <div className='col-span-3 flex flex-row items-center justify-center'>
                <FontAwesomeIcon size='2x' icon={faTriangleExclamation} color='yellow' />
                <p className='ml-2'>Install Failed</p>
              </div>
            ) : stats === null ? (
              <div className='col-span-3 flex flex-row items-center justify-center'>
                <Spinner />
              </div>
            ) : (
              <div className='flex flex-row'>
                <div className='flex gap-2 text-sm justify-center items-center'>
                  <FontAwesomeIcon icon={faMicrochip} className='size-5 flex-none' />
                  <div>
                    <span className='mr-1'>{stats.cpuAbsolute.toFixed(2)}%</span>
                    <span className='inline-block text-xs text-gray-400'>/ {cpuLimit}</span>
                  </div>
                </div>

                <Divider mx='sm' orientation='vertical' />

                <div className='flex gap-2 text-sm justify-center items-center'>
                  <FontAwesomeIcon icon={faMemory} className='size-5 flex-none' />
                  <div>
                    <span className='mr-1'>{bytesToString(stats.memoryBytes)}</span>
                    <span className='inline-block text-xs text-gray-400'>/ {memoryLimit}</span>
                  </div>
                </div>

                <Divider mx='sm' orientation='vertical' />

                <div className='flex gap-2 text-sm justify-center items-center'>
                  <FontAwesomeIcon icon={faHardDrive} className='size-5 flex-none' />
                  <div>
                    <span className='mr-1'>{bytesToString(stats.diskBytes)}</span>
                    <span className='inline-block text-xs text-gray-400'>/ {diskLimit}</span>
                  </div>
                </div>
              </div>
            )}


          </div>
        </Card >
      </ NavLink>
    </>
  );
}
