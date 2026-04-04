import { PhoneCall } from 'lucide-react';
import { ActiveEscortCall } from './ActiveEscortCall';
import { useMapStore } from '../../store/useMapStore';

export const ActiveEscortWidget = () => {
  const isOpen = useMapStore((state) => state.isActiveEscortOpen);
  const openEscort = useMapStore((state) => state.openActiveEscort);
  const closeEscort = useMapStore((state) => state.closeActiveEscort);

  return (
    <>
      {!isOpen && (
        <button
          onClick={openEscort}
          className="fixed top-24 right-4 z-100 flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-3 text-white shadow-xl backdrop-blur-md border border-slate-700 hover:bg-slate-800 transition-all hover:scale-105 animate-in fade-in zoom-in duration-300"
        >
          <PhoneCall size={18} className="text-green-400" />
          <span className="text-sm font-bold tracking-wide">Active Escort</span>
        </button>
      )}

      {isOpen && (
        <ActiveEscortCall onClose={closeEscort} />
      )}
    </>
  );
};