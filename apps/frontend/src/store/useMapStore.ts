import { create } from 'zustand';
import type { RouteResponse } from '@fear-free/shared-types';

interface MapState {
  routeData: RouteResponse | null;
  setRouteData: (data: RouteResponse | null) => void;
  clearRoutes: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  routeData: null,
  setRouteData: (data) => set({ routeData: data }),
  clearRoutes: () => set({ routeData: null }),
}));