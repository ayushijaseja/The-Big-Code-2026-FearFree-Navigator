import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import MapEngine from './components/MapEngine';
import Sidebar from './components/Sidebar';

const queryClient = new QueryClient();

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function Home() {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#121212' }}>
        <Sidebar />
        <MapEngine />
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