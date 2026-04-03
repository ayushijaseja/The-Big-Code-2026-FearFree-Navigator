import { useEffect, useState, useRef } from 'react';
import { useMapStore } from '../store/useMapStore';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; 
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

export const useLiveLocation = (isActive: boolean) => {
  const setUserLocation = useMapStore((state) => state.setUserLocation);
  const [gpsError, setGpsError] = useState<string | null>(null);
  
  const lastLocation = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!isActive) {
      setUserLocation(null);
      lastLocation.current = null;
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLat = position.coords.latitude;
        const newLng = position.coords.longitude;

        setGpsError(null);

        if (lastLocation.current) {
          const distanceMoved = calculateDistance(
            lastLocation.current.lat,
            lastLocation.current.lng,
            newLat,
            newLng
          );
          
          if (distanceMoved < 2) return; 
        }

        const newLocation = { lat: newLat, lng: newLng };
        lastLocation.current = newLocation;
        setUserLocation(newLocation);
      },
      (error) => {
        console.warn("Live GPS Error:", error);
        setGpsError(error.message);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 0, 
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isActive, setUserLocation]);

  return { gpsError };
};