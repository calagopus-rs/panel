import { useServerStore } from '@/stores/server';
import { useEffect, useRef } from 'react';

export enum SocketEvent {
  DAEMON_MESSAGE = 'daemon message',
  DAEMON_ERROR = 'daemon error',
  INSTALL_OUTPUT = 'install output',
  INSTALL_STARTED = 'install started',
  INSTALL_COMPLETED = 'install completed',
  CONSOLE_OUTPUT = 'console output',
  STATUS = 'status',
  STATS = 'stats',
  TRANSFER_LOGS = 'transfer logs',
  TRANSFER_STATUS = 'transfer status',
  BACKUP_COMPLETED = 'backup completed',
  BACKUP_RESTORE_COMPLETED = 'backup restore completed',
}

export enum SocketRequest {
  SEND_LOGS = 'send logs',
  SEND_STATS = 'send stats',
  SET_STATE = 'set state',
}

const useWebsocketEvent = (event: SocketEvent, callback: (...data: string[]) => void) => {
  const { connected, instance } = useServerStore(state => state.socket);
  const savedCallback = useRef<any>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  return useEffect(() => {
    const eventListener = (...data: string[]) => savedCallback.current(...data);
    if (connected && instance) {
      instance.addListener(event, eventListener);
    }

    return () => {
      if (instance) {
        instance.removeListener(event, eventListener);
      }
    };
  }, [event, connected, instance]);
};

export default useWebsocketEvent;
