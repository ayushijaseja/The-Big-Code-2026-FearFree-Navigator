import { GoogleGenerativeAI } from '@google/generative-ai';
import { routeContextService } from './context.service';

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
        const routeMemory = routeContextService.getRouteContext(context.sessionId);
        
        let routeMemoryText = "No active route memory found.";
        if (routeMemory) {
            routeMemoryText = `
            Destination: ${routeMemory.destination}
            Top Route Selected by System: ${routeMemory.topRouteSelected}
            
            Detailed Route Comparisons (Use this to explain routing decisions):
            ${routeMemory.routes.map((r: any) => `
            - [${r.routeId}] Safety Score: ${r.safetyScore}/100 | Time: ${r.duration} | Safe Havens: ${r.safePlacesCount} | Lit Roads: ${r.litRoadsPercentage}%
            `).join('')}
            `;
        }

        const model = ai.getGenerativeModel({
            model: "gemini-2.5-flash",
            tools: [{ googleSearch: {} }] as any,

            systemInstruction: `You are 'FearFree AI', a highly intelligent safety assistant.
            Keep answers under 3 sentences. Be concise and helpful. Do not mention you are an AI.
    
            User Context:
            - Location: ${context.currentLocation?.lat}, ${context.currentLocation?.lng}
            
            Current Route Tactical Briefing (From AI Service):
            - Summary: ${context.aiBriefing?.safetySummary || 'Standard optimal route.'}
            - Known Risk Factor: ${context.aiBriefing?.primaryRisk || 'None detected.'}
            - Tactical Advice: ${context.aiBriefing?.tacticalAdvice || 'Proceed with caution.'}
            
            Hidden System Memory (Live Route Analytics):
            ${routeMemoryText}
            
            INSTRUCTIONS:
            1. If the user asks WHY a specific route was chosen or asks about alternatives, use the "Hidden System Memory" to confidently explain the math (e.g., "I chose Route 1 because it has 80% street lighting, whereas the alternative only had 20%").
            2. ALWAYS use your Google Search tool to find recent news if asked about live incidents or safety conditions.
            `
        });

        const result = await model.generateContent(context.userMessage);

        const searchChunks = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (searchChunks && searchChunks.length > 0) {
            console.log("🔍 AI successfully used Live Google Search!");
        }

        return result.response.text();

    } catch (error) {
        console.error("Chat Service Error:", error);
        return "I'm having trouble connecting to the live safety servers right now.";
    }
};