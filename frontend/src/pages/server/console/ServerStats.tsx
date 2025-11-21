import {
  faCloudArrowDown,
  faCloudArrowUp,
  faCloudDownload,
  faMemory,
  faMicrochip,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ReactNode, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import Card from '@/elements/Card';
import Tooltip from '@/elements/Tooltip';
import { hexToRgba } from '@/lib/color';
import { bytesToString } from '@/lib/size';
import { useServerStore } from '@/stores/server';
import { useChart, useChartTickLabel } from './chart';

function ChartBlock({
  icon,
  title,
  legend,
  children,
}: {
  icon: IconDefinition;
  title: string;
  legend?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className='relative'>
      <div className='flex items-center justify-between px-4 py-2'>
        <h3 className='transition-colors duration-100'>
          <FontAwesomeIcon icon={icon} /> {title}
        </h3>
        {legend && <span className='text-sm flex items-center'>{legend}</span>}
      </div>
      <div className='z-10 ml-2 min-h-full'>{children}</div>
    </Card>
  );
}

export default function ServerStats() {
  const server = useServerStore((state) => state.server);
  const stats = useServerStore((state) => state.stats);

  const networkPrevious = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });

  const cpu = useChartTickLabel('CPU', server.limits.cpu, '%', 2);
  const memory = useChartTickLabel('Memory', server.limits.memory, 'MiB');
  const network = useChart('Network', {
    sets: 2,
    options: {
      scales: {
        y: {
          ticks: {
            callback(value) {
              return bytesToString(typeof value === 'string' ? parseInt(value, 10) : value);
            },
          },
        },
      },
    },
    callback(opts, index) {
      return {
        ...opts,
        label: !index ? 'Network In' : 'Network Out',
        borderColor: !index ? '#22d3ee' : '#facc15', // cyan-400 & yellow-400
        backgroundColor: hexToRgba(!index ? '#0e7490' : '#a16207', 0.5), // cyan-700 & yellow-700
      };
    },
  });

  useEffect(() => {
    if (!stats?.state || stats?.state === 'offline') {
      return;
    }

    cpu.push(stats.cpuAbsolute);
    memory.push(Math.floor(stats.memoryBytes / 1024 / 1024));
    network.push([
      networkPrevious.current.tx < 0 ? 0 : Math.max(0, stats.network.txBytes - networkPrevious.current.tx),
      networkPrevious.current.rx < 0 ? 0 : Math.max(0, stats.network.rxBytes - networkPrevious.current.rx),
    ]);

    networkPrevious.current = { tx: stats.network.txBytes, rx: stats.network.rxBytes };
  }, [stats]);

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      <ChartBlock icon={faMicrochip} title='CPU Load'>
        <Line {...cpu.props} />
      </ChartBlock>
      <ChartBlock icon={faMemory} title='Memory Load'>
        <Line {...memory.props} />
      </ChartBlock>
      <ChartBlock
        icon={faCloudDownload}
        title='Network'
        legend={
          <>
            <Tooltip label='Inbound'>
              <FontAwesomeIcon icon={faCloudArrowDown} className='mr-2 h-4 w-4 text-yellow-400' />
            </Tooltip>
            <Tooltip label='Outbound'>
              <FontAwesomeIcon icon={faCloudArrowUp} className='h-4 w-4 text-cyan-400' />
            </Tooltip>
          </>
        }
      >
        <Line {...network.props} />
      </ChartBlock>
    </div>
  );
}
