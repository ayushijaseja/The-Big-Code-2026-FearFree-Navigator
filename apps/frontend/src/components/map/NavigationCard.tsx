import { useState } from 'react';
import { Navigation2, MapPin, X } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

export const NavigationCard = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  
  const isEmergencyMode = useMapStore((state) => state.isEmergencyMode);
  const emergencyData = useMapStore((state) => state.emergencyData);
  const routeData = useMapStore((state) => state.routeData);
  const currentInstruction = useMapStore((state) => state.currentInstruction);

  if (!isEmergencyMode && (!routeData || !routeData.routes.length)) return null;

  let title = "";
  let distance = "";
  let duration = "";
  let instruction = "";

  if (isEmergencyMode && emergencyData) {
    title = emergencyData.safeHavenName || "Safe Haven";
    distance = emergencyData.distance;
    duration = emergencyData.duration;
    instruction = emergencyData.instructions || emergencyData.currentInstruction;
  } else if (routeData && routeData.routes.length > 0) {
    title = routeData.destination;
    distance = routeData.routes[0].distance;
    duration = routeData.routes[0].duration;
    instruction = currentInstruction || routeData.routes[0].instructions; 
  }

  if (!instruction) return null;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={`absolute sm:top-6 left-1/2 z-100 bottom-24 -translate-x-1/2 h-12 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-md border border-white/20 transition-transform active:scale-95 ${
          isEmergencyMode ? 'bg-red-600/90' : 'bg-blue-600/90'
        }`}
      >
        <Navigation2 size={18} className={isEmergencyMode ? 'text-white' : 'text-white'} />
        <span>Resume Navigation</span>
      </button>
    );
  }

  return (
    <div className="absolute sm:top-6 left-1/2 z-100 w-11/12 bottom-24 h-36 max-w-md -translate-x-1/2 overflow-hidden rounded-2xl bg-slate-900/95 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md border border-white/10">
      
      <div className={`flex items-center justify-between px-4 py-2 text-white ${
        isEmergencyMode ? 'bg-red-600' : 'bg-blue-600'
      }`}>
        <div className="flex items-center gap-1.5 overflow-hidden pr-2">
          <MapPin size={14} className="shrink-0" />
          <span className="text-sm font-bold uppercase tracking-wider truncate">
            {title}
          </span>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-bold">
            {distance} • {duration}
          </span>
          
          <button 
            onClick={() => setIsMinimized(true)}
            className="rounded-full p-1 hover:bg-black/20 transition-colors focus:outline-none"
            aria-label="Minimize navigation"
          >
            <X size={16} className="text-white/90 hover:text-white" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Navigation2 
            size={28} 
            className={isEmergencyMode ? "text-red-400" : "text-blue-400"} 
          />
        </div>
        
        <div 
          className={`text-xl font-medium leading-tight text-white ${
            isEmergencyMode ? '[&>b]:text-red-400' : '[&>b]:text-blue-400'
          }`}
          dangerouslySetInnerHTML={{ __html: instruction }} 
        />
      </div>
    </div>
  );
};