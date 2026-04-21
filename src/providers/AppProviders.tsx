/**
 * React Query Setup Example
 * Add this to your App.tsx or main.tsx if TanStack Query is not already configured
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: true, // Refetch when window regains focus
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Usage in main.tsx:
 * 
 * import { AppProviders } from './providers/AppProviders';
 * 
 * createRoot(document.getElementById('root')!).render(
 *   <AppProviders>
 *     <App />
 *   </AppProviders>
 * );
 */