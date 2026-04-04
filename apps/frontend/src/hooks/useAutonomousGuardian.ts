import { useEffect, useRef, useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import type { ChatMessage } from './useSafetyChat';
import { calculateDistance } from '../utils/geoMath';

export const useAutonomousGuardian = (
  isChatOpen: boolean,
  setIsOpen: (open: boolean) => void,
  messages: ChatMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) => {
  const userLocation = useMapStore((state) => state.userLocation);
  const routeData = useMapStore((state) => state.routeData);
  const isEmergencyMode = useMapStore((state) => state.isEmergencyMode);
  const setSosOverlayOpen = useMapStore((state) => state.setSosOverlayOpen);
  
  const triggerSOS = useMapStore((state) => state.triggerEmergencyMode);

  const anchorLocation = useRef<{ lat: number; lng: number } | null>(null);
  const stationarySeconds = useRef(0);
  const [isDoomsdayActive, setIsDoomsdayActive] = useState(false);
  const doomsdayCountdown = useRef(20); 

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

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (isDoomsdayActive && lastMessage?.role === 'user') {
      console.log("✅ Guardian: User replied. Canceling SOS.");
      setIsDoomsdayActive(false);
      stationarySeconds.current = 0;
      doomsdayCountdown.current = 20; 
      
      const safeText = "Glad you're okay! I've canceled the SOS. Let me know if you need anything.";
      
      setMessages((prev) => [...prev, { 
        role: 'ai', 
        text: safeText 
      }]);
      
      speakOutLoud(safeText);
    }
  }, [messages, isDoomsdayActive, setMessages]);

  useEffect(() => {
    if (!routeData || !userLocation || isEmergencyMode) {
      console.log("⏸️ Guardian Paused: Missing route, missing GPS, or already in SOS.");
      return;
    }

    const interval = setInterval(() => {
      if (!anchorLocation.current) {
        anchorLocation.current = userLocation;
        return;
      }

      const distance = calculateDistance(
        anchorLocation.current.lat, anchorLocation.current.lng,
        userLocation.lat, userLocation.lng
      );

      console.log(
        `⏱️ Heartbeat | Moved: ${distance.toFixed(1)}m | Stationary For: ${stationarySeconds.current}s | Doomsday Active: ${isDoomsdayActive ? `YES (${doomsdayCountdown.current}s left)` : 'NO'}`
      );

      if (distance > 20) {
        console.log("🚶‍♂️ User moved! Resetting stationary timer.");
        anchorLocation.current = userLocation;
        stationarySeconds.current = 0;
        return;
      }

      stationarySeconds.current += 10;

      if (stationarySeconds.current >= 30 && !isDoomsdayActive) {
        setIsDoomsdayActive(true);
        if (!isChatOpen) setIsOpen(true); 
        
        const warningText = "Hey, I noticed you haven't moved in a while. Is everything alright? If you don't respond, I will automatically trigger the SOS.";
        
        setMessages((prev) => [...prev, { 
          role: 'system', 
          text: "⚠️ SYSTEM: User stationary for 30 seconds. Initializing health check." 
        }, {
          role: 'ai',
          text: warningText
        }]);

        speakOutLoud(warningText);
      }

      if (isDoomsdayActive) {
        doomsdayCountdown.current -= 10;
        if (doomsdayCountdown.current <= 0) {
          console.log("🚨 Guardian: No response from user. TRIGGERING AUTONOMOUS SOS!");
          clearInterval(interval);
          triggerSOS();
          setSosOverlayOpen(true);
        }
      }

    }, 10000); 

    return () => clearInterval(interval);
  }, [userLocation, routeData, isEmergencyMode, isChatOpen, isDoomsdayActive, setIsOpen, setMessages, triggerSOS]);

  return { isDoomsdayActive, doomsdayCountdown: doomsdayCountdown.current };
};