import { Request, Response } from 'express';
import axios from 'axios';
import polyline from '@mapbox/polyline'; 
import { sql } from 'drizzle-orm';
import { db } from '../db'; 
import { processEscortCall } from '../services/escort.service';
import { routeContextService } from '../services/context.service';
import { broadcastSOS } from '../services/notification.service';
import 'dotenv/config';

export default async function handle_escort_call(req: Request, res: Response) {
    try {
        const { text, location, history, sessionId } = req.body;
        const { lat, lng } = location || {};

        if (!text) {
            return res.status(400).json({ error: "User audio text is required" });
        }

        let routeMemory = null;
        if (sessionId) {
            routeMemory = routeContextService.getRouteContext(sessionId);
        }

        const callResponse = await processEscortCall({
            userAudioText: text,
            currentLocation: location, 
            chatHistory: history || [], 
            routeMemory: routeMemory   
        });

        if (callResponse.isSOS && lat && lng) {
            console.log("🚨 VOICE AI DETECTED EMERGENCY - TRIGGERING FULL SOS PROTOCOL");

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

            console.log(`🏥 AI Routing to Safe Haven: ${nearest.name} (${Math.round(nearest.distance_meters)}m away)`);

            const directions = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
                params: {
                    origin: `${lat},${lng}`,
                    destination: `${nearest.lat},${nearest.lng}`,
                    mode: 'walking',
                    key: process.env.GOOGLE_CLOUD_API_KEY 
                }
            });

            if (directions.data.status !== 'OK') {
                console.error("🚨 GOOGLE MAPS API REJECTED REQUEST:", directions.data.status);
                return res.json({ ...callResponse, routeError: "Failed to generate escape route." });
            }

            const currentRoute = directions.data.routes[0];
            const currentLeg = currentRoute.legs[0];

            const decodedPath = polyline.decode(currentRoute.overview_polyline.points);
            const coordinates = decodedPath.map((p: number[]) => ({ lat: p[0], lng: p[1] }));

            const nextInstruction = currentLeg.steps && currentLeg.steps.length > 0 
                ? currentLeg.steps[0].html_instructions 
                : "Proceed to the destination immediately.";

            broadcastSOS({
                lat,
                lng,
                safeHavenName: nearest.name,
                distanceToSafety: currentLeg.distance.text,
                sensorMagnitude: 0, 
                timeOfIncident: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
            }).catch(e => console.error("Escort SOS Broadcast failed:", e));

            return res.json({
                ...callResponse, 
                emergencyData: {
                    message: "🚨 AI DETECTED DISTRESS - REROUTING",
                    safeHaven: {
                        name: nearest.name,
                        type: nearest.type,
                        lat: nearest.lat,
                        lng: nearest.lng
                    },
                    safeHavenName: nearest.name, 
                    polyline: currentRoute.overview_polyline.points,
                    coordinates: coordinates,
                    distance: currentLeg.distance.text,
                    duration: currentLeg.duration.text,
                    instructions: nextInstruction,
                    currentInstruction: nextInstruction 
                }
            });
        }

        res.json(callResponse);

    } catch (error: any) {
        console.error("Escort Controller Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}