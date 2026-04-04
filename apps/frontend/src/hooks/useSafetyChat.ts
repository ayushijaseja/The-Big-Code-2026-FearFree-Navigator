import { useState, useRef, useEffect, useCallback } from 'react';
import polyline from '@mapbox/polyline';
import { useMapStore } from '../store/useMapStore';

export interface ChatMessage {
  role: 'user' | 'ai' | 'system';
  text: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSafetyChat = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', text: "Hi, I'm FearFree AI. Ask me about your route, recent safety alerts, or what to do next." }
  ]);
  
  const aiBriefing = useMapStore((state) => state.emergencyData?.aiBriefing);
  const userLocation = useMapStore((state) => state.userLocation);
  const destination = useMapStore((state) => state.emergencyData?.safeHavenName);
  
  const setEmergencyRoute = useMapStore((state) => state.setEmergencyRoute);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true; 
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setInput(currentTranscript);
    };

    recognition.onerror = () => setIsRecording(false);
    
    recognitionRef.current = recognition;
  }, []);

  const speakOutLoud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      
      const cleanText = text.replace(/[\u{1F600}-\u{1F6FF}]/gu, '').replace(/[*#_]/g, '');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = useCallback(async (forceText?: string, wasVoiceActivated: boolean = false) => {
    const userText = forceText !== undefined ? forceText.trim() : input.trim();
    if (!userText || isLoading) return;

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

      if (wasVoiceActivated && data.reply) {
        speakOutLoud(data.reply);
      }

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
        text: "🚨 Network error connecting to safety servers." 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, userLocation, destination, aiBriefing, setEmergencyRoute]);


  const startRecording = () => {
    setInput('');
    setIsRecording(true);
    try { recognitionRef.current?.start(); } catch(e) {}
  };

  const stopRecording = () => {
    setIsRecording(false);
    try { recognitionRef.current?.stop(); } catch(e) {}
    
    setTimeout(() => {
      setInput((latestInput) => {
        handleSend(latestInput, true);
        return ''; 
      });
    }, 300);
  };

  return {
    input,
    setInput,
    isLoading,
    isRecording,
    messages,
    handleSend,
    startRecording,
    setMessages,
    stopRecording,
    messagesEndRef
  };
};