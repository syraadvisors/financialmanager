import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * 
 * Provides caching, background refetching, and optimistic updates
 * for all API calls in the application.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // Previously cacheTime
      // Retry failed requests 2 times
      retry: 2,
      // Refetch on window focus (good for multi-tab scenarios)
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});



