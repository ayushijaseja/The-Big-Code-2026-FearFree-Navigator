import textToSpeech from '@google-cloud/text-to-speech';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const ttsClient = new textToSpeech.TextToSpeechClient({
    apiKey: process.env.GOOGLE_CLOUD_API_KEY
});

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface EscortContext {
    userAudioText: string;
    currentLocation?: { lat: number, lng: number };
    chatHistory: { role: string, parts: { text: string }[] }[];
    routeMemory?: any;
}

export const processEscortCall = async (context: EscortContext) => {
    try {
        let locationAwareness = `User's Current GPS: ${context.currentLocation?.lat}, ${context.currentLocation?.lng}.`;
        if (context.routeMemory) {
            locationAwareness += `\nCRITICAL CONTEXT: They are currently walking to ${context.routeMemory.destination}. Mention this destination naturally (e.g., "Are you getting close to ${context.routeMemory.destination}?").`;
        }

        const model = ai.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are a close friend of the user, currently on a phone call with them. 
            They are walking alone and using this call to feel safe. 
            
            RULES:
            1. Act completely natural. Use conversational filler words (like "oh", "yeah", "hmm").
            2. Keep responses very short (1-2 sentences maximum) so the conversation flows fast.
            3. Ask casual questions to keep them talking (e.g., about their day, dinner, or surroundings).
            4. ${locationAwareness}
            
            EMERGENCY OVERRIDE:
            If the user sounds panicked, says they are being followed, asks for help, or says the safe word "Code Red", DO NOT reply normally. Simply output the exact string: "TRIGGER_SOS".`
        });

        const chat = model.startChat({
            history: context.chatHistory,
        });

        const result = await chat.sendMessage(context.userAudioText);
        const aiResponseText = result.response.text().trim();

        if (aiResponseText.includes("TRIGGER_SOS")) {
            return { isSOS: true, audioBase64: null, replyText: "SOS Triggered" };
        }

        const request = {
            input: { text: aiResponseText },
            voice: { languageCode: 'en-US', name: 'en-US-Journey-D' },
            audioConfig: { audioEncoding: 'MP3' as const, speakingRate: 1.1 }, 
        };

        const [response] = await ttsClient.synthesizeSpeech(request);
        const audioBase64 = response.audioContent ? Buffer.from(response.audioContent).toString('base64') : null;

        return {
            isSOS: false,
            replyText: aiResponseText, 
            audioBase64: audioBase64
        };

    } catch (error) {
        console.error("Escort Service Error:", error);
        throw new Error("Failed to process escort audio");
    }
};