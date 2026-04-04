import { Request, Response } from 'express';
import * as turf from '@turf/turf';
import axios from 'axios';
import safeNodes from '../data/safe-nodes.json';
import { broadcastSOS } from '../services/notification.service';

export default async function handle_sos(req: Request, res: Response) {
    try {
        const { lat, lng } = req.body;

        if (!lat || !lng) return res.status(400).json({ error: "Location missing" });

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
                key: process.env.GOOGLE_MAPS_API_KEY
            },
            proxy: false
        });

        if (!directions.data.routes || directions.data.routes.length === 0) {
            return res.status(404).json({ error: "No escape route found." });
        }

        
        const currentRoute = directions.data.routes[0];
        const currentLeg = currentRoute.legs[0];
        
        const nextInstruction = currentLeg.steps && currentLeg.steps.length > 0 
        ? currentLeg.steps[0].html_instructions 
        : "Proceed to the destination.";
        
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
            safeHaven: nearest,
            polyline: currentRoute.overview_polyline.points,
            distance: currentLeg.distance.text,
            duration: currentLeg.duration.text,
            instructions: nextInstruction
        });

    } catch (error: any) {
        console.error("SOS Route Error:", error.response?.data || error.message);
        res.status(500).json({ error: error.message });
    }
}