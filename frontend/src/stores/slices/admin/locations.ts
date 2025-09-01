import { getEmptyPaginationSet } from '@/api/axios';
import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface LocationsSlice {
  locations: ResponseMeta<Location>;

  setLocations: (locations: ResponseMeta<Location>) => void;
  addLocation: (location: Location) => void;
  removeLocation: (location: Location) => void;

  locationDatabaseHosts: ResponseMeta<LocationDatabaseHost>;

  setLocationDatabaseHosts: (databaseHosts: ResponseMeta<LocationDatabaseHost>) => void;
  addLocationDatabaseHost: (databaseHost: LocationDatabaseHost) => void;
  removeLocationDatabaseHost: (databaseHost: LocationDatabaseHost) => void;
}

export const createLocationsSlice: StateCreator<AdminStore, [], [], LocationsSlice> = (set): LocationsSlice => ({
  locations: getEmptyPaginationSet<Location>(),

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

  locationDatabaseHosts: getEmptyPaginationSet<LocationDatabaseHost>(),

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
