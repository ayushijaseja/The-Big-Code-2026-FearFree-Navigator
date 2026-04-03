import { useEffect, type MutableRefObject } from 'react';
import type { RouteResponse } from '@fear-free/shared-types';

export const useMapBounds = (
  mapRef: MutableRefObject<google.maps.Map | null>,
  routeData: RouteResponse | null
) => {
  useEffect(() => {
    if (routeData && routeData.routes.length > 0 && mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      
      routeData.routes[0].coordinates.forEach((coord) => {
        bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
      });

      mapRef.current.fitBounds(bounds, 80);
    }
  }, [routeData, mapRef]);
};