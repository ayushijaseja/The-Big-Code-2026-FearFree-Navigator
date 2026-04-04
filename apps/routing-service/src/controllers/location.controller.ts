import { Request, Response } from 'express';
import { locationService } from '../services/location.service';

export async function update_location(req: Request, res: Response) {
    try {
        const { userId, lat, lng } = req.body;

        if (!userId || !lat || !lng) {
            return res.status(400).json({ error: "userId, lat, and lng are required" });
        }

        locationService.updateUserLocation(userId, lat, lng);

        res.json({ message: "Location synced successfully" });

    } catch (error: any) {
        console.error("Update Location Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export async function get_nearby_users(req: Request, res: Response) {
    try {
        const { userId, lat, lng, radius = 2000 } = req.body; 

        if (!userId || !lat || !lng) {
            return res.status(400).json({ error: "userId, lat, and lng are required" });
        }

        locationService.updateUserLocation(userId, lat, lng);

        const nearby = locationService.getNearbyUsers(lat, lng, radius, userId);

        res.json({
            message: "Nearby users fetched successfully",
            totalFound: nearby.length,
            radiusInMeters: radius,
            users: nearby
        });

    } catch (error: any) {
        console.error("Get Nearby Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}