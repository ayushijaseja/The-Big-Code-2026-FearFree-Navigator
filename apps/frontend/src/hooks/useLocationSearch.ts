import { useState } from 'react';
import { useSafeRoutes } from './useSafeRoutes';

export const useLocationSearch = () => {
  const [origin, setOrigin] = useState("IIIT Allahabad");
  const [destination, setDestination] = useState("Prayagraj Junction");
  const { mutate: fetchRoutes, isPending } = useSafeRoutes();

  const handleSearch = () => {
    if (origin && destination) {
      fetchRoutes({ origin, destination });
    }
  };

  const syncCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setOrigin(`${pos.coords.latitude},${pos.coords.longitude}`);
      });
    }
  };

  return {
    origin,
    setOrigin,
    destination,
    setDestination,
    handleSearch,
    syncCurrentLocation,
    isPending
  };
};