import { create } from 'zustand';
import { AllocationsSlice, createAllocationsSlice } from './slices/server/allocations';
import { BackupsSlice, createBackupsSlice } from './slices/server/backups';
import { DatabasesSlice, createDatabasesSlice } from './slices/server/databases';
import { FilesSlice, createFilesSlice } from './slices/server/files';
import { SchedulesSlice, createSchedulesSlice } from './slices/server/schedules';
import { ServerSlice, createServerSlice } from './slices/server/server';
import { StateSlice, createStateSlice } from './slices/server/state';
import { StatsSlice, createStatsSlice } from './slices/server/stats';
import { SubusersSlice, createSubusersSlice } from './slices/server/subusers';
import { StartupSlice, createStartupSlice } from './slices/server/startup';
import { WebsocketSlice, createWebsocketSlice } from './slices/server/websocket';

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

export const useServerStore = create<ServerStore>()((...a) => {
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
  initialState.reset = () => useServerStore.setState((state) => ({ ...initialState, reset: state.reset }), true);
  return initialState;
});
