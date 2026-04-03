import { useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useMapStore } from '../../store/useMapStore';
import { useMapBounds } from '../../hooks/useMapBounds';
import { containerStyle, initialCenter, darkMapOptions } from '../../constants/mapOptions';
import { RoutePaths } from './RoutePath';

export default function MapEngine() {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const routeData = useMapStore((state) => state.routeData);
    const mapRef = useRef<google.maps.Map | null>(null);

    useMapBounds(mapRef, routeData);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    if (!isLoaded) return (
        <div className="flex h-screen items-center justify-center bg-[#121212] text-white">
            Loading Map Engine...
        </div>
    );

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={initialCenter}
            zoom={13}
            options={darkMapOptions}
            onLoad={onLoad}
            onUnmount={onUnmount}
        >
            {routeData && <RoutePaths routes={routeData.routes} />}
        </GoogleMap>
    );
}