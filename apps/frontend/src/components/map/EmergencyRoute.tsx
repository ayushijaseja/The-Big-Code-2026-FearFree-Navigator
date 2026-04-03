import { Polyline } from '@react-google-maps/api';

interface EmergencyRouteProps {
    coordinates: { lat: number; lng: number }[];
    safeHavenName: string;
}

export const EmergencyRoute = ({ coordinates, safeHavenName }: EmergencyRouteProps) => {
    if (!coordinates || coordinates.length === 0) return null;

    return (
        <Polyline
            key={safeHavenName} 
            path={coordinates}
            options={{
                strokeColor: '#FF0000',
                strokeOpacity: 1,
                strokeWeight: 8,
                zIndex: 999, 
            }}
        />
    );
};