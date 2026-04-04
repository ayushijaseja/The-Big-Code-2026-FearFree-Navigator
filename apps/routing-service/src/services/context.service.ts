import { randomUUID } from 'crypto';
import { SafeRoute } from '@fear-free/shared-types';

const activeRouteSessions = new Map<string, any>();

export const routeContextService = {

    saveRouteContext: (origin: string, destination: string, routes: SafeRoute[]) => {
        const sessionId = randomUUID();

        const contextData = {
            timestamp: new Date().toISOString(),
            origin,
            destination,
            topRouteSelected: routes[0].routeId,
            routes: routes.map(route => ({
                routeId: route.routeId,
                distance: route.distance,
                duration: route.duration,
                safetyScore: route.safetyScore,
                polyline: route.polyline,
                coordinates: route.coordinates, 
                safePlacesCount: route.metrics.safePlacesCount,
                safePlacesList: (route.metrics as any).safePlacesList || [], 
                litRoadsPercentage: route.metrics.litRoadsPercentage
            }))
        };

        activeRouteSessions.set(sessionId, contextData);
        console.log(`💾 Saved Context for Session: ${sessionId}`);

        setTimeout(() => {
            activeRouteSessions.delete(sessionId);
            console.log(`🧹 Cleared expired context for: ${sessionId}`);
        }, 1000 * 60 * 60 * 2);

        return sessionId;
    },

    getRouteContext: (sessionId: string) => {
        return activeRouteSessions.get(sessionId);
    }
};