import { Button } from '@/elements/button';
import Container from '@/elements/Container';
import { formatAllocation, formatUptime, getPrimaryAllocation } from '@/lib/server';
import { bytesToString, mbToBytes } from '@/lib/size';
import useWebsocketEvent, { SocketEvent, SocketRequest } from '@/plugins/useWebsocketEvent';
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
import { useEffect, useState } from 'react';

function StatCard({
  icon,
  label,
  value,
  limit,
}: {
  icon: IconDefinition;
  label: string;
  value: string;
  limit?: string;
}) {
  return (
    <div className="bg-gray-600 p-4 rounded flex gap-4">
      <FontAwesomeIcon className="text-gray-100 bg-gray-500 p-4 rounded-lg" size={'xl'} icon={icon} />
      <div className="flex flex-col">
        <span className="text-sm text-gray-400 font-bold">{label}</span>
        <span className="text-lg font-bold">
          {value} {limit && <span className="text-sm text-gray-400">/ {limit}</span>}
        </span>
      </div>
    </div>
  );
}

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

export default function ServerConsole() {
  const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });

  const server = useServerStore(state => state.data);
  const { connected, instance } = useServerStore(state => state.socket);

  useEffect(() => {
    if (!connected || !instance) {
      return;
    }

    instance.send(SocketRequest.SEND_STATS);
  }, [instance, connected]);

  useWebsocketEvent(SocketEvent.STATS, data => {
    let stats: any = {};
    try {
      stats = JSON.parse(data);
    } catch {
      return;
    }

    setStats({
      memory: stats.memory_bytes,
      cpu: stats.cpu_absolute,
      disk: stats.disk_bytes,
      tx: stats.network.tx_bytes,
      rx: stats.network.rx_bytes,
      uptime: stats.uptime || 0,
    });
  });

  const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
  const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
  const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + '%' : 'Unlimited';

  return (
    <Container>
      <div className="mb-4 flex justify-between">
        <h1 className="text-4xl font-header font-bold text-white">Server Console</h1>
        <div className="flex gap-2">
          <Button style={Button.Styles.Green}>Start</Button>
          <Button style={Button.Styles.Gray}>Restart</Button>
          <Button style={Button.Styles.Red}>Stop</Button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="col-span-3 bg-red-500 h-full">Console</div>
        <div className="col-span-1 grid gap-4">
          <StatCard
            icon={faEthernet}
            label="Address"
            value={formatAllocation(getPrimaryAllocation(server.allocations))}
          />
          <StatCard icon={faClock} label="Uptime" value={formatUptime(stats.uptime || 0)} />
          <StatCard icon={faMicrochip} label="CPU Load" value={`${stats.cpu.toFixed(2)}%`} limit={cpuLimit} />
          <StatCard icon={faMemory} label="Memory Load" value={bytesToString(stats.memory)} limit={memoryLimit} />
          <StatCard icon={faHardDrive} label="Disk Usage" value={bytesToString(stats.disk)} limit={diskLimit} />
          <StatCard icon={faCloudDownload} label="Network (In)" value={bytesToString(stats.rx)} />
          <StatCard icon={faCloudUpload} label="Network (Out)" value={bytesToString(stats.tx)} />
        </div>
      </div>
      <div className="bg-green-500 h-48">Stats</div>
    </Container>
  );
}
