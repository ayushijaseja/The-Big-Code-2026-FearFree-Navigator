import { useEffect } from 'react';
import type { RouteResponse } from '@fear-free/shared-types';

export const useMapBounds = (
  map: google.maps.Map | null,
  routeData: RouteResponse | null,
  emergencyData: any | null 
) => {
  useEffect(() => {
    if (!map) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    let shouldZoom = false;

    if (emergencyData && emergencyData.coordinates?.length > 0) {
      emergencyData.coordinates.forEach((coord: any) => {
        bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
      });
      shouldZoom = true;
    } 
    else if (routeData && routeData.routes?.length > 0) {
      routeData.routes[0].coordinates.forEach((coord) => {
        bounds.extend(new window.google.maps.LatLng(coord.lat, coord.lng));
      });
      shouldZoom = true;
    }

    if (shouldZoom) {
      map.fitBounds(bounds, 80); 
    }
  }, [map, routeData, emergencyData]); 
};