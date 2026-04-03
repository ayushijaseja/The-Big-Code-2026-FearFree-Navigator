import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import { useMapStore } from '../store/useMapStore';

const containerStyle = { width: '100vw', height: '100vh' };
const center = { lat: 25.4300, lng: 81.7700 };

const mapOptions = {
  styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
      { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  ],
  disableDefaultUI: true,
};

export default function MapEngine() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const routeData = useMapStore((state) => state.routeData);

  if (!isLoaded) return <div style={{ color: 'white', backgroundColor: '#121212', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Map Engine...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={13}
      options={mapOptions}
    >
      {routeData && routeData.routes.map((route, index) => (
        <Polyline
          key={route.routeId}
          path={route.coordinates}
          options={{
            strokeColor: index === 0 ? '#00FF00' : '#888888', 
            strokeOpacity: index === 0 ? 1.0 : 0.4,
            strokeWeight: index === 0 ? 6 : 4,
            zIndex: index === 0 ? 10 : 1
          }}
        />
      ))}
    </GoogleMap>
  );
}