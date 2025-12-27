import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import getWebsocketToken from '@/api/server/getWebsocketToken.ts';
import { Websocket } from '@/plugins/Websocket.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';

export default function WebsocketHandler() {
  let updatingToken = false;

  const { uuid } = useServerStore((state) => state.server);
  const { socketInstance, setSocketInstance, setSocketConnectionState } = useServerStore();
  const { setState } = useServerStore();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const updateToken = (uuid: string, socket: Websocket) => {
    if (updatingToken) {
      return;
    }

    updatingToken = true;
    getWebsocketToken(uuid)
      .then((data) => socket.setToken(data.token, true))
      .catch((error) => console.error(error))
      .then(() => {
        updatingToken = false;
      });
  };

  const connect = (uuid: string) => {
    const socket = new Websocket();

    socket.on('auth success', () => setSocketConnectionState(true));
    socket.on('SOCKET_CLOSE', (reason: string) => {
      switch (reason) {
        case 'permission revoked':
          navigate('/');
          addToast('Connection to the server has been closed: permission revoked.', 'error');
          break;
        default:
          setSocketConnectionState(false);
          break;
      }
    });
    socket.on('SOCKET_ERROR', () => {
      setSocketConnectionState(false);
    });
    socket.on('status', (status) => setState(status));

    socket.on('daemon error', (message: string) => {
      console.warn('Got error message from daemon socket:', message);
    });

    socket.on('token expiring', () => updateToken(uuid, socket));
    socket.on('token expired', () => updateToken(uuid, socket));
    socket.on('jwt error', (error: string) => {
      setSocketConnectionState(false);
      console.warn('JWT validation error from wings:', error);

      if (error.toLowerCase().includes('expired')) {
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
      setSocketConnectionState(false);
      setSocketInstance(null);
      connect(uuid);
    });

    getWebsocketToken(uuid)
      .then((data) => {
        // Connect and then set the authentication token.
        socket.setToken(data.token).connect(data.socket);

        // Once that is done, set the instance.
        setSocketInstance(socket);
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    return () => {
      if (socketInstance) {
        socketInstance.close();
      }
    };
  }, [socketInstance]);

  useEffect(() => {
    // If there is already an instance or there is no server, just exit out of this process
    // since we don't need to make a new connection.
    if (socketInstance || !uuid) {
      return;
    }

    connect(uuid);
  }, [uuid]);

  return null;
}
