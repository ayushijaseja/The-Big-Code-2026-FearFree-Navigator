import { Navigation2 } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

export const NavigationCard = () => {
  const isEmergencyMode = useMapStore((state) => state.isEmergencyMode);
  const emergencyData = useMapStore((state) => state.emergencyData);

  if (!isEmergencyMode || !emergencyData) return null;

  return (
    <div className="absolute top-6 left-1/2 z-100 w-11/12 max-w-md -translate-x-1/2 overflow-hidden rounded-2xl bg-slate-900/95 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md border border-white/10">
      
      <div className="flex items-center justify-between bg-red-600 px-4 py-2 text-white">
        <span className="text-sm font-bold uppercase tracking-wider">
          {emergencyData.safeHavenName}
        </span>
        <span className="text-sm font-bold">
          {emergencyData.distance} • {emergencyData.duration}
        </span>
      </div>

      <div className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Navigation2 size={28} className="text-white" />
        </div>
        
        <div 
          className="text-xl font-medium leading-tight text-white [&>b]:text-red-400"
          dangerouslySetInnerHTML={{ __html: emergencyData.currentInstruction }} 
        />
      </div>
    </div>
  );
};