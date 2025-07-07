import { create } from 'zustand';
import { DatabasesSlice, createDatabasesSlice } from './slices/server/databases';
import { FilesSlice, createFilesSlice } from './slices/server/files';
import { SchedulesSlice, createSchedulesSlice } from './slices/server/schedules';
import { StateSlice, createStateSlice } from './slices/server/state';
import { StatsSlice, createStatsSlice } from './slices/server/stats';
import { WebsocketSlice, createWebsocketSlice } from './slices/server/websocket';
import { createServerSlice, ServerSlice } from './slices/server/server';

export interface ServerStore
  extends DatabasesSlice,
    FilesSlice,
    SchedulesSlice,
    ServerSlice,
    StatsSlice,
    StateSlice,
    WebsocketSlice {}

export const useServerStore = create<ServerStore>()((...a) => ({
  ...createDatabasesSlice(...a),
  ...createFilesSlice(...a),
  ...createSchedulesSlice(...a),
  ...createServerSlice(...a),
  ...createStateSlice(...a),
  ...createStatsSlice(...a),
  ...createWebsocketSlice(...a),
}));
