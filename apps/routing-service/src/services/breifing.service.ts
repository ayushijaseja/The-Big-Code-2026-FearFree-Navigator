import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface RouteMetrics {
    safePlacesCount: number;
    litRoadsPercentage: number;
    distance: string;
    duration: string;
    destinationName: string;
}

export const generateRouteBriefing = async (metrics: RouteMetrics) => {
    try {
        const model = ai.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" },
            systemInstruction: `You are an expert tactical safety analyst. Analyze the route metrics and return a JSON object evaluating the route's safety. 
            Keep the summary concise and actionable.
            
            JSON Schema:
            {
              "safetySummary": "A 2-sentence overview of why this route was chosen and its overall feel.",
              "primaryRisk": "The biggest potential issue (e.g., 'Low lighting for 20% of the route').",
              "tacticalAdvice": "One specific piece of advice for the user walking this route right now."
            }`
        });

        const prompt = `
            Analyze this chosen escape route to ${metrics.destinationName}:
            - Distance: ${metrics.distance} (${metrics.duration} walking)
            - Verified Safe Havens nearby: ${metrics.safePlacesCount}
            - Well-lit street percentage: ${metrics.litRoadsPercentage}%
            - Time of day: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
        `;

        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
        
    } catch (error) {
        console.error("Briefing Generation Error:", error);
        return {
            safetySummary: "This route was mathematically calculated to have the highest density of safe zones.",
            primaryRisk: "Standard nighttime pedestrian risks apply.",
            tacticalAdvice: "Proceed swiftly to the destination and keep your phone accessible."
        };
    }
};