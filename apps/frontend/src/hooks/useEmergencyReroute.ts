import { useState, useCallback } from 'react';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import { useMapStore } from '../store/useMapStore';

export const useEmergencyReroute = () => {
  const [isRerouting, setIsRerouting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const setEmergencyRoute = useMapStore((state) => state.setEmergencyRoute);

  const executeReroute = useCallback(async (currentLocation: { lat: number; lng: number }) => {
    setIsRerouting(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5001/api/v1/routes/handle-sos', currentLocation);

      const { polyline: encodedPolyline, safeHaven, distance, duration, instructions } = response.data;
      
      const decodedPath = polyline.decode(encodedPolyline);
      const coordinates = decodedPath.map((p: number[]) => ({ lat: p[0], lng: p[1] }));

      setEmergencyRoute({
        polyline: encodedPolyline,
        coordinates: coordinates,
        safeHavenName: safeHaven.name,
        distance: distance || "Unknown",
        duration: duration || "Unknown",
        currentInstruction: instructions || "Head towards the safe haven." 
      });

      console.log(polyline);

      return safeHaven;

    } catch (e: any) {
      console.error("SOS Reroute Failed:", e);
      setError(e.message || "Failed to contact emergency services.");
      throw e; 
    } finally {
      setIsRerouting(false);
    }
  }, [setEmergencyRoute]);

  return { executeReroute, isRerouting, error };
};