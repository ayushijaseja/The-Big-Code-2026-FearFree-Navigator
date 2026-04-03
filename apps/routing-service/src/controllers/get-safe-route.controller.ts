import { Request, Response } from 'express';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import { RouteResponse, SafeRoute } from '@fear-free/shared-types';
import { calculateRouteSafetyScore } from '../services/safety.service'; 

export default async function get_safe_route(req: Request, res: Response) {
    try {
        const { origin, destination } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({ error: "Origin and destination required" });
        }

        const url = `https://maps.googleapis.com/maps/api/directions/json`;
        const response = await axios.get(url, {
            params: {
                origin,
                destination,
                alternatives: true,
                key: process.env.GOOGLE_MAPS_API_KEY
            },
            proxy: false
        });

        if (response.data.status !== 'OK') {
            return res.status(400).json({ error: "Google API failed", details: response.data });
        }

        const routesData = response.data.routes;

        // --- UPDATED LOGIC HERE ---
        // We map over the routes, but because calculateRouteSafetyScore is async, 
        // we map them into an array of Promises, then await them all.
        const processedRoutesPromises = routesData.map(async (route: any, index: number): Promise<SafeRoute> => {
            const decodedPath = polyline.decode(route.overview_polyline.points);
            const coordinates = decodedPath.map((point: number[]) => ({ lat: point[0], lng: point[1] }));

            // 🧠 Send the coordinates to our Safety Engine!
            const safetyData = await calculateRouteSafetyScore(coordinates);

            return {
                routeId: `route_${index + 1}`,
                distance: route.legs[0].distance.text,
                duration: route.legs[0].duration.text,
                safetyScore: safetyData.score, 
                polyline: route.overview_polyline.points,
                coordinates: coordinates,
                metrics: {
                    safePlacesCount: safetyData.safePlacesCount,
                    litRoadsPercentage: 0 // We'll add OSM data later
                }
            };
        });

        // Wait for all routes to finish calculating their scores
        const processedRoutes = await Promise.all(processedRoutesPromises);
        
        // Sort routes so the highest safety score is always first!
        processedRoutes.sort((a, b) => b.safetyScore - a.safetyScore);

        const payload: RouteResponse = {
            message: "Routes fetched and scored successfully",
            origin,
            destination,
            totalRoutes: processedRoutes.length,
            routes: processedRoutes
        };

        res.json(payload);

    } catch (error: any) {
        console.error("Routing Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}