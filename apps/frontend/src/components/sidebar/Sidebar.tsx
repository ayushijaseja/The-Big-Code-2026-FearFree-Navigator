import { useState } from 'react';
import { useLocationSearch } from '../../hooks/useLocationSearch';
import { useMapStore } from '../../store/useMapStore';
import { LocationInput } from './LocationInput';
import { RouteCard } from './RouteCard';
import { MapPin, Navigation, Search, Menu, X } from 'lucide-react';

export default function Sidebar() {
  // 1. Add state to track if the sidebar is open
  const [isOpen, setIsOpen] = useState(false);
  
  const { origin, setOrigin, destination, setDestination, handleSearch, syncCurrentLocation, isPending } = useLocationSearch();
  const routeData = useMapStore((state) => state.routeData);

  return (
    <>
      {/* 2. The Floating Circular Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-5 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black border border-gray-700 shadow-lg transition-transform hover:scale-105 focus:outline-none"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <X size={20} className="text-white" />
        ) : (
          <Menu size={20} className="text-white" />
        )}
      </button>

      {/* 3. The Sidebar Panel (conditionally rendered below the button) */}
      {isOpen && (
        <aside className="absolute top-20 left-5 z-40 w-80 rounded-xl border border-gray-700 bg-black/90 p-5 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="space-y-4">
            <LocationInput 
              label="Starting Point" 
              value={origin} 
              onChange={setOrigin} 
              icon={<MapPin size={16} className="text-gray-500" />}
              action={<Navigation size={16} className="text-green-500 cursor-pointer" onClick={syncCurrentLocation} />}
            />
            <LocationInput 
              label="Destination" 
              value={destination} 
              onChange={setDestination} 
              icon={<Search size={16} className="text-gray-500" />}
            />
            
            <button 
              onClick={handleSearch} 
              disabled={isPending}
              className="w-full rounded-lg bg-green-600 py-3 text-sm font-bold hover:bg-green-500 disabled:bg-gray-700 transition-all"
            >
              {isPending ? "Analyzing..." : "Find Safe Route"}
            </button>
          </div>

          {/* Added a max-height and overflow so long route lists don't break off the screen */}
          {routeData?.routes && routeData.routes.length > 0 && (
            <section className="mt-8 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {routeData.routes.map((route, i) => (
                <RouteCard key={route.routeId} route={route} isBest={i === 0} />
              ))}
            </section>
          )}
        </aside>
      )}
    </>
  );
}