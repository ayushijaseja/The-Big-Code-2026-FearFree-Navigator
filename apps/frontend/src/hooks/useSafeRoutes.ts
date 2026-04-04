import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import type { RouteResponse } from '@fear-free/shared-types';
import { useMapStore } from '../store/useMapStore';

interface RouteParams {
  origin: string;
  destination: string;
}

export const useSafeRoutes = () => {
  const setRouteData = useMapStore((state) => state.setRouteData);
  const setStandardBriefing = useMapStore((state) => state.setStandardBriefing);
  const setCurrentInstruction = useMapStore((state) => state.setCurrentInstruction); 

  return useMutation({
    mutationFn: async ({ origin, destination }: RouteParams) => {
      const response = await axios.post<RouteResponse>(
        `${import.meta.env.VITE_API_URL}/routes/get-safe-routes`,
        { origin, destination }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setRouteData(data);
      
      if (data.routes && data.routes.length > 0) {
        setCurrentInstruction(data.routes[0].instructions);
      }
      
      setStandardBriefing(null);

      if (data.sessionId) {
        axios.post(`${import.meta.env.VITE_API_URL}/routes/route-briefing`, {
          sessionId: data.sessionId
        })
        .then((res) => {
          setStandardBriefing(res.data);
        })
        .catch((error) => {
          console.error("Failed to load standard AI briefing:", error);
        });
      }
    },
    onError: (error) => {
      console.error("Failed to fetch routes:", error);
    }
  });
};