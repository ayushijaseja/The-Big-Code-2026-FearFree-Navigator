import { useCallback, useEffect, useRef } from 'react';
import SOSOverlay from './SOSOverlay';
import { useEmergencyReroute } from '../../hooks/useEmergencyReroute';
import { useLiveLocation } from '../../hooks/useLiveLocation'; 
import { getCurrentLocation } from '../../utils/geolocation'; 
import { useMapStore } from '../../store/useMapStore';
import { calculateDistance } from '../../utils/geoMath';
import { useAnomalyDetection } from '../../hooks/useAnolomalyDetection';

const REROUTE_THRESHOLD_METERS = 25; 

export default function SOSController() {
  const { executeReroute } = useEmergencyReroute();
  
  const isEmergencyMode = useMapStore((state) => state.isEmergencyMode);
  const userLocation = useMapStore((state) => state.userLocation);
  const setIsSosActive = useMapStore((state) => state.setSosOverlayOpen);
  const isSosActive = useMapStore((state) => state.isSosOverlayOpen);
  
  const lastRoutedLocation = useRef<{ lat: number; lng: number } | null>(null);

  useLiveLocation(isEmergencyMode);

  useAnomalyDetection(() => {
    setIsSosActive(true);
  });

  useEffect(() => {
    if (!isEmergencyMode || !userLocation || !lastRoutedLocation.current) return;

    const distanceMoved = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      lastRoutedLocation.current.lat,
      lastRoutedLocation.current.lng
    );

    if (distanceMoved > REROUTE_THRESHOLD_METERS) {
      console.log(`🔄 Rerouting... User moved ${distanceMoved.toFixed(0)}m`);
      
      lastRoutedLocation.current = userLocation; 
      
      executeReroute(userLocation).catch(e => console.error("Dynamic reroute failed", e));
    }
  }, [userLocation, isEmergencyMode, executeReroute]);


  const handleConfirmSOS = useCallback(async () => {
    try {
      const currentLocation = await getCurrentLocation();
      
      lastRoutedLocation.current = currentLocation; 
      
      const safeHaven = await executeReroute(currentLocation);

      setIsSosActive(false);
      alert(`🚨 EMERGENCY: Rerouting to ${safeHaven.name} immediately!`);
    } catch (e) {
      alert("🚨 Network Failed: Please dial local emergency numbers manually.");
    }
  }, [executeReroute]);

  return (
    <>
      <SOSOverlay 
        isOpen={isSosActive} 
        onCancel={() => setIsSosActive(true)} 
        onConfirm={handleConfirmSOS} 
      />
      
      <button 
        onClick={() => setIsSosActive(true)}
        className="fixed bottom-4 right-4 z-50 rounded bg-red-900 p-3 text-[10px] font-bold text-white transition-opacity hover:opacity-100"
      >
        ⚠️ TRIGGER SOS
      </button>
    </>
  );
}