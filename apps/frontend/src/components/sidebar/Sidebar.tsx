import { useLocationSearch } from '../../hooks/useLocationSearch';
import { useMapStore } from '../../store/useMapStore';
import { LocationInput } from './LocationInput';
import { RouteCard } from './RouteCard';
import { MapPin, Navigation, Search } from 'lucide-react';

export default function Sidebar() {
  const { origin, setOrigin, destination, setDestination, handleSearch, syncCurrentLocation, isPending } = useLocationSearch();
  const routeData = useMapStore((state) => state.routeData);

  return (
    <aside className="absolute top-5 left-5 z-10 w-80 rounded-xl border border-gray-700 bg-black/90 p-5 text-white shadow-lg backdrop-blur-md">
      {/* <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Fear-Free</h1>
        <p className="text-[10px] text-green-500 font-black uppercase tracking-tighter">Active Protection System</p>
      </header> */}

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

      <section className="mt-8 space-y-3">
        {routeData?.routes.map((route, i) => (
          <RouteCard key={route.routeId} route={route} isBest={i === 0} />
        ))}
      </section>
    </aside>
  );
}