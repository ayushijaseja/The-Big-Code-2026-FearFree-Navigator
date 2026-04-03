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
    },
    onError: (error) => {
      console.error("Failed to fetch routes:", error);
    }
  });
};