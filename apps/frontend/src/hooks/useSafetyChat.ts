import { useState, useRef, useEffect, useCallback } from 'react';
import { useMapStore } from '../store/useMapStore';
// import { calculateDistance } from '../utils/geoMath';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export const useSafetyChat = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: "Hi, I'm FearFree AI. Ask me about your route, recent safety alerts, or what to do next." }
  ]);
  const aiBriefing = useMapStore((state) => state.emergencyData?.aiBriefing);

  const userLocation = useMapStore((state) => state.userLocation);
  const destination = useMapStore((state) => state.emergencyData?.safeHavenName);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/v1/routes/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          currentLocation: userLocation || { lat: 25.4294, lng: 81.7702 }, 
          destination: destination || "Unknown",
          // routeDistance: calculateDistance(userLocation?.lat, userLocation?.lng, destination)
          aiBriefing: aiBriefing,
        }),
      });

      const data = await response.json();
      
      setMessages((prev) => [...prev, { 
        role: 'ai', 
        text: data.reply || "Sorry, I couldn't process that." 
      }]);
    } catch (error) {
      console.error("Chat fetch error:", error);
      setMessages((prev) => [...prev, { 
        role: 'ai', 
        text: "🚨 Network error connecting to safety servers. Please rely on standard SOS protocols." 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userLocation, destination, aiBriefing]);

  return {
    input,
    setInput,
    isLoading,
    messages,
    handleSend,
    messagesEndRef
  };
};