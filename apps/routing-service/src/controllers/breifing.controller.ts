import { Request, Response } from 'express';
import { routeContextService } from '../services/context.service';
import { generateRouteBriefing } from '../services/breifing.service';

export default async function get_route_briefing(req: Request, res: Response) {
    try {
        const { sessionId, routeId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: "Session ID required to generate briefing" });
        }

        const context = routeContextService.getRouteContext(sessionId);

        if (!context) {
            return res.status(404).json({ error: "Route session expired or not found" });
        }

        const targetRouteId = routeId || context.topRouteSelected;
        const selectedRoute = context.routes.find((r: any) => r.routeId === targetRouteId);

        if (!selectedRoute) {
            return res.status(404).json({ error: "Specific route not found in session" });
        }

        const metricsForAI = {
            distance: selectedRoute.distance,
            duration: selectedRoute.duration,
            safePlacesCount: selectedRoute.safePlacesCount,
            litRoadsPercentage: selectedRoute.litRoadsPercentage,
            destinationName: context.destination
        };

        const briefing = await generateRouteBriefing(metricsForAI);
        res.json(briefing);

    } catch (error: any) {
        console.error("Briefing Controller Error:", error);
        res.status(500).json({ error: "Failed to generate briefing" });
    }
}