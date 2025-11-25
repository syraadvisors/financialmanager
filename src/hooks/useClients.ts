import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '../services/api/clients.service';
import { Client } from '../types/Client';
import { useFirm } from '../contexts/FirmContext';

/**
 * React Query hook for fetching all clients
 * Provides caching, automatic refetching, and loading states
 */
export function useClients() {
  const { firmId } = useFirm();

  return useQuery({
    queryKey: ['clients', firmId],
    queryFn: async () => {
      const response = await clientsService.getAll();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
    enabled: !!firmId, // Only fetch when firmId is available
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
}

/**
 * React Query hook for fetching a single client by ID
 */
export function useClient(clientId: string | null) {
  const { firmId } = useFirm();

  return useQuery({
    queryKey: ['client', clientId, firmId],
    queryFn: async () => {
      if (!clientId) return null;
      const response = await clientsService.getById(clientId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || null;
    },
    enabled: !!clientId && !!firmId,
  });
}

/**
 * React Query hook for creating a new client
 * Includes optimistic updates for instant UI feedback
 */
export function useCreateClient() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      const response = await clientsService.create(clientData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    // Optimistic update: add client to list immediately
    onMutate: async (newClient) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['clients', firmId] });

      // Snapshot previous value
      const previousClients = queryClient.getQueryData<Client[]>(['clients', firmId]);

      // Optimistically update cache
      const optimisticClient: Client = {
        id: `temp-${Date.now()}`, // Temporary ID
        ...newClient,
      } as Client;

      queryClient.setQueryData<Client[]>(['clients', firmId], (old = []) => [
        ...old,
        optimisticClient,
      ]);

      // Return context with snapshot for rollback
      return { previousClients };
    },
    // On error, rollback to previous state
    onError: (err, newClient, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['clients', firmId], context.previousClients);
      }
    },
    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', firmId] });
    },
  });
}

/**
 * React Query hook for updating a client
 * Includes optimistic updates for instant UI feedback
 */
export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const response = await clientsService.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    // Optimistic update: update client in list immediately
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['clients', firmId] });
      await queryClient.cancelQueries({ queryKey: ['client', id, firmId] });

      // Snapshot previous values
      const previousClients = queryClient.getQueryData<Client[]>(['clients', firmId]);
      const previousClient = queryClient.getQueryData<Client>(['client', id, firmId]);

      // Optimistically update cache
      queryClient.setQueryData<Client[]>(['clients', firmId], (old = []) =>
        old.map((client) => (client.id === id ? { ...client, ...data } : client))
      );

      queryClient.setQueryData<Client>(['client', id, firmId], (old) =>
        old ? { ...old, ...data } : undefined
      );

      // Return context for rollback
      return { previousClients, previousClient };
    },
    // On error, rollback to previous state
    onError: (err, variables, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['clients', firmId], context.previousClients);
      }
      if (context?.previousClient) {
        queryClient.setQueryData(['client', variables.id, firmId], context.previousClient);
      }
    },
    // Always refetch after error or success
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients', firmId] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id, firmId] });
    },
  });
}

/**
 * React Query hook for deleting a client
 * Includes optimistic updates for instant UI feedback
 */
export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const response = await clientsService.delete(clientId);
      if (response.error) {
        throw new Error(response.error);
      }
    },
    // Optimistic update: remove client from list immediately
    onMutate: async (clientId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['clients', firmId] });
      await queryClient.cancelQueries({ queryKey: ['client', clientId, firmId] });

      // Snapshot previous values
      const previousClients = queryClient.getQueryData<Client[]>(['clients', firmId]);
      const previousClient = queryClient.getQueryData<Client>(['client', clientId, firmId]);

      // Optimistically remove from cache
      queryClient.setQueryData<Client[]>(['clients', firmId], (old = []) =>
        old.filter((client) => client.id !== clientId)
      );

      queryClient.removeQueries({ queryKey: ['client', clientId, firmId] });

      // Return context for rollback
      return { previousClients, previousClient };
    },
    // On error, rollback to previous state
    onError: (err, clientId, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(['clients', firmId], context.previousClients);
      }
      if (context?.previousClient) {
        queryClient.setQueryData(['client', clientId, firmId], context.previousClient);
      }
    },
    // Always refetch after error or success
    onSettled: (data, error, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['clients', firmId] });
      queryClient.removeQueries({ queryKey: ['client', clientId, firmId] });
    },
  });
}

