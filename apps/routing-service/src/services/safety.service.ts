import axios from 'axios';
import * as h3 from 'h3-js';
import * as turf from '@turf/turf';
import { sql } from 'drizzle-orm';
import { Coordinate } from '@fear-free/shared-types';
import { db } from '../db'; 
import 'dotenv/config';

function sampleRoutePoints(coordinates: Coordinate[], intervalKm: number = 0.6): Coordinate[] {
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
        const keyword = 'pharmacy|police|hospital|atm|bank|restaurant|cafe';
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=200&keyword=${keyword}&key=${process.env.GOOGLE_CLOUD_API_KEY}`;
        const response = await axios.get(url, { timeout: 4000 });
        return response.data.status === 'OK' ? response.data.results.length : 0;
    } catch { return 0; }
}

async function checkStreetLighting(lat: number, lng: number): Promise<boolean> {
    try {
        const query = `[out:json][timeout:5];way(around:100,${lat},${lng})["highway"];out tags;`;
        const url = `https://lz4.overpass-api.de/api/overpass?data=${encodeURIComponent(query)}`;
        const response = await axios.get(url, { timeout: 4000, headers: { 'User-Agent': 'FearFree/1.0' } });
        return response.data.elements?.some((el: any) => 
            el.tags && (el.tags.lit === 'yes' || el.tags.lighting || el.tags.highway === 'primary')
        ) || false;
    } catch { 
        const density = await getSocialDensityScore(lat, lng);
        return density > 30; 
    }
}

async function getLocalBoost(lat: number, lng: number): Promise<number> {
    const result = await db.execute<{ max_boost: number }>(sql`
        SELECT COALESCE(MAX(boost_value), 0) as max_boost FROM safe_nodes
        WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, 100)
    `);
    return result.rows[0]?.max_boost || 0;
}

async function getSocialDensityScore(lat: number, lng: number): Promise<number> {
    const result = await db.execute<{ max_score: number }>(sql`
        SELECT COALESCE(MAX(density_score), 10) as max_score FROM density_zones
        WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, radius_meters)
    `);
    return result.rows[0]?.max_score || 10;
}

export async function calculateRouteSafetyScore(coordinates: Coordinate[]): Promise<{ score: number, metrics: any }> {
    const sampledPoints = sampleRoutePoints(coordinates, 0.7); 
    const numPoints = sampledPoints.length || 1;

    console.log(`🧠 AI-Hybrid Analysis: ${numPoints} checkpoints...`);

    const checkpointPromises = sampledPoints.map(async (point) => {
        const [places, isLit, boost, density] = await Promise.all([
            countSafePlacesNearby(point.lat, point.lng),
            checkStreetLighting(point.lat, point.lng),
            getLocalBoost(point.lat, point.lng),
            getSocialDensityScore(point.lat, point.lng)
        ]);
        
        return { 
            places, 
            isLit, 
            boost, 
            density, 
            h3Index: h3.latLngToCell(point.lat, point.lng, 8) 
        };
    });

    const results = await Promise.all(checkpointPromises);

    let totalSafePlaces = 0;
    let litCheckpoints = 0;
    let localBoostTotal = 0;
    let totalDensityPoints = 0;
    const h3Set = new Set<string>();

    for (const res of results) {
        totalSafePlaces += res.places;
        if (res.isLit) litCheckpoints++;
        localBoostTotal += res.boost;
        totalDensityPoints += res.density;
        h3Set.add(res.h3Index);
    }

    const avgDensity = totalDensityPoints / numPoints;
    const litPercentage = Math.round((litCheckpoints / numPoints) * 100);

    const hScore = Math.min(Math.round(
        ((litCheckpoints / numPoints) * 30) + 
        (Math.min(totalSafePlaces * 5, 30)) + 
        (Math.min(localBoostTotal / numPoints, 20)) + 
        ((avgDensity / 50) * 30)
    ), 100);

    let gScore = hScore; 
    let aiConfidence = 0.0;
    let aiActive = false;

    try {
        const mlResponse = await axios.post('http://localhost:8000/predict-route-safety', {
            h3_indexes: Array.from(h3Set),
            timestamp_iso: new Date().toISOString()
        }, { timeout: 2500 });

        gScore = Math.min(mlResponse.data.safety_score * 2, 100);
        aiConfidence = mlResponse.data.confidence;
        aiActive = true;
    } catch (e) {
        console.warn("⚠️ ML Service offline - falling back to heuristic math.");
    }


    const finalScore = aiActive 
        ? Math.round((gScore * 0.6) + (hScore * 0.4))
        : hScore;

    return {
        score: Math.max(10, Math.min(finalScore, 98)),
        metrics: {
            safePlacesCount: totalSafePlaces,
            litRoadsPercentage: litPercentage,
            
            ai_confidence: aiConfidence,
            is_ai_verified: aiActive,
            
            socialDensity: Math.round(avgDensity),
            transitBoost: Math.round(localBoostTotal / numPoints),
            hexagonsAnalyzed: h3Set.size,
            
            mode: aiActive ? "HYBRID_SOTA_GNN" : "HEURISTIC_FALLBACK",
            calculationTime: new Date().toLocaleTimeString('en-IN')
        }
    };
}