import { getEmptyPaginationSet } from '@/api/axios';
import { AdminStore } from '@/stores/admin';
import { StateCreator } from 'zustand';

export interface LocationsSlice {
  locations: ResponseMeta<Location>;

  setLocations: (locations: ResponseMeta<Location>) => void;
  addLocation: (location: Location) => void;
  removeLocation: (location: Location) => void;
}

export const createLocationsSlice: StateCreator<AdminStore, [], [], LocationsSlice> = (set): LocationsSlice => ({
  locations: getEmptyPaginationSet<Location>(),

  setLocations: value => set(state => ({ ...state, locations: value })),
  addLocation: location =>
    set(state => ({
      locations: {
        ...state.locations,
        data: [...state.locations.data, location],
        total: state.locations.total + 1,
      },
    })),
  removeLocation: location =>
    set(state => ({
      locations: {
        ...state.locations,
        data: state.locations.data.filter(l => l.id !== location.id),
        total: state.locations.total - 1,
      },
    })),
});
