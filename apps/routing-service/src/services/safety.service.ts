import axios from 'axios';
import * as turf from '@turf/turf';
import { Coordinate } from '@fear-free/shared-types';
import safeNodes from '../data/safe-nodes.json';
import densityGrid from '../data/density-grid.json';

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
        const radius = 200; 
        const keyword = 'pharmacy|police|hospital|atm|bank|restaurant|cafe';
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${keyword}&key=${process.env.GOOGLE_CLOUD_API_KEY}`;
        
        const response = await axios.get(url, { timeout: 5000, proxy: false });
        
        console.log(`📍 [Places Debug] Lat: ${lat}, Found: ${response.data.results?.length || 0} places`);
        
        if (response.data.status === 'OK') {
            return response.data.results.length;
        }
        return 0;
    } catch (error: any) {
        console.error("Places Error:", error.message);
        return 0;
    }
}

async function checkStreetLighting(lat: number, lng: number): Promise<boolean> {
    try {
        const query = `[out:json][timeout:5];way(around:100,${lat},${lng})["highway"];out tags;`;
        const url = `https://lz4.overpass-api.de/api/overpass?data=${encodeURIComponent(query)}`;
        
        const response = await axios.get(url, { 
            timeout: 5000, 
            proxy: false,
            headers: { 'User-Agent': 'FearFreeNavigator/1.0' } 
        });
        
        const hasLighting = response.data.elements?.some((el: any) => 
            el.tags && (el.tags.lit === 'yes' || el.tags.lighting || el.tags.highway === 'primary' || el.tags.highway === 'secondary')
        );
        
        return hasLighting || false;
    } catch (e: any) {
        const density = getSocialDensityScore(lat, lng);
        return density > 30; 
    }
}

function getLocalBoost(lat: number, lng: number): number {
    let boost = 0;
    const currentPoint = turf.point([lng, lat]);

    for (const node of safeNodes) {
        const nodePoint = turf.point([node.lng, node.lat]);
        const distance = turf.distance(currentPoint, nodePoint, { units: 'meters' });
        if (distance < 100) { 
            boost = Math.max(boost, node.boost);
        }
    }
    return boost;
}

function getSocialDensityScore(lat: number, lng: number): number {
    let maxScore = 10; 
    for (const sector of densityGrid.sectors) {
        const distance = turf.distance(
            turf.point([lng, lat]), 
            turf.point([sector.lng, sector.lat]), 
            { units: 'meters' }
        );
        if (distance < sector.radius) {
            maxScore = Math.max(maxScore, sector.densityScore);
        }
    }
    return maxScore; 
}

export async function calculateRouteSafetyScore(coordinates: Coordinate[]): Promise<{ score: number, metrics: any }> {
    const sampledPoints = sampleRoutePoints(coordinates, 1.2); 
    
    let totalSafePlaces = 0;
    let litCheckpoints = 0;
    let localBoostTotal = 0;
    let totalDensityPoints = 0;

    console.log(`🧠 Analyzing ${sampledPoints.length} checkpoints...`);

    for (const point of sampledPoints) {
        const places = await countSafePlacesNearby(point.lat, point.lng);
        totalSafePlaces += places;

        const isLit = await checkStreetLighting(point.lat, point.lng);
        if (isLit) litCheckpoints++;

        const boost = getLocalBoost(point.lat, point.lng);
        localBoostTotal += boost;

        const density = getSocialDensityScore(point.lat, point.lng);
        totalDensityPoints += density;
    }

    const avgDensity = totalDensityPoints / sampledPoints.length;
    
    const lightingScore = (litCheckpoints / sampledPoints.length) * 20;
    const placesScore = Math.min(totalSafePlaces * 5, 30); 
    const transitScore = Math.min(localBoostTotal / sampledPoints.length, 20);
    const densityScore = (avgDensity / 50) * 30;

    const finalScore = Math.round(lightingScore + placesScore + transitScore + densityScore);

    return {
        score: Math.max(10, Math.min(finalScore, 98)),
        metrics: {
            safePlacesCount: totalSafePlaces,
            litRoadsPercentage: Math.round((litCheckpoints / sampledPoints.length) * 100)
        }
    };
}