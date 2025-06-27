import { useServerStore } from '@/stores/server';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useChart, useChartTickLabel } from './chart';
import { bytesToString } from '@/lib/size';
import { useEffect, useRef } from 'react';
import styles from './console.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowDown, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import Tooltip from '@/elements/Tooltip';
import { hexToRgba } from '@/lib/color';

function ChartBlock({
  title,
  legend,
  children,
}: {
  title: string;
  legend?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.chart_container}>
      <div className={'flex items-center justify-between px-4 py-2'}>
        <h3 className={'font-header transition-colors duration-100'}>{title}</h3>
        {legend && <p className={'text-sm flex items-center'}>{legend}</p>}
      </div>
      <div className={'z-10 ml-2'}>{children}</div>
    </div>
  );
}

export default () => {
  const server = useServerStore(state => state.data);
  const stats = useServerStore(state => state.stats);

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
    if (!stats.state || stats.state === 'offline') {
      return;
    }

    cpu.push(stats.cpu);
    memory.push(Math.floor(stats.memory / 1024 / 1024));
    network.push([
      networkPrevious.current.tx < 0 ? 0 : Math.max(0, stats.tx - networkPrevious.current.tx),
      networkPrevious.current.rx < 0 ? 0 : Math.max(0, stats.rx - networkPrevious.current.rx),
    ]);

    networkPrevious.current = { tx: stats.tx, rx: stats.rx };
  }, [stats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ChartBlock title={'CPU Load'}>
        <Line {...cpu.props} />
      </ChartBlock>
      <ChartBlock title={'Memory'}>
        <Line {...memory.props} />
      </ChartBlock>
      <ChartBlock
        title={'Network'}
        legend={
          <>
            <Tooltip content={'Inbound'}>
              <FontAwesomeIcon icon={faCloudArrowDown} className={'mr-2 h-4 w-4 text-yellow-400'} />
            </Tooltip>
            <Tooltip content={'Outbound'}>
              <FontAwesomeIcon icon={faCloudArrowUp} className={'h-4 w-4 text-cyan-400'} />
            </Tooltip>
          </>
        }
      >
        <Line {...network.props} />
      </ChartBlock>
    </div>
  );
};
