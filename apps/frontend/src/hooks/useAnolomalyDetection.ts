import { useEffect, useState, useRef, useCallback } from 'react';

const SENSOR_THRESHOLD = 15; 
const SPIKE_WINDOW = 2000;   
const REQUIRED_SPIKES = 2;  

export const useAnomalyDetection = (onTrigger: () => void) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const lastSpikeTime = useRef(0);
  const spikeCount = useRef(0);

  const startMonitoring = useCallback(async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          console.error("❌ Permission denied for Motion Sensors");
          return;
        }
      } catch (e) {
        console.error("❌ Error requesting motion permissions", e);
        return;
      }
    }

    console.log("🚀 Anomaly Detection: ACTIVE");
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    spikeCount.current = 0;
    console.log("🛑 Anomaly Detection: STOPPED");
  }, []);

  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  useEffect(() => {
    if (!isMonitoring) return;

    let logCounter = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      
      if (!acc) {
        if (logCounter % 100 === 0) console.warn("📡 Waiting for sensor data... (Event received but 'acc' is null)");
        logCounter++;
        return;
      }

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      const magnitude = Math.sqrt(x ** 2 + y ** 2 + z ** 2);

      if (logCounter % 20 === 0) {
        console.log(`📊 Raw Magnitude: ${magnitude.toFixed(2)} | X: ${x.toFixed(1)} Y: ${y.toFixed(1)} Z: ${z.toFixed(1)}`);
      }
      logCounter++;

      if (magnitude > SENSOR_THRESHOLD) {
        const now = Date.now();
        
        if (now - lastSpikeTime.current < SPIKE_WINDOW) {
          spikeCount.current++;
        } else {
          spikeCount.current = 1;
        }
        
        lastSpikeTime.current = now;
        
        console.log(`🔥 SPIKE DETECTED! ${spikeCount.current}/${REQUIRED_SPIKES} (Mag: ${magnitude.toFixed(2)})`);

        if (spikeCount.current >= REQUIRED_SPIKES) {
          console.log("🚨 SOS TRIGGER CRITERIA MET!");
          onTrigger();
          spikeCount.current = 0; 
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isMonitoring, onTrigger]);

  return {
    startMonitoring,
    stopMonitoring,
    isMonitoring
  };
};