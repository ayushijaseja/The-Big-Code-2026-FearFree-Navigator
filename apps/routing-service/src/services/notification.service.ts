import twilio from 'twilio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface EmergencyContext {
    lat: number;
    lng: number;
    safeHavenName: string;
    distanceToSafety: string;
    sensorMagnitude?: number; 
    timeOfIncident?: string;
}

const generateSmartMessage = async (context: EmergencyContext, mapLink: string) => {
    const fallbackMsg = `🚨 URGENT SOS 🚨\nAyushi has triggered an emergency alert. Live Location: ${mapLink}`;

    if (!process.env.GEMINI_API_KEY) return fallbackMsg;

    try {
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `
            You are an emergency AI dispatcher. Write a concise, urgent WhatsApp SOS message (max 3 sentences).
            
            Context:
            - User: Ayushi
            - Time: ${context.timeOfIncident || new Date().toLocaleTimeString()}
            - Situation: Triggered via high-impact phone sensor (Magnitude: ${context.sensorMagnitude || 'Unknown'}).
            - Action: She is currently fleeing on foot to the ${context.safeHavenName}, which is ${context.distanceToSafety} away.
            - Tracking Link: ${mapLink}
            
            Format: Use emojis. Be highly urgent but professional. Include the tracking link at the end.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("AI Generation Failed, using fallback:", error);
        return fallbackMsg;
    }
};

export const broadcastSOS = async (context: EmergencyContext) => {
    const mapLink = `https://maps.google.com/?q=${context.lat},${context.lng}`;
    
    const smartMessage = await generateSmartMessage(context, mapLink);

    console.log("====================================");
    console.log("🤖 AI GENERATED DISPATCH MESSAGE:");
    console.log(smartMessage);
    console.log("====================================");

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const toPhone = process.env.EMERGENCY_CONTACT_NUMBER; 
    const fromSmsPhone = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && toPhone) {
        const client = twilio(accountSid, authToken);

        try {
            await client.messages.create({
                body: smartMessage,
                from: 'whatsapp:+14155238886', 
                to: `whatsapp:${toPhone}`
            });
            console.log("✅ WhatsApp Successfully Dispatched via Twilio.");
        } catch (error: any) {
            console.error("❌ Twilio WhatsApp Error:", error.message);
        }

        if (fromSmsPhone) {
            try {
                await client.messages.create({
                    body: smartMessage,
                    from: fromSmsPhone, 
                    to: toPhone        
                });
                console.log("✅ SMS Successfully Dispatched via Twilio.");
            } catch (error: any) {
                console.error("❌ Twilio SMS Error:", error.message);
            }
        } else {
            console.warn("⚠️ TWILIO_PHONE_NUMBER is missing in .env! Could not send standard SMS.");
        }

    } else {
        console.warn("⚠️ KEYS MISSING: Running in Mock Mode.");
    }
};