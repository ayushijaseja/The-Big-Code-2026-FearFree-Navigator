import { create } from 'zustand';
import type { RouteResponse, Coordinate } from '@fear-free/shared-types';

export interface SafetyBriefing {
  safetySummary: string;
  primaryRisk: string;
  tacticalAdvice: string;
}

interface EmergencyData {
  polyline: string;
  coordinates: Coordinate[];
  safeHavenName: string;
  distance: string;
  duration: string;
  currentInstruction: string;
  aiBriefing?: SafetyBriefing;
  sessionId: string
  instructions: string
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

  injectAIBriefing: (briefing: SafetyBriefing) => void;

  standardBriefing: SafetyBriefing | null; 
  setStandardBriefing: (briefing: SafetyBriefing | null) => void;

  isActiveEscortOpen: boolean;
  openActiveEscort: () => void;
  closeActiveEscort: () => void;

  triggerEmergencyMode: () => void;

  currentInstruction: string | null;
  setCurrentInstruction: (instruction: string) => void;
}

export const useMapStore = create<MapState>((set) => ({
  routeData: null,
  isEmergencyMode: false,
  emergencyData: null,
  userLocation: null,
  standardBriefing: null,
  isActiveEscortOpen: false,
  currentInstruction: null,

  setCurrentInstruction: (instruction) => set({ currentInstruction: instruction }),

  triggerEmergencyMode: () => set({ isEmergencyMode: true }),

  openActiveEscort: () => set({ isActiveEscortOpen: true }),
  closeActiveEscort: () => set({ isActiveEscortOpen: false }),

  setStandardBriefing: (briefing) => set({ standardBriefing: briefing }),

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

  injectAIBriefing: (briefing) =>
    set((state) => ({
      emergencyData: state.emergencyData ? { ...state.emergencyData, aiBriefing: briefing } : null
    })),
}));