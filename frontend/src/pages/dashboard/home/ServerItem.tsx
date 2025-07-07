import getServerResourceUsage from '@/api/server/getServerResourceUsage';
import CopyOnClick from '@/elements/CopyOnClick';
import Spinner from '@/elements/Spinner';
import { formatAllocation } from '@/lib/server';
import { bytesToString, mbToBytes } from '@/lib/size';
import { useGlobalStore } from '@/stores/global';
import { faMicrochip, faMemory, faHardDrive } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';

export default ({ server }: { server: ApiServer }) => {
  const { serverListDesign } = useGlobalStore();
  const [stats, setStats] = useState<ResourceUsage | null>(null);

  useEffect(() => {
    getServerResourceUsage(server.uuid).then(setStats);
  }, []);

  const statusToColor = (status: ServerPowerState) => {
    switch (status) {
      case 'running':
        return ['bg-emerald-400/30', 'bg-emerald-500'];
      case 'starting':
        return ['bg-yellow-400/30', 'bg-yellow-500'];
      case 'stopping':
        return ['bg-rose-400/30', 'bg-rose-500'];
      default:
        return ['bg-rose-400/30', 'bg-rose-500'];
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

  const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
  const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
  const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + '%' : 'Unlimited';

  return (
    <NavLink
      to={`/server/${server.uuidShort}`}
      className={classNames(
        serverListDesign === 'grid' ? 'flex flex-col' : 'grid lg:grid-cols-2 xl:grid-cols-3 justify-between',
        'bg-gray-700 outline-2 outline-transparent hover:outline-gray-400 transition-colors duration-200 rounded',
      )}
    >
      <div className={classNames('px-6 py-4', [serverListDesign === 'row' && 'xl:col-span-2'])}>
        <div className={classNames('flex items-center gap-2', [serverListDesign === 'grid' && 'justify-between'])}>
          <span className="text-xl font-medium truncate" title={server.name}>
            {server.name}
          </span>
          <div
            className={classNames(
              'rounded-full px-2 py-1 text-xs flex items-center gap-1',
              statusToColor(stats?.state)[0],
            )}
          >
            <div className={classNames('size-2 rounded-full', statusToColor(stats?.state)[1])}></div>
            <span>{statusToText(stats?.state)}</span>
          </div>
        </div>
        {/* <CopyOnClick content={formatAllocation(getPrimaryAllocation(server.allocation))}>
          <p className="text-sm text-gray-400">{formatAllocation(getPrimaryAllocation(server.allocations))}</p>
        </CopyOnClick> */}
        <CopyOnClick content={formatAllocation(server.allocation)}>
          <p className="text-sm text-gray-400">{formatAllocation(server.allocation)}</p>
        </CopyOnClick>
      </div>
      <div
        className={classNames('p-4 grid gap-2 sm:grid-cols-3 bg-gray-800/50', [
          serverListDesign === 'grid' && 'rounded-b-md',
        ])}
      >
        {stats === null ? (
          <div className="col-span-3 flex flex-col items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="flex gap-2 text-sm justify-center items-center">
              <FontAwesomeIcon icon={faMicrochip} className="size-5 flex-none" />
              <div>
                <span className="mr-1">{stats.cpuAbsolute.toFixed(2)}%</span>
                <span className="inline-block text-xs text-gray-400">/ {cpuLimit}</span>
              </div>
            </div>
            <div className="flex gap-2 text-sm justify-center items-center">
              <FontAwesomeIcon icon={faMemory} className="size-5 flex-none" />
              <div>
                <span className="mr-1">{bytesToString(stats.memoryBytes)}</span>
                <span className="inline-block text-xs text-gray-400">/ {memoryLimit}</span>
              </div>
            </div>
            <div className="flex gap-2 text-sm justify-center items-center">
              <FontAwesomeIcon icon={faHardDrive} className="size-5 flex-none" />
              <div>
                <span className="mr-1">{bytesToString(stats.diskBytes)}</span>
                <span className="inline-block text-xs text-gray-400">/ {diskLimit}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </NavLink>
  );
};
