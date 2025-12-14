import { StateCreator } from 'zustand';
import { getEmptyPaginationSet } from '@/api/axios.ts';
import { AdminStore } from '@/stores/admin.tsx';

export interface LocationsSlice {
  locations: ResponseMeta<Location>;
  locationDatabaseHosts: ResponseMeta<LocationDatabaseHost>;

  setLocations: (locations: ResponseMeta<Location>) => void;
  addLocation: (location: Location) => void;
  removeLocation: (location: Location) => void;

  setLocationDatabaseHosts: (databaseHosts: ResponseMeta<LocationDatabaseHost>) => void;
  addLocationDatabaseHost: (databaseHost: LocationDatabaseHost) => void;
  removeLocationDatabaseHost: (databaseHost: LocationDatabaseHost) => void;
}

export const createLocationsSlice: StateCreator<AdminStore, [], [], LocationsSlice> = (set): LocationsSlice => ({
  locations: getEmptyPaginationSet<Location>(),
  locationDatabaseHosts: getEmptyPaginationSet<LocationDatabaseHost>(),

  setLocations: (value) => set((state) => ({ ...state, locations: value })),
  addLocation: (location) =>
    set((state) => ({
      locations: {
        ...state.locations,
        data: [...state.locations.data, location],
        total: state.locations.total + 1,
      },
    })),
  removeLocation: (location) =>
    set((state) => ({
      locations: {
        ...state.locations,
        data: state.locations.data.filter((l) => l.uuid !== location.uuid),
        total: state.locations.total - 1,
      },
    })),

  setLocationDatabaseHosts: (value) => set((state) => ({ ...state, locationDatabaseHosts: value })),
  addLocationDatabaseHost: (databaseHost) =>
    set((state) => ({
      locationDatabaseHosts: {
        ...state.locationDatabaseHosts,
        data: [...state.locationDatabaseHosts.data, databaseHost],
        total: state.locationDatabaseHosts.total + 1,
      },
    })),
  removeLocationDatabaseHost: (databaseHost) =>
    set((state) => ({
      locationDatabaseHosts: {
        ...state.locationDatabaseHosts,
        data: state.locationDatabaseHosts.data.filter((l) => l.databaseHost.uuid !== databaseHost.databaseHost.uuid),
        total: state.locationDatabaseHosts.total - 1,
      },
    })),
});
