import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';
import { useMapStore } from '../../store/useMapStore';

interface SOSProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function SOSOverlay({ isOpen, onConfirm }: SOSProps) {
  const timer = useCountdown({
    initialSeconds: 5,
    isActive: isOpen,
    onComplete: onConfirm,
  });

  const setIsSosActive = useMapStore((state) => state.setSosOverlayOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-red-600 p-8 text-white">
      <div className="animate-pulse">
        <AlertTriangle size={100} strokeWidth={2.5} className="text-white drop-shadow-2xl" />
      </div>

      <h1 className="mt-8 text-center text-5xl font-black uppercase tracking-tighter drop-shadow-lg">
        Danger Detected
      </h1>

      <div className="mt-12 flex h-40 w-40 items-center justify-center rounded-full border-10 border-white/20 bg-white/10 text-7xl font-black shadow-[0_0_50px_rgba(255,255,255,0.3)]">
        {timer}
      </div>

      <p className="mt-12 text-center text-lg font-bold text-red-100 max-w-sm uppercase tracking-widest opacity-90">
        Emergency contacts will be notified in {timer} seconds.
      </p>

      <button
        onClick={() => setIsSosActive(false)}
        className="mt-12 flex items-center gap-4 rounded-2xl bg-white px-10 py-5 text-2xl font-black text-red-600 shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all active:scale-95"
      >
        <ShieldCheck size={32} /> I AM SAFE
      </button>
    </div>
  );
}