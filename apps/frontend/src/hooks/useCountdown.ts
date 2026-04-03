import { useState, useEffect } from 'react';

interface UseCountdownProps {
  initialSeconds: number;
  isActive: boolean;
  onComplete: () => void;
}

export const useCountdown = ({ initialSeconds, isActive, onComplete }: UseCountdownProps) => {
  const [timer, setTimer] = useState(initialSeconds);

  useEffect(() => {
    if (isActive) {
      setTimer(initialSeconds);
    }
  }, [isActive, initialSeconds]);

  useEffect(() => {
    if (!isActive) return;

    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      onComplete();
    }
  }, [isActive, timer, onComplete]);

  return timer;
};