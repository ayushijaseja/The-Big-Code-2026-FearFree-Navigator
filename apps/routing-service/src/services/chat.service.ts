import { GoogleGenerativeAI } from '@google/generative-ai';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ChatContext {
    userMessage: string;
    currentLocation?: { lat: number, lng: number };
    destination?: string;
    routeDistance?: string;
}

export const processUserChat = async (context: ChatContext) => {
    try {
        const model = ai.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            
            tools: [{ googleSearch: {} }] as any, 
            
            systemInstruction: `You are 'FearFree AI', a highly intelligent safety assistant.
            Keep answers under 3 sentences. Be concise and helpful. Do not mention you are an AI.
            
            User Context:
            - Location: ${context.currentLocation?.lat}, ${context.currentLocation?.lng}
            - Destination: ${context.destination || 'Unknown'}
            
            If the user asks about recent crimes, accidents, roadblocks, or safety conditions, ALWAYS use your Google Search tool to find the most recent local news for Prayagraj or their specific location. If search yields nothing, state that the route appears clear based on public reports.`
        });

        const result = await model.generateContent(context.userMessage);
        
        // Let's log if it successfully grounded the response with web data!
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