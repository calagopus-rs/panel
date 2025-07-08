import { transformKeysToCamelCase } from '@/api/transformers';
import useWebsocketEvent, { SocketEvent, SocketRequest } from '@/plugins/useWebsocketEvent';
import { useServerStore } from '@/stores/server';
import { useEffect } from 'react';

export default () => {
  const { setStats } = useServerStore();
  const { socketConnected, socketInstance } = useServerStore();

  useEffect(() => {
    if (!socketConnected || !socketInstance) {
      return;
    }

    socketInstance.send(SocketRequest.SEND_STATS);
  }, [socketInstance, socketConnected]);

  useWebsocketEvent(SocketEvent.STATS, data => {
    let wsStats: any = {};
    try {
      wsStats = JSON.parse(data);
    } catch {
      return;
    }

    setStats(transformKeysToCamelCase(wsStats));
  });

  return null;
};
