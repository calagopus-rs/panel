import {
  faClock,
  faCloudDownload,
  faCloudUpload,
  faCog,
  faEthernet,
  faHardDrive,
  faMemory,
  faMicrochip,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Popover, ThemeIcon } from '@mantine/core';
import { ReactNode, useEffect, useRef, useState } from 'react';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import CopyOnClick from '@/elements/CopyOnClick.tsx';
import Checkbox from '@/elements/input/Checkbox.tsx';
import { formatAllocation } from '@/lib/server.ts';
import { bytesToString, mbToBytes } from '@/lib/size.ts';
import { formatMiliseconds } from '@/lib/time.ts';
import { useTranslations } from '@/providers/TranslationProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

function StatCard({
  icon,
  label,
  value,
  copyOnClick,
  popover,
  limit,
  details,
}: {
  icon: IconDefinition;
  label: string;
  value: string;
  copyOnClick?: boolean;
  popover?: ReactNode;
  limit?: string | null;
  details?: string | null;
}) {
  return (
    <Card className='flex flex-row! items-center'>
      <ThemeIcon size='xl' radius='md'>
        <FontAwesomeIcon size='xl' icon={icon} />
      </ThemeIcon>
      <div className='flex flex-col ml-4 w-full'>
        <div className='w-full flex justify-between'>
          <span className='text-sm text-gray-400 font-bold'>{label}</span>
          {popover && (
            <Popover position='bottom' withArrow shadow='md'>
              <Popover.Target>
                <Button variant='transparent' size='compact-xs'>
                  <FontAwesomeIcon size='lg' icon={faCog} />
                </Button>
              </Popover.Target>
              <Popover.Dropdown>{popover}</Popover.Dropdown>
            </Popover>
          )}
        </div>
        <span className='text-lg font-bold'>
          {copyOnClick ? (
            <CopyOnClick content={value}>
              {value} {limit && <span className='text-sm text-gray-400'>/ {limit}</span>}{' '}
              {details && <span className='text-sm text-gray-400'>({details})</span>}
            </CopyOnClick>
          ) : (
            <>
              {value} {limit && <span className='text-sm text-gray-400'>/ {limit}</span>}{' '}
              {details && <span className='text-sm text-gray-400'>({details})</span>}
            </>
          )}
        </span>
      </div>
    </Card>
  );
}

export default function ServerDetails() {
  const { t } = useTranslations();
  const server = useServerStore((state) => state.server);
  const stats = useServerStore((state) => state.stats!);
  const state = useServerStore((state) => state.state);

  const [doNormalizeCpuLoad, setDoNormalizeCpuLoad] = useState(localStorage.getItem('normalize_cpu_load') === 'true');

  const networkRef = useRef({
    rxBytes: stats?.network.rxBytes,
    txBytes: stats?.network.txBytes,
    timestamp: Date.now(),
    rxSpeed: 0,
    txSpeed: 0,
  });

  useEffect(() => {
    localStorage.setItem('normalize_cpu_load', String(doNormalizeCpuLoad));
  }, [doNormalizeCpuLoad]);

  useEffect(() => {
    if (!stats) return;

    const now = Date.now();
    const timeDelta = (now - networkRef.current.timestamp) / 1000;

    if (timeDelta >= 0.5) {
      const rxDelta = stats.network.rxBytes - networkRef.current.rxBytes;
      const txDelta = stats.network.txBytes - networkRef.current.txBytes;

      networkRef.current = {
        rxBytes: stats.network.rxBytes,
        txBytes: stats.network.txBytes,
        timestamp: now,
        rxSpeed: rxDelta / timeDelta,
        txSpeed: txDelta / timeDelta,
      };
    }
  }, [stats]);

  return (
    <div className='flex flex-col space-y-4'>
      <StatCard
        icon={faEthernet}
        label={t('pages.server.console.details.address', {})}
        copyOnClick={!!server.allocation}
        value={server.allocation ? formatAllocation(server.allocation, server.egg.separatePort) : t('common.na', {})}
      />
      {server.egg.separatePort && server.allocation && (
        <StatCard
          icon={faEthernet}
          label={t('pages.server.console.details.port', {})}
          copyOnClick={!!server.allocation}
          value={server.allocation.port.toString()}
        />
      )}
      <StatCard
        icon={faClock}
        label={t('pages.server.console.details.uptime', {})}
        value={state === 'offline' ? t('common.enum.serverState.offline', {}) : formatMiliseconds(stats?.uptime || 0)}
      />
      <StatCard
        icon={faMicrochip}
        label={t('pages.server.console.details.cpuLoad', {})}
        value={
          state === 'offline'
            ? t('common.enum.serverState.offline', {})
            : doNormalizeCpuLoad
              ? `${((stats?.cpuAbsolute / (server.limits.cpu || 100)) * 100).toFixed(2)}%`
              : `${stats?.cpuAbsolute.toFixed(2)}%`
        }
        limit={
          doNormalizeCpuLoad ? null : server.limits.cpu !== 0 ? server.limits.cpu + '%' : t('common.unlimited', {})
        }
        popover={
          <Checkbox
            label={t('pages.server.console.details.normalizeCpuLoad', {})}
            checked={doNormalizeCpuLoad}
            onChange={(e) => setDoNormalizeCpuLoad(e.target.checked)}
          />
        }
      />
      <StatCard
        icon={faMemory}
        label={t('pages.server.console.details.memoryLoad', {})}
        value={state === 'offline' ? t('common.enum.serverState.offline', {}) : bytesToString(stats?.memoryBytes)}
        limit={server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : t('common.unlimited', {})}
      />
      <StatCard
        icon={faHardDrive}
        label={t('pages.server.console.details.diskUsage', {})}
        value={bytesToString(stats?.diskBytes)}
        limit={server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : t('common.unlimited', {})}
      />
      <StatCard
        icon={faCloudDownload}
        label={t('pages.server.console.details.networkIn', {})}
        value={state === 'offline' ? t('common.enum.serverState.offline', {}) : bytesToString(stats?.network.rxBytes)}
        details={
          state === 'offline' ? null : `${bytesToString(Math.round(networkRef.current.rxSpeed), undefined, true)}/s`
        }
      />
      <StatCard
        icon={faCloudUpload}
        label={t('pages.server.console.details.networkOut', {})}
        value={state === 'offline' ? t('common.enum.serverState.offline', {}) : bytesToString(stats?.network.txBytes)}
        details={
          state === 'offline' ? null : `${bytesToString(Math.round(networkRef.current.txSpeed), undefined, true)}/s`
        }
      />
    </div>
  );
}
