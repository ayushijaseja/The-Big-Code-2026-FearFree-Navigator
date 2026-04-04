import * as turf from '@turf/turf';

interface UserLocation {
    lat: number;
    lng: number;
    lastUpdated: number;
}

const activeLocations = new Map<string, UserLocation>();

const EXPIRATION_TIME_MS = 15 * 60 * 1000; 

export const locationService = {

    updateUserLocation: (userId: string, lat: number, lng: number) => {
        activeLocations.set(userId, { 
            lat, 
            lng, 
            lastUpdated: Date.now() 
        });
        console.log(`📍 Location updated for user: ${userId}`);
    },

    getNearbyUsers: (lat: number, lng: number, radiusInMeters: number, excludeUserId: string) => {
        const targetPoint = turf.point([lng, lat]);
        const nearbyUsers = [];
        const now = Date.now();

        for (const [id, loc] of activeLocations.entries()) {
            if (now - loc.lastUpdated > EXPIRATION_TIME_MS) {
                activeLocations.delete(id);
                continue;
            }

            if (id === excludeUserId) continue;

            const userPoint = turf.point([loc.lng, loc.lat]);
            const distance = turf.distance(targetPoint, userPoint, { units: 'meters' });

            if (distance <= radiusInMeters) {
                nearbyUsers.push({
                    userId: id,
                    lat: loc.lat,
                    lng: loc.lng,
                    distance: Math.round(distance) 
                });
            }
        }

        return nearbyUsers.sort((a, b) => a.distance - b.distance);
    }
};