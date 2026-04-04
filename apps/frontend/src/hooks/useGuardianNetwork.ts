import { useState, useEffect, useRef } from 'react';
import { useMapStore } from '../store/useMapStore';

interface Guardian {
  userId: string;
  lat: number;
  lng: number;
  distance: number;
}

export const useGuardiansNetwork = (radiusInMeters = 2000) => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const userLocation = useMapStore((state) => state.userLocation);
  
  const deviceId = useRef(
    localStorage.getItem('fearfree_device_id') || 
    `user_${Math.random().toString(36).substring(2, 9)}`
  );

  useEffect(() => {
    localStorage.setItem('fearfree_device_id', deviceId.current);

    if (!userLocation) return;


    const fetchGuardians = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/routes/location/nearby`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: deviceId.current,
            lat: userLocation.lat,
            lng: userLocation.lng,
            radius: radiusInMeters
          }),
        });

        const data = await response.json();
        console.log("data", data);
        if (data.users) {
          setGuardians(data.users);
        }
      } catch (error) {
        console.error("Failed to sync with Guardian Network:", error);
      }
    };

    fetchGuardians();

    const interval = setInterval(fetchGuardians, 150000);

    return () => clearInterval(interval);
  }, [userLocation, radiusInMeters]);

  return guardians;
};