import { Websocket } from '@/plugins/Websocket';
import { ServerStore } from '@/stores/server';
import { StateCreator } from 'zustand';

export interface WebsocketSlice {
  socketInstance: Websocket | null;
  socketConnected: boolean;

  setSocketInstance: (instance: Websocket | null) => void;
  setSocketConnectionState: (connected: boolean) => void;
}

export const createWebsocketSlice: StateCreator<ServerStore, [], [], WebsocketSlice> = (set): WebsocketSlice => ({
  socketInstance: null as Websocket | null,
  socketConnected: false,

  setSocketInstance: (value) => set((state) => ({ ...state, socketInstance: value })),
  setSocketConnectionState: (value) => set((state) => ({ ...state, socketConnected: value })),
});
