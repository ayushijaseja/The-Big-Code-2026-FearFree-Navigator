export interface Coordinate {
  lat: number;
  lng: number;
}

export interface SafeRoute {
  routeId: string;
  distance: string;
  duration: string;
  safetyScore: number;
  polyline: string;      
  coordinates: Coordinate[];
  aiBrefing?: string;
  instructions: string;
  metrics: {
    safePlacesCount: number;
    litRoadsPercentage: number;
  };
}

export interface RouteResponse {
  message: string;
  origin: string;
  sessionId: string;
  destination: string;
  totalRoutes: number;
  routes: SafeRoute[];
}

export interface SOSPayload {
  userId: string;
  currentLocation: Coordinate;
  sensorTrigger: "sustained_acceleration" | "audio_anomaly" | "manual";
  timestamp: string;
}

export interface EmergencyRerouteResponse {
  status: "dispatched";
  message: string;
  safeHaven: {
    name: string;
    location: Coordinate;
    type: "hospital" | "police" | "gas_station";
  };
  reroutePolyline: string;
}

interface ChatContext {
    userMessage: string;
    currentLocation?: { lat: number, lng: number };
    destination?: string;
    routeDistance?: string;
}