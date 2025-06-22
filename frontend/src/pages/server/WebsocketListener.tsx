import useWebsocketEvent, { SocketEvent, SocketRequest } from '@/plugins/useWebsocketEvent';
import { useServerStore } from '@/stores/server';
import { useEffect } from 'react';

export default function WebsocketListener() {
  const stats = useServerStore(state => state.stats);
  const { connected, instance } = useServerStore(state => state.socket);

  useEffect(() => {
    if (!connected || !instance) {
      console.log('Not connected');
      return;
    }

    console.log('Sending stats');
    instance.send(SocketRequest.SEND_STATS);
  }, [instance, connected]);

  useWebsocketEvent(SocketEvent.STATS, data => {
    console.log('received stats');
    let wsStats: any = {};
    try {
      wsStats = JSON.parse(data);
    } catch {
      return;
    }

    stats.setMemory(wsStats.memory_bytes);
    stats.setCPU(wsStats.cpu_absolute);
    stats.setDisk(wsStats.disk_bytes);
    stats.setUptime(wsStats.uptime || 0);
    stats.setTX(wsStats.network.tx_bytes);
    stats.setRX(wsStats.network.rx_bytes);
  });

  return null;
}
