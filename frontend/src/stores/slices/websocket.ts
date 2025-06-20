import type { Websocket } from '@/plugins/Websocket';

export interface WebsocketSlice {
  instance: Websocket | null;
  connected: boolean;
  setInstance: (instance: Websocket | null) => void;
  setConnectionState: (connected: boolean) => void;
}

export const createWebsocketSlice = (set): WebsocketSlice => ({
  instance: null as Websocket | null,
  connected: false,

  setInstance: (instance: Websocket | null) =>
    set(state => {
      state.socket.instance = instance;
    }),

  setConnectionState: (connected: boolean) =>
    set(state => {
      state.socket.connected = connected;
    }),
});
