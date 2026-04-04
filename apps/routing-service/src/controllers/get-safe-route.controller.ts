import { Request, Response } from 'express';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import { RouteResponse, SafeRoute } from '@fear-free/shared-types';
import { calculateRouteSafetyScore } from '../services/safety.service'; 
import { routeContextService } from '../services/context.service';
import 'dotenv/config';

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
                key: process.env.GOOGLE_CLOUD_API_KEY
            },
            proxy: false
        });

        if (response.data.status !== 'OK') {
            return res.status(400).json({ error: "Google API failed", details: response.data });
        }

        const routesData = response.data.routes;

        const processedRoutesPromises = routesData.map(async (route: any, index: number) => {
            const decodedPath = polyline.decode(route.overview_polyline.points);
            const coordinates = decodedPath.map((point: number[]) => ({ lat: point[0], lng: point[1] }));

            const safetyData = await calculateRouteSafetyScore(coordinates);

            const currentLeg = route.legs[0];
            const nextInstruction = currentLeg.steps && currentLeg.steps.length > 0 
                ? currentLeg.steps[0].html_instructions 
                : "Proceed to the destination.";

            return {
                routeId: `route_${index + 1}`,
                distance: currentLeg.distance.text, 
                duration: currentLeg.duration.text,
                safetyScore: safetyData.score, 
                polyline: route.overview_polyline.points,
                coordinates: coordinates,
                metrics: {
                    safePlacesCount: safetyData.metrics.safePlacesCount,
                    litRoadsPercentage: safetyData.metrics.litRoadsPercentage
                },
                aiBreafing: " ",
                instructions: nextInstruction,
                _safePlacesList: safetyData.metrics.safePlacesList || [] 
            };
        });

        const processedRoutes = await Promise.all(processedRoutesPromises);
        
        processedRoutes.sort((a, b) => b.safetyScore - a.safetyScore);

        const sessionId = routeContextService.saveRouteContext(origin, destination, processedRoutes);

        const frontendRoutes: SafeRoute[] = processedRoutes.map(route => {
            const { _safePlacesList, ...cleanRoute } = route;
            return cleanRoute as SafeRoute; 
        });

        const payload: RouteResponse = {
            message: "Routes fetched and scored successfully",
            sessionId,
            origin,
            destination,
            totalRoutes: frontendRoutes.length,
            routes: frontendRoutes
        };

        res.json(payload);

    } catch (error: any) {
        console.error("Routing Error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
}