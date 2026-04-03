import { Request, Response } from 'express';
import { processUserChat } from '../services/chat.service';

export default async function handle_chat(req: Request, res: Response) {
    try {
        const { message, currentLocation, destination } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const reply = await processUserChat({
            userMessage: message,
            currentLocation,
            destination
        });

        res.json({ reply });

    } catch (error: any) {
        res.status(500).json({ error: "Chat processing failed" });
    }
}