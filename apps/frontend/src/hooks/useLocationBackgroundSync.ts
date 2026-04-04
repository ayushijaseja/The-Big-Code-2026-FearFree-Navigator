import { useEffect, useRef } from 'react';
import { useMapStore } from '../store/useMapStore';

export const useLocationBackgroundSync = () => {
  const userLocation = useMapStore((state) => state.userLocation);
  
  const latestLocation = useRef(userLocation);

  useEffect(() => {
    latestLocation.current = userLocation;
  }, [userLocation]);

  const deviceId = useRef(
    localStorage.getItem('fearfree_device_id') || 
    `user_${Math.random().toString(36).substring(2, 9)}`
  );

  useEffect(() => {
    localStorage.setItem('fearfree_device_id', deviceId.current);

    const syncLocationToBackend = async () => {
      if (!latestLocation.current) return;

      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/routes/location/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: deviceId.current,
            lat: latestLocation.current.lat,
            lng: latestLocation.current.lng,
          }),
        });
      } catch (error) {
        console.error("Failed to sync location to backend:", error);
      }
    };

    syncLocationToBackend();

    const interval = setInterval(syncLocationToBackend, 150000);

    return () => clearInterval(interval);
  }, []); 
};