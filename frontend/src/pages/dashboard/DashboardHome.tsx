import { getServers } from '@/api/server/getServers';
import Container from '@/elements/Container';
import CopyOnClick from '@/elements/CopyOnClick';
import { Server, ServerPowerState, ServerStats } from '@/api/types';
import { faHardDrive, faMemory, faMicrochip, faTableCellsLarge, faTableList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { PaginatedResult } from '@/api/axios';
import Spinner from '@/elements/Spinner';
import { getServerResourceUsage } from '@/api/server/getServerResourceUsage';
import { formatAllocation, getPrimaryAllocation } from '@/lib/server';
import { bytesToString, mbToBytes } from '@/lib/size';

type ActiveDesign = 'row' | 'grid';

function ServerItem({ activeDesign, server }: { activeDesign: ActiveDesign; server: Server }) {
  const [stats, setStats] = useState<ServerStats | null>(null);

  useEffect(() => {
    getServerResourceUsage(server.id).then(setStats);
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
  const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Unlimited';

  return (
    <NavLink
      to={`/server/${server.id}`}
      className={classNames(
        activeDesign === 'grid' ? 'flex flex-col' : 'grid lg:grid-cols-2 xl:grid-cols-3 justify-between',
        'bg-gray-700 outline-2 outline-transparent hover:outline-gray-400 transition-colors duration-200 rounded',
      )}
    >
      <div className={classNames('px-6 py-4', [activeDesign === 'row' && 'xl:col-span-2'])}>
        <div className={classNames('flex items-center gap-2', [activeDesign === 'grid' && 'justify-between'])}>
          <span className="text-xl font-header font-medium truncate" title={server.name}>
            {server.name}
          </span>
          <div
            className={classNames(
              'rounded-full px-2 py-1 text-xs flex items-center gap-1',
              statusToColor(stats?.status)[0],
            )}
          >
            <div className={classNames('size-2 rounded-full', statusToColor(stats?.status)[1])}></div>
            <span>{statusToText(stats?.status)}</span>
          </div>
        </div>
        <CopyOnClick content={formatAllocation(getPrimaryAllocation(server.allocations))}>
          <p className="text-sm text-gray-400">{formatAllocation(getPrimaryAllocation(server.allocations))}</p>
        </CopyOnClick>
      </div>
      {stats === null ? (
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner />
        </div>
      ) : (
        <div
          className={classNames('p-4 grid gap-2 sm:grid-cols-3 bg-gray-800/50', [
            activeDesign === 'grid' && 'rounded-b-md',
          ])}
        >
          <div className="flex gap-2 text-sm justify-center items-center">
            <FontAwesomeIcon icon={faMicrochip} className="size-5 flex-none" />
            <div>
              <span className="mr-1">{stats.cpuUsagePercent.toFixed(2)} %</span>
              <span className="inline-block text-xs text-gray-400">/ {cpuLimit}</span>
            </div>
          </div>
          <div className="flex gap-2 text-sm justify-center items-center">
            <FontAwesomeIcon icon={faMemory} className="size-5 flex-none" />
            <div>
              <span className="mr-1">{bytesToString(stats.memoryUsageInBytes)}</span>
              <span className="inline-block text-xs text-gray-400">/ {memoryLimit}</span>
            </div>
          </div>
          <div className="flex gap-2 text-sm justify-center items-center">
            <FontAwesomeIcon icon={faHardDrive} className="size-5 flex-none" />
            <div>
              <span className="mr-1">{bytesToString(stats.diskUsageInBytes)}</span>
              <span className="inline-block text-xs text-gray-400">/ {diskLimit}</span>
            </div>
          </div>
        </div>
      )}
    </NavLink>
  );
}

export default function DashboardHome() {
  const [activeDesign, setActiveDesign] = useState<ActiveDesign>('grid');
  const [serverList, setServerList] = useState<PaginatedResult<Server>>();

  useEffect(() => {
    getServers().then(setServerList);
  }, []);

  return (
    <Container>
      <div className="justify-between flex items-center mb-2">
        <h1 className="text-4xl font-header font-bold text-white">Servers</h1>
        <div className="flex gap-2">
          <FontAwesomeIcon
            className={classNames('p-2 rounded-full cursor-pointer', [
              activeDesign === 'grid' ? 'bg-neutral-700 text-cyan-500' : 'bg-neutral-600 text-neutral-300',
            ])}
            size="lg"
            icon={faTableCellsLarge}
            onClick={() => setActiveDesign('grid')}
          />
          <FontAwesomeIcon
            className={classNames('p-2 rounded-full cursor-pointer', [
              activeDesign === 'row' ? 'bg-neutral-700 text-cyan-500' : 'bg-neutral-600 text-neutral-300',
            ])}
            size="lg"
            icon={faTableList}
            onClick={() => setActiveDesign('row')}
          />
        </div>
      </div>
      {!serverList ? (
        <div className="flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className={classNames('gap-4', [activeDesign === 'grid' ? 'grid md:grid-cols-2' : 'flex flex-col'])}>
          {serverList.items.map(server => (
            <ServerItem key={server.name} activeDesign={activeDesign} server={server} />
          ))}
        </div>
      )}
    </Container>
  );
}
