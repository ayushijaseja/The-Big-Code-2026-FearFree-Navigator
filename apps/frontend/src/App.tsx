import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import MapEngine from './components/map/MapEngine';
import Sidebar from './components/sidebar/Sidebar';
import SOSController from './components/SOS/SOSController';
import { SafetyAssistant } from './components/chat/SafetyAssisstant';

const queryClient = new QueryClient();

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Home() {
    return (
      <div className="relative h-screen w-screen bg-[#121212]">
        <Sidebar />
        <MapEngine />
        <SOSController />
        <SafetyAssistant />
      </div>
    );
  },
});

const routeTree = rootRoute.addChildren([indexRoute]);
const router = createRouter({ routeTree });

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}