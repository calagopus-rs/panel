import Card from '@/elements/Card';
import CopyOnClick from '@/elements/CopyOnClick';
import { formatAllocation } from '@/lib/server';
import { bytesToString, mbToBytes } from '@/lib/size';
import { formatMiliseconds } from '@/lib/time';
import { useServerStore } from '@/stores/server';
import {
  faClock,
  faCloudDownload,
  faCloudUpload,
  faEthernet,
  faHardDrive,
  faMemory,
  faMicrochip,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ThemeIcon } from '@mantine/core';

function StatCard({
  icon,
  label,
  value,
  copyOnClick,
  limit,
}: {
  icon: IconDefinition;
  label: string;
  value: string;
  copyOnClick?: boolean;
  limit?: string;
}) {
  return (
    <Card className={'flex !flex-row items-center'}>
      <ThemeIcon size={'xl'} radius={'md'}>
        <FontAwesomeIcon size={'xl'} icon={icon} />
      </ThemeIcon>
      <div className={'flex flex-col ml-4'}>
        <span className={'text-sm text-gray-400 font-bold'}>{label}</span>
        <span className={'text-lg font-bold'}>
          {copyOnClick ? (
            <CopyOnClick content={value}>
              {value} {limit && <span className={'text-sm text-gray-400'}>/ {limit}</span>}
            </CopyOnClick>
          ) : (
            <>
              {value} {limit && <span className={'text-sm text-gray-400'}>/ {limit}</span>}
            </>
          )}
        </span>
      </div>
    </Card>
  );
}

export default () => {
  const server = useServerStore((state) => state.server);
  const stats = useServerStore((state) => state.stats);
  const state = useServerStore((state) => state.state);

  const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
  const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
  const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + '%' : 'Unlimited';

  return (
    <div className={'flex flex-col space-y-4'}>
      <StatCard
        icon={faEthernet}
        label={'Address'}
        copyOnClick={!!server.allocation}
        value={server.allocation ? formatAllocation(server.allocation) : 'N/A'}
      />
      <StatCard
        icon={faClock}
        label={'Uptime'}
        value={state === 'offline' ? 'Offline' : formatMiliseconds(stats?.uptime || 0)}
      />
      <StatCard
        icon={faMicrochip}
        label={'CPU Load'}
        value={state === 'offline' ? 'Offline' : `${stats?.cpuAbsolute.toFixed(2)}%`}
        limit={state === 'offline' ? null : cpuLimit}
      />
      <StatCard
        icon={faMemory}
        label={'Memory Load'}
        value={state === 'offline' ? 'Offline' : bytesToString(stats?.memoryBytes)}
        limit={state === 'offline' ? null : memoryLimit}
      />
      <StatCard icon={faHardDrive} label={'Disk Usage'} value={bytesToString(stats?.diskBytes)} limit={diskLimit} />
      <StatCard
        icon={faCloudDownload}
        label={'Network (In)'}
        value={state === 'offline' ? 'Offline' : bytesToString(stats?.network.rxBytes)}
      />
      <StatCard
        icon={faCloudUpload}
        label={'Network (Out)'}
        value={state === 'offline' ? 'Offline' : bytesToString(stats?.network.txBytes)}
      />
    </div>
  );
};
