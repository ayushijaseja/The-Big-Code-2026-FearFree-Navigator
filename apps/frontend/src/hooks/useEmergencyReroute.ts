import { useState, useCallback } from 'react';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import { useMapStore } from '../store/useMapStore';

export const useEmergencyReroute = () => {
  const [isRerouting, setIsRerouting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setEmergencyRoute = useMapStore((state) => state.setEmergencyRoute);
  const injectAIBriefing = useMapStore((state) => state.injectAIBriefing);

  const executeReroute = useCallback(async (currentLocation: { lat: number; lng: number }) => {
    setIsRerouting(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
      const response = await axios.post(`${API_URL}/routes/handle-sos`, currentLocation);

      const { polyline: encodedPolyline, safeHaven, distance, duration, instructions } = response.data;

      const decodedPath = polyline.decode(encodedPolyline);
      const coordinates = decodedPath.map((p: number[]) => ({ lat: p[0], lng: p[1] }));

      const emergencySessionId = `sos_${Date.now()}`;

      setEmergencyRoute({
        polyline: encodedPolyline,
        coordinates: coordinates,
        safeHavenName: safeHaven.name,
        distance: distance || "Unknown",
        duration: duration || "Unknown",
        currentInstruction: instructions || "Head towards the safe haven immediately.",
        instructions: instructions || "Head towards the safe haven immediately.",
        sessionId: emergencySessionId
      });

      injectAIBriefing({
        safetySummary: `CRITICAL: Rerouting to ${safeHaven.name}.`,
        primaryRisk: "Active Emergency SOS Triggered.",
        tacticalAdvice: "Follow the red route immediately. Do not stop. Emergency contacts have been notified."
      });

      return safeHaven;

    } catch (e: any) {
      console.error("SOS Reroute Failed:", e);
      setError(e.message || "Failed to contact emergency services.");
      throw e;
    } finally {
      setIsRerouting(false);
    }
  }, [setEmergencyRoute, injectAIBriefing]);

  return { executeReroute, isRerouting, error };
};