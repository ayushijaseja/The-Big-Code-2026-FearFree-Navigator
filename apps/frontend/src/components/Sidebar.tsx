import { useSafeRoutes } from '../hooks/useSafeRoutes';
import { useMapStore } from '../store/useMapStore';

export default function Sidebar() {
  const { mutate: fetchRoutes, isPending } = useSafeRoutes();
  const routeData = useMapStore((state) => state.routeData);

  const handleSearch = () => {
    fetchRoutes({ origin: "IIIT Allahabad", destination: "Prayagraj Junction" });
  };

  return (
    <div style={{
      position: 'absolute', top: '20px', left: '20px', zIndex: 10,
      backgroundColor: 'rgba(20, 20, 20, 0.9)', padding: '20px', borderRadius: '12px',
      color: 'white', fontFamily: 'sans-serif', border: '1px solid #333',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)', width: '320px'
    }}>
      <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Fear-Free Navigator</h1>
      <p style={{ margin: '0 0 20px 0', color: '#aaa', fontSize: '14px' }}>AI-Powered Safe Routing</p>
      
      <button 
        onClick={handleSearch} 
        disabled={isPending}
        style={{ 
          width: '100%', padding: '12px', backgroundColor: isPending ? '#555' : '#4CAF50', 
          color: 'white', border: 'none', borderRadius: '6px', cursor: isPending ? 'not-allowed' : 'pointer',
          fontWeight: 'bold', fontSize: '16px'
        }}
      >
        {isPending ? "Analyzing Routes..." : "Find Safe Path"}
      </button>

      {routeData && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '16px', borderBottom: '1px solid #444', paddingBottom: '8px' }}>Analysis Results</h3>
          {routeData.routes.map((route, index) => (
            <div key={route.routeId} style={{ 
                marginTop: '10px', padding: '10px', 
                backgroundColor: index === 0 ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                borderLeft: index === 0 ? '4px solid #4CAF50' : '4px solid #555',
                borderRadius: '4px'
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{index === 0 ? "🌟 Safest Route" : "Alternative"}</strong>
                  <span style={{ color: index === 0 ? '#4CAF50' : '#aaa', fontWeight: 'bold' }}>Score: {route.safetyScore}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                  {route.distance} • {route.duration}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}