import { Request, Response } from 'express';
import axios from 'axios';
import { sql } from 'drizzle-orm';
import { db } from '../db'; 
import { broadcastSOS } from '../services/notification.service';
import 'dotenv/config';

export default async function handle_sos(req: Request, res: Response) {
    try {
        const { lat, lng } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({ error: "Location missing" });
        }

        console.log(`🚨 [SOS TRIGGERED] Locating nearest safe haven for: ${lat}, ${lng}`);

        const nearestNodeResult = await db.execute<{ 
            id: number, 
            name: string, 
            type: string,
            lat: number, 
            lng: number, 
            distance_meters: number 
        }>(sql`
            SELECT 
                id,
                name,
                type,
                ST_Y(location::geometry) as lat,
                ST_X(location::geometry) as lng,
                ST_Distance(
                    location::geography, 
                    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
                ) as distance_meters
            FROM safe_nodes
            ORDER BY location <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geometry
            LIMIT 1;
        `);

        const nearest = nearestNodeResult.rows[0];

        if (!nearest) {
            return res.status(404).json({ error: "CRITICAL: No safe havens found in database." });
        }

        console.log(`🏥 Found Safe Haven: ${nearest.name} (${Math.round(nearest.distance_meters)}m away)`);

        const directions = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
            params: {
                origin: `${lat},${lng}`,
                destination: `${nearest.lat},${nearest.lng}`,
                mode: 'walking',
                key: process.env.GOOGLE_CLOUD_API_KEY
            },
            proxy: false
        });

        if (directions.data.status !== 'OK') {
            console.error("🚨 GOOGLE MAPS API REJECTED REQUEST:", directions.data.status, directions.data.error_message);
            return res.status(502).json({ error: "Failed to generate escape route." });
        }

        if (!directions.data.routes || directions.data.routes.length === 0) {
            return res.status(404).json({ error: "No escape route found." });
        }
        
        const currentRoute = directions.data.routes[0];
        const currentLeg = currentRoute.legs[0];
        
        const nextInstruction = currentLeg.steps && currentLeg.steps.length > 0 
            ? currentLeg.steps[0].html_instructions 
            : "Proceed directly to the destination.";
        
        broadcastSOS({
            lat,
            lng,
            safeHavenName: nearest.name,
            distanceToSafety: currentLeg.distance.text,
            sensorMagnitude: req.body.sensorMagnitude || 18.5, 
            timeOfIncident: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })
        }).catch(e => console.error("Broadcast failed:", e));

        res.json({
            message: "🚨 EMERGENCY REROUTE ACTIVE",
            safeHaven: {
                name: nearest.name,
                type: nearest.type,
                lat: nearest.lat,
                lng: nearest.lng
            },
            polyline: currentRoute.overview_polyline.points,
            distance: currentLeg.distance.text,
            duration: currentLeg.duration.text,
            instructions: nextInstruction
        });

    } catch (error: any) {
        console.error("SOS Route Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Internal SOS routing failure." });
    }
}