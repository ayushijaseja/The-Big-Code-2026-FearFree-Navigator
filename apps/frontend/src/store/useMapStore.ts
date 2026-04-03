import { create } from 'zustand';
import type { RouteResponse, Coordinate } from '@fear-free/shared-types';

interface EmergencyData {
  polyline: string;
  coordinates: Coordinate[];
  safeHavenName: string;
  distance: string;
  duration: string;
  currentInstruction: string;
}

interface MapState {
  routeData: RouteResponse | null;
  setRouteData: (data: RouteResponse | null) => void;

  isEmergencyMode: boolean;
  emergencyData: EmergencyData | null;
  
  setEmergencyRoute: (data: EmergencyData) => void;
  clearRoutes: () => void;
  exitEmergencyMode: () => void;

  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (coords: { lat: number; lng: number } | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  routeData: null,
  isEmergencyMode: false,
  emergencyData: null,
  userLocation: null,

  setUserLocation: (coords) => set({ userLocation: coords }),

  setRouteData: (data) => set({ 
    routeData: data, 
    isEmergencyMode: false, 
    emergencyData: null 
  }),

  setEmergencyRoute: (data) => set({ 
    isEmergencyMode: true, 
    emergencyData: data,
    routeData: null 
  }),

  exitEmergencyMode: () => set({ 
    isEmergencyMode: false, 
    emergencyData: null 
  }),

  clearRoutes: () => set({ 
    routeData: null, 
    isEmergencyMode: false, 
    emergencyData: null 
  }),
}));