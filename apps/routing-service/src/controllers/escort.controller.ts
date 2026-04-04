import { Request, Response } from 'express';
import * as turf from '@turf/turf';
import axios from 'axios';
import safeNodes from '../data/safe-nodes.json';
import { processEscortCall } from '../services/escort.service';
import { routeContextService } from '../services/context.service';
import { broadcastSOS } from '../services/notification.service';

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

            const userPoint = turf.point([lng, lat]);
            let nearest = safeNodes[0];
            let minDistance = Infinity;

            safeNodes.forEach(node => {
                const nodePoint = turf.point([node.lng, node.lat]);
                const distance = turf.distance(userPoint, nodePoint, { units: 'meters' });
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = node;
                }
            });

            const directions = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
                params: {
                    origin: `${lat},${lng}`,
                    destination: `${nearest.lat},${nearest.lng}`,
                    mode: 'walking',
                    key: process.env.GOOGLE_CLOUD_API_KEY 
                }
            });

            const currentRoute = directions.data.routes[0];
            const currentLeg = currentRoute.legs[0];

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
                    safeHaven: nearest,
                    polyline: currentRoute.overview_polyline.points,
                    distance: currentLeg.distance.text,
                    duration: currentLeg.duration.text
                }
            });
        }

        res.json(callResponse);

    } catch (error: any) {
        console.error("Escort Controller Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}