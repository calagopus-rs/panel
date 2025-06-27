import useWebsocketEvent, { SocketEvent, SocketRequest } from '@/plugins/useWebsocketEvent';
import { useServerStore } from '@/stores/server';
import { useEffect } from 'react';

export default () => {
  const stats = useServerStore(state => state.stats);
  const { connected, instance } = useServerStore(state => state.socket);

  useEffect(() => {
    if (!connected || !instance) {
      return;
    }

    instance.send(SocketRequest.SEND_STATS);
  }, [instance, connected]);

  useWebsocketEvent(SocketEvent.STATS, data => {
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
    stats.setState(wsStats.state);
  });

  return null;
};
