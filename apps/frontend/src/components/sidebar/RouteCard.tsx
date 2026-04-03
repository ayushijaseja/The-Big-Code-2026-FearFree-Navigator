import type { SafeRoute } from "@fear-free/shared-types";

export const RouteCard = ({ route, isBest }: { route: SafeRoute; isBest: boolean }) => (
  <div className={`rounded-lg border p-3 transition-all ${isBest ? 'border-green-500/50 bg-green-500/5' : 'border-gray-800 bg-gray-900/50'}`}>
    <div className="flex justify-between items-start">
      <div>
        <span className="text-sm font-bold block">{isBest ? "🌟 Optimized Path" : "Alternative"}</span>
        <span className="text-[10px] text-gray-400 font-mono tracking-tighter">ID: {route.routeId}</span>
      </div>
      <div className="text-right">
        <span className={`text-lg font-black ${isBest ? 'text-green-400' : 'text-gray-500'}`}>
          {route.safetyScore}%
        </span>
        <div className="text-[8px] uppercase font-bold text-gray-600">Safety Index</div>
      </div>
    </div>

    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-800 pt-2">
      <div className="flex flex-col">
        <span className="text-[9px] text-gray-500 uppercase font-bold">Eyes on Street</span>
        <span className="text-xs text-white">{route.metrics.safePlacesCount} Active POIs</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] text-gray-500 uppercase font-bold">Lighting</span>
        <span className="text-xs text-white">{route.metrics.litRoadsPercentage}% Infrastructure</span>
      </div>
    </div>

    <div className="mt-2 text-[10px] text-gray-500 flex justify-between font-medium">
      <span>📏 {route.distance}</span>
      <span>⏱️ {route.duration}</span>
    </div>
  </div>
);