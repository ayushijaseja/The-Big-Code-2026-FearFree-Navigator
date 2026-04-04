import { useState, useEffect, useRef, useCallback } from 'react';
import { useMapStore } from '../store/useMapStore';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useEscortCall = (onClose: () => void) => {
  const [callState, setCallState] = useState<'incoming' | 'active'>('incoming');
  const [timer, setTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('Waiting for you to speak...');

  const userLocation = useMapStore((state) => state.userLocation);
  const sessionId = useMapStore((state) => state.emergencyData?.sessionId || state.routeData?.sessionId);
  
  const setEmergencyRoute = useMapStore((state) => state.setEmergencyRoute);
  const triggerSOS = useMapStore((state) => state.triggerEmergencyMode); 

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatHistoryRef = useRef<{ role: string, parts: { text: string }[] }[]>([]);
  
  const isProcessingRef = useRef(false); 

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callState === 'active') {
      interval = setInterval(() => setTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const sendToBackend = useCallback(async (spokenText: string) => {
    if (!spokenText.trim() || isProcessingRef.current) return;

    try {
      isProcessingRef.current = true;
      setTranscript("Thinking...");
      try { recognitionRef.current?.abort(); } catch(e) {}

      chatHistoryRef.current.push({ role: 'user', parts: [{ text: spokenText }] });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/routes/escort-call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: spokenText,
          location: userLocation || { lat: 25.4294, lng: 81.7702 },
          sessionId: sessionId,
          history: chatHistoryRef.current
        }),
      });

      const data = await response.json();

      if (data.isSOS) {
        if (data.emergencyData) {
          setEmergencyRoute({
            ...data.emergencyData,
            sessionId: `sos_escort_${Date.now()}`
          });
        } else {
          triggerSOS();
        }
        onClose(); 
        return;
      }

      chatHistoryRef.current.push({ role: 'model', parts: [{ text: data.replyText }] });

      if (data.audioBase64) {
        const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.play();
        }
      } else {
        isProcessingRef.current = false;
        setTranscript("Listening...");
        if (!isMuted) try { recognitionRef.current?.start(); } catch(e) {}
      }
    } catch (error) {
      console.error("Escort Call Error:", error);
      isProcessingRef.current = false;
      setTranscript("Connection error. Try speaking again.");
    }
  }, [userLocation, sessionId, onClose, setEmergencyRoute, triggerSOS, isMuted]);

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          setTranscript(event.results[i][0].transcript);
        }
      }

      if (finalTranscript && !isProcessingRef.current) {
        sendToBackend(finalTranscript);
      }
    };

    recognition.onend = () => {
      if (callState === 'active' && !isMuted && !isProcessingRef.current) {
        try { recognition.start(); } catch (e) {}
      }
    };

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, [callState, isMuted, sendToBackend]);

  const handleAcceptCall = () => {
    setCallState('active');
    if (audioRef.current) {
      audioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      audioRef.current.play().then(() => sendToBackend("Hello?"));
    }
  };

  const handleEndCall = () => {
    isProcessingRef.current = true; 
    recognitionRef.current?.abort();
    if (audioRef.current) audioRef.current.pause();
    onClose();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted) {
      try { recognitionRef.current?.start(); } catch(e) {}
    } else {
      recognitionRef.current?.abort();
    }
  };

  return {
    callState,
    timer,
    isMuted,
    transcript,
    audioRef,
    recognitionRef,
    handleAcceptCall,
    handleEndCall,
    toggleMute,
    setTranscript,
    isProcessingRef
  };
};