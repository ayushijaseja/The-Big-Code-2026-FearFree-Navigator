import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { useMapStore } from '../../store/useMapStore';
import { useMapBounds } from '../../hooks/useMapBounds';
import { useMapFlicker } from '../../hooks/useMapFlicker';
import { containerStyle, initialCenter, darkMapOptions } from '../../constants/mapOptions';
import { RoutePaths } from './RoutePath';
import { EmergencyRoute } from './EmergencyRoute';
import { NavigationCard } from './NavigationCard';

export default function MapEngine() {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const routeData = useMapStore((state) => state.routeData);
    const isEmergencyMode = useMapStore((state) => state.isEmergencyMode);
    const emergencyData = useMapStore((state) => state.emergencyData);
    const userLocation = useMapStore((state) => state.userLocation);

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const isMapAlive = useMapFlicker([routeData, emergencyData]);

    useMapBounds(map, routeData, emergencyData);

    useEffect(() => {
        if (map && userLocation && isEmergencyMode) {
            map.panTo(userLocation);
        }
    }, [map, userLocation, isEmergencyMode]);

    const onLoad = useCallback((m: google.maps.Map) => setMap(m), []);
    const onUnmount = useCallback(() => setMap(null), []);

    if (!isLoaded || !isMapAlive) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#121212] text-white font-mono text-sm tracking-widest opacity-50">
                {isEmergencyMode ? "REROUTING TO SAFE HAVEN..." : "CALCULATING ROUTE..."}
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full">
            <NavigationCard />
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={initialCenter}
                zoom={13}
                options={darkMapOptions}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                {!isEmergencyMode && routeData && (
                    <RoutePaths routes={routeData.routes} searchKey={routeData.destination} />
                )}

                {isEmergencyMode && emergencyData && (
                    <EmergencyRoute
                        coordinates={emergencyData.coordinates}
                        safeHavenName={emergencyData.safeHavenName}
                    />
                )}

                {isEmergencyMode && userLocation && (
                    <Marker
                        position={userLocation}
                        icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#4285F4',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        }}
                        zIndex={1000}
                    />
                )}
            </GoogleMap>
        </div>
    );
}