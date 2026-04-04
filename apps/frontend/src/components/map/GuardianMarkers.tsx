import { useState, memo, useCallback, useMemo } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';

interface Guardian {
  userId: string;
  lat: number;
  lng: number;
  distance: number;
}

interface GuardianMarkersProps {
  guardians: Guardian[];
}

const GuardianComponent = ({ guardians }: GuardianMarkersProps) => {
  const [activeGuardianId, setActiveGuardianId] = useState<string | null>(null);

  const handleActiveMarker = useCallback((id: string) => {
    if (id === activeGuardianId) return;
    setActiveGuardianId(id);
  }, [activeGuardianId]);

  const guardianIcon = useMemo(() => {
    if (typeof window === 'undefined' || !window.google) return null;

    const svgString = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34D399" /> 
            <stop offset="100%" stop-color="#059669" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#047857" flood-opacity="0.6"/>
          </filter>
        </defs>
        
        <path d="M24 4s13-2 13-2v15c0 11-13 22-13 22S11 28 11 17V2s13 2 13 2z" 
              fill="url(#shieldGrad)" 
              filter="url(#glow)" 
              stroke="#ffffff" 
              stroke-width="2.5"/>
              
        <circle cx="24" cy="18" r="5" fill="#ffffff" opacity="0.95" />
      </svg>
    `);

    return {
      url: `data:image/svg+xml;charset=UTF-8,${svgString}`,
      scaledSize: new window.google.maps.Size(48, 48),
      anchor: new window.google.maps.Point(24, 24),
    };
  }, []);

  if (!guardians || guardians.length === 0) return null;

  return (
    <>
      {guardians.map((guardian) => (
        <Marker
          key={guardian.userId}
          position={{ lat: guardian.lat, lng: guardian.lng }}
          onClick={() => handleActiveMarker(guardian.userId)}
          icon={guardianIcon || undefined}
          zIndex={activeGuardianId === guardian.userId ? 1000 : 500} 
        >
          {activeGuardianId === guardian.userId && (
            <InfoWindow
              position={{ lat: guardian.lat, lng: guardian.lng }}
              onCloseClick={() => setActiveGuardianId(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -24), 
              }}
            >
              <div className="p-3 min-w-37.5 font-sans">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div className="font-bold text-sm text-gray-800 tracking-wide uppercase">
                    Guardian Node
                  </div>
                </div>
                
                <div className="flex items-end justify-between bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                  <span className="text-xs text-emerald-700 font-medium uppercase tracking-wider">Proximity</span>
                  <span className="text-base font-black text-emerald-600">{Math.round(guardian.distance)}m</span>
                </div>
              </div>
            </InfoWindow>
          )}
        </Marker>
      ))}
    </>
  );
};

export const GuardianMarkers = memo(GuardianComponent);