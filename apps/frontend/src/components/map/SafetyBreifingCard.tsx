import { useState } from 'react';
import { ShieldCheck, AlertTriangle, X, Bot } from 'lucide-react';
import { useMapStore } from '../../store/useMapStore';

export const SafetyBriefingCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const isEmergencyMode = useMapStore((state) => state.isEmergencyMode);
  const emergencyBriefing = useMapStore((state) => state.emergencyData?.aiBriefing);
  const standardBriefing = useMapStore((state) => state.standardBriefing);

  const activeBriefing = isEmergencyMode ? emergencyBriefing : standardBriefing;

  if (!activeBriefing) return null;

  return (
    <div className="absolute top-20 right-4 z-100 flex flex-col items-end">
      
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl backdrop-blur-md border transition-transform hover:scale-105 animate-in fade-in zoom-in duration-300 ${
            isEmergencyMode 
              ? 'bg-red-600/90 border-red-500/50 text-white shadow-red-900/50' 
              : 'bg-slate-900/90 border-blue-500/50 text-white shadow-blue-900/30'
          }`}
        >
          <Bot size={18} className={isEmergencyMode ? "text-white" : "text-blue-400"} />
          <span className="text-sm font-bold uppercase tracking-wider">
            AI Route Briefing
          </span>
        </button>
      )}

      {isOpen && (
        <div className={`w-[90vw] sm:w-11/12 max-w-md animate-in slide-in-from-top-4 fade-in duration-300 overflow-hidden rounded-xl shadow-2xl backdrop-blur-md border ${
          isEmergencyMode ? 'bg-slate-900/95 border-red-500/30' : 'bg-slate-900/90 border-blue-500/20'
        }`}>
          
          <div className={`flex items-center justify-between px-4 py-3 border-b ${
            isEmergencyMode ? 'bg-red-600/20 border-red-500/20' : 'bg-blue-600/20 border-blue-500/20'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className={isEmergencyMode ? "text-red-400" : "text-blue-400"} />
              <span className={`text-xs font-bold uppercase tracking-wider ${isEmergencyMode ? "text-red-400" : "text-blue-400"}`}>
                {isEmergencyMode ? "Emergency Tactical Briefing" : "Route Safety Briefing"}
              </span>
            </div>
            
            <button 
              onClick={() => setIsOpen(false)} 
              className="rounded-full p-1 transition-colors hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-sm font-medium leading-relaxed text-white">
              "{activeBriefing.safetySummary}"
            </p>
            
            <div className="flex gap-2 rounded-lg bg-white/5 p-3 border border-white/10">
              <AlertTriangle size={18} className="text-yellow-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-yellow-500 uppercase">Primary Risk Factor</span>
                <span className="text-sm text-slate-200">{activeBriefing.primaryRisk}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};