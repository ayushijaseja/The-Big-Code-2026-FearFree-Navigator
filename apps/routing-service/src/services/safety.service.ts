import axios from 'axios';
import * as turf from '@turf/turf';
import { Coordinate } from '@fear-free/shared-types';

function sampleRoutePoints(coordinates: Coordinate[], intervalKm: number = 1): Coordinate[] {
    if (coordinates.length < 2) return coordinates;

    const line = turf.lineString(coordinates.map(c => [c.lng, c.lat]));
    const totalDistance = turf.length(line, { units: 'kilometers' });
    const sampledPoints: Coordinate[] = [];

    for (let i = 0; i <= totalDistance; i += intervalKm) {
        const point = turf.along(line, i, { units: 'kilometers' });
        sampledPoints.push({
            lat: point.geometry.coordinates[1],
            lng: point.geometry.coordinates[0]
        });
    }

    sampledPoints.push(coordinates[coordinates.length - 1]);
    return sampledPoints;
}

async function countSafePlacesNearby(lat: number, lng: number): Promise<number> {
    try {
        const radius = 500; 
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=hospital|police|pharmacy&opennow=true&key=${process.env.GOOGLE_MAPS_API_KEY}`;
        
        const response = await axios.get(url);
        
        if (response.data.status === 'OK') {
            return response.data.results.length;
        }
        return 0;
    } catch (error) {
        console.error("Places API Error at point:", lat, lng);
        return 0;
    }
}

export async function calculateRouteSafetyScore(coordinates: Coordinate[]): Promise<{ score: number, safePlacesCount: number }> {
    const sampledPoints = sampleRoutePoints(coordinates, 1.5); 
    
    const placesPromises = sampledPoints.map(point => countSafePlacesNearby(point.lat, point.lng));
    const results = await Promise.all(placesPromises);

    const totalSafePlaces = results.reduce((sum, current) => sum + current, 0);

    let baseScore = 30; 
    let placesBonus = totalSafePlaces * 10; 
    
    let finalScore = Math.min(baseScore + placesBonus, 95); 

    return {
        score: finalScore,
        safePlacesCount: totalSafePlaces
    };
}