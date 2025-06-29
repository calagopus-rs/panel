import getWebsocketToken from '@/api/server/getWebsocketToken';
import { Websocket } from '@/plugins/Websocket';
import { useServerStore } from '@/stores/server';
import { useEffect } from 'react';

const reconnectErrors = ['jwt: exp claim is invalid', 'jwt: created too far in past (denylist)'];

export default () => {
  let updatingToken = false;

  const { uuid } = useServerStore(state => state.data);
  const { instance, setInstance, setConnectionState } = useServerStore(state => state.socket);
  const { setServerStatus } = useServerStore(state => state.status);

  const updateToken = (uuid: string, socket: Websocket) => {
    if (updatingToken) {
      return;
    }

    updatingToken = true;
    getWebsocketToken(uuid)
      .then(data => socket.setToken(data.token, true))
      .catch(error => console.error(error))
      .then(() => {
        updatingToken = false;
      });
  };

  const connect = (uuid: string) => {
    const socket = new Websocket();

    socket.on('auth success', () => setConnectionState(true));
    socket.on('SOCKET_CLOSE', () => setConnectionState(false));
    socket.on('SOCKET_ERROR', () => {
      setConnectionState(false);
    });
    socket.on('status', status => setServerStatus(status));

    socket.on('daemon error', message => {
      console.warn('Got error message from daemon socket:', message);
    });

    socket.on('token expiring', () => updateToken(uuid, socket));
    socket.on('token expired', () => updateToken(uuid, socket));
    socket.on('jwt error', (error: string) => {
      setConnectionState(false);
      console.warn('JWT validation error from wings:', error);

      if (reconnectErrors.find(v => error.toLowerCase().indexOf(v) >= 0)) {
        updateToken(uuid, socket);
      }
    });

    socket.on('transfer status', (status: string) => {
      if (status === 'starting' || status === 'success') {
        return;
      }

      // This code forces a reconnection to the websocket which will connect us to the target node instead of the source node
      // in order to be able to receive transfer logs from the target node.
      socket.close();
      setConnectionState(false);
      setInstance(null);
      connect(uuid);
    });

    getWebsocketToken(uuid)
      .then(data => {
        // Connect and then set the authentication token.
        socket.setToken(data.token).connect(data.socket);

        // Once that is done, set the instance.
        setInstance(socket);
      })
      .catch(error => console.error(error));
  };

  useEffect(() => {
    return () => {
      if (instance) {
        instance.close();
      }
    };
  }, [instance]);

  useEffect(() => {
    // If there is already an instance or there is no server, just exit out of this process
    // since we don't need to make a new connection.
    if (instance || !uuid) {
      return;
    }

    connect(uuid);
  }, [uuid]);

  return null;
};
