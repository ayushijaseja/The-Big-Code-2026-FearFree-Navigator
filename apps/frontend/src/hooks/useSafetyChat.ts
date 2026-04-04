import { useState, useRef, useEffect, useCallback } from 'react';
import polyline from '@mapbox/polyline';
import { useMapStore } from '../store/useMapStore';

export interface ChatMessage {
  role: 'user' | 'ai' | 'system';
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
  
  const setEmergencyRoute = useMapStore((state) => state.setEmergencyRoute);
  
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/routes/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          currentLocation: userLocation || { lat: 25.4294, lng: 81.7702 }, 
          destination: destination || "Unknown",
          aiBriefing: aiBriefing,
        }),
      });

      const data = await response.json();
      
      setMessages((prev) => [...prev, { 
        role: 'ai', 
        text: data.reply || "Sorry, I couldn't process that." 
      }]);

      if (data.action === "TRIGGER_SOS" && data.emergencyData) {
        
        const decodedPath = polyline.decode(data.emergencyData.polyline);
        
        const coordinates = decodedPath.map((p: number[]) => ({ lat: p[0], lng: p[1] }));

        setEmergencyRoute({
          ...data.emergencyData,
          coordinates: coordinates,
          sessionId: `sos_chat_${Date.now()}` 
        });
      }

    } catch (error) {
      console.error("Chat fetch error:", error);
      setMessages((prev) => [...prev, { 
        role: 'system', 
        text: "🚨 Network error connecting to safety servers. Please rely on standard SOS protocols." 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userLocation, destination, aiBriefing, setEmergencyRoute]);

  return {
    input,
    setInput,
    isLoading,
    messages,
    handleSend,
    messagesEndRef
  };
};