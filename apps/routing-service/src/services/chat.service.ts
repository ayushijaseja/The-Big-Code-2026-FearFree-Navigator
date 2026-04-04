import { GoogleGenerativeAI } from '@google/generative-ai';
import { routeContextService } from './context.service';
import 'dotenv/config';

// ✅ Import the tools needed for the SOS Protocol
import * as turf from '@turf/turf';
import axios from 'axios';
import safeNodes from '../data/safe-nodes.json';
import { broadcastSOS } from './notification.service'; // Adjust path if your notification service is elsewhere

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ChatContext {
    userMessage: string;
    currentLocation?: { lat: number, lng: number };
    destination?: string;
    routeDistance?: string;
    aiBriefing?: any;
    sessionId: string; 
}

export const processUserChat = async (context: ChatContext) => {
    try {
        // ==========================================
        // AGENT 1: THE SECURITY BOUNCER (Fast SOS Check)
        // ==========================================
        const sosAgent = ai.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [{
                functionDeclarations: [{
                    name: "trigger_sos",
                    description: "Immediately activates the emergency SOS protocol. Use ONLY if the user explicitly says they are in danger, being followed, or asks for help/SOS.",
                }]
            }],
            systemInstruction: "You are a highly restricted emergency detection router. Analyze the user's message. If they are in danger, call the 'trigger_sos' tool. If they are safe, just asking a question, or chatting, reply with the exact word 'SAFE'."
        });

        const sosResult = await sosAgent.generateContent(context.userMessage);
        const functionCalls = sosResult.response.functionCalls();
        
        if (functionCalls && functionCalls.length > 0 && functionCalls[0].name === "trigger_sos") {
            console.log("🚨 AGENT 1 (SECURITY): SOS TRIGGERED!");

            let emergencyData = null;

            if (context.currentLocation?.lat && context.currentLocation?.lng) {
                const { lat, lng } = context.currentLocation;
        
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
                const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_CLOUD_API_KEY; 
                
                const directions = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
                    params: {
                        origin: `${lat},${lng}`,
                        destination: `${nearest.lat},${nearest.lng}`,
                        mode: 'walking',
                        key: mapsKey
                    },
                    proxy: false
                });

                if (directions.data.routes && directions.data.routes.length > 0) {
                    const currentRoute = directions.data.routes[0];
                    const currentLeg = currentRoute.legs[0];
                    
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
                    }).catch(e => console.error("Chat Broadcast failed:", e));

                    emergencyData = {
                        message: "🚨 AI DETECTED DISTRESS - REROUTING",
                        safeHavenName: nearest.name,
                        safeHaven: nearest,
                        polyline: currentRoute.overview_polyline.points,
                        distance: currentLeg.distance.text,
                        duration: currentLeg.duration.text,
                        instructions: nextInstruction,
                        currentInstruction: nextInstruction 
                    };
                } else {
                    console.error("🚨 Maps API could not find a walking route to the safe haven.");
                }
            }
            return { 
                reply: "🚨 Activating emergency protocol. Rerouting to the nearest safe haven now. Stay calm, help is on the way.", 
                action: "TRIGGER_SOS",
                emergencyData 
            };
        }

        console.log("✅ AGENT 1: User is safe. Passing to Agent 2 (Search)...");

        const routeMemory = routeContextService.getRouteContext(context.sessionId);
        let routeMemoryText = "No active route memory found.";
        if (routeMemory) {
            routeMemoryText = `
            Destination: ${routeMemory.destination}
            Top Route Selected by System: ${routeMemory.topRouteSelected}
            
            Detailed Route Comparisons:
            ${routeMemory.routes.map((r: any) => `
            - [${r.routeId}] Safety Score: ${r.safetyScore}/100 | Time: ${r.duration} | Safe Havens: ${r.safePlacesCount} | Lit Roads: ${r.litRoadsPercentage}%
            `).join('')}
            `;
        }

        const searchAgent = ai.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [{ googleSearch: {} }] as any, 
            systemInstruction: `You are 'FearFree AI', a highly intelligent safety assistant.
            Keep answers under 3 sentences. Be concise and helpful. Do not mention you are an AI.
    
            User Context:
            - Location: ${context.currentLocation?.lat}, ${context.currentLocation?.lng}
            
            Current Route Tactical Briefing:
            - Summary: ${context.aiBriefing?.safetySummary || 'Standard optimal route.'}
            
            Hidden System Memory (Live Route Analytics):
            ${routeMemoryText}
            
            INSTRUCTIONS:
            1. If the user asks WHY a specific route was chosen, use the memory to explain.
            2. ALWAYS use your Google Search tool to find recent news if asked about live incidents, current weather, or safety conditions.`
        });

        const chatResult = await searchAgent.generateContent(context.userMessage);

        const searchChunks = chatResult.response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (searchChunks && searchChunks.length > 0) {
            console.log("🔍 AGENT 2 (GUIDE): Successfully used Live Google Search!");
        }

        return {
            reply: chatResult.response.text(),
            action: "NONE"
        };

    } catch (error) {
        console.error("Chat Service Error:", error);
        return { reply: "I'm having trouble connecting to the live safety servers right now.", action: "NONE" };
    }
};