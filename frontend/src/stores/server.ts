import { create, StoreApi } from 'zustand';
import { createContext } from 'zustand-utils';
import { BackupsSlice, createBackupsSlice } from '@/stores/slices/server/backups';
import { AllocationsSlice, createAllocationsSlice } from '@/stores/slices/server/allocations';
import { createDatabasesSlice, DatabasesSlice } from '@/stores/slices/server/databases';
import { createFilesSlice, FilesSlice } from '@/stores/slices/server/files';
import { createSchedulesSlice, SchedulesSlice } from '@/stores/slices/server/schedules';
import { createServerSlice, ServerSlice } from '@/stores/slices/server/server';
import { createStatsSlice, StatsSlice } from '@/stores/slices/server/stats';
import { createStateSlice, StateSlice } from '@/stores/slices/server/state';
import { createSubusersSlice, SubusersSlice } from '@/stores/slices/server/subusers';
import { createStartupSlice, StartupSlice } from '@/stores/slices/server/startup';
import { createWebsocketSlice, WebsocketSlice } from '@/stores/slices/server/websocket';

export interface ServerStore
  extends AllocationsSlice,
    BackupsSlice,
    DatabasesSlice,
    FilesSlice,
    SchedulesSlice,
    ServerSlice,
    StatsSlice,
    StateSlice,
    SubusersSlice,
    StartupSlice,
    WebsocketSlice {
  reset: () => void;
}

const { Provider, useStore } = createContext<StoreApi<ServerStore>>();

export const createServerStore = () =>
  create<ServerStore>()((...a) => {
    const initialState = {} as ServerStore;
    Object.assign(initialState, {
      ...createAllocationsSlice(...a),
      ...createBackupsSlice(...a),
      ...createDatabasesSlice(...a),
      ...createFilesSlice(...a),
      ...createSchedulesSlice(...a),
      ...createServerSlice(...a),
      ...createStateSlice(...a),
      ...createStatsSlice(...a),
      ...createSubusersSlice(...a),
      ...createStartupSlice(...a),
      ...createWebsocketSlice(...a),
    });
    initialState.reset = () => a[0]((state) => ({ ...initialState, reset: state.reset }), true);
    return initialState;
  });

export const ServerStoreContextprovider = Provider;
export const useServerStore = useStore;
