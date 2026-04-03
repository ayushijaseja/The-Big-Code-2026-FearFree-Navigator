import { Polyline } from '@react-google-maps/api';
import type { RouteResponse } from '@fear-free/shared-types';

interface RoutePathsProps {
  routes: RouteResponse['routes'];
  searchKey: string; 
}

export const RoutePaths = ({ routes, searchKey }: RoutePathsProps) => {
  return (
    <>
      {routes.map((route, index) => (
        <Polyline
          key={`${searchKey}-${route.routeId || index}`} 
          path={route.coordinates}
          options={{
            strokeColor: index === 0 ? '#00FF00' : index === 1 ? '#00FFFF' : '#FFFFFF',
            strokeOpacity: index === 0 ? 1.0 : 0.4,
            strokeWeight: index === 0 ? 6 : 4,
            zIndex: index === 0 ? 10 : 1,
          }}
        />
      ))}
    </>
  );
};