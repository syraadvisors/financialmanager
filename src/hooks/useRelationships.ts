import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { relationshipsService } from '../services/api/relationships.service';
import { Relationship } from '../types/Relationship';
import { useFirm } from '../contexts/FirmContext';

/**
 * React Query hook for fetching all relationships
 */
export function useRelationships() {
  const { firmId } = useFirm();

  return useQuery({
    queryKey: ['relationships', firmId],
    queryFn: async () => {
      const response = await relationshipsService.getAll(firmId!);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
    enabled: !!firmId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * React Query hook for creating a relationship
 * Includes optimistic updates for instant UI feedback
 */
export function useCreateRelationship() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async (data: Partial<Relationship>) => {
      const dataWithFirmId = { ...data, firmId: firmId || data.firmId };
      const response = await relationshipsService.create(dataWithFirmId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: async (newRelationship) => {
      await queryClient.cancelQueries({ queryKey: ['relationships', firmId] });
      const previousRelationships = queryClient.getQueryData<Relationship[]>(['relationships', firmId]);
      
      const optimisticRelationship: Relationship = {
        id: `temp-${Date.now()}`,
        ...newRelationship,
      } as Relationship;

      queryClient.setQueryData<Relationship[]>(['relationships', firmId], (old = []) => [
        ...old,
        optimisticRelationship,
      ]);

      return { previousRelationships };
    },
    onError: (err, newRelationship, context) => {
      if (context?.previousRelationships) {
        queryClient.setQueryData(['relationships', firmId], context.previousRelationships);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships', firmId] });
    },
  });
}

/**
 * React Query hook for updating a relationship
 * Includes optimistic updates for instant UI feedback
 */
export function useUpdateRelationship() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Relationship> }) => {
      const response = await relationshipsService.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['relationships', firmId] });
      const previousRelationships = queryClient.getQueryData<Relationship[]>(['relationships', firmId]);

      queryClient.setQueryData<Relationship[]>(['relationships', firmId], (old = []) =>
        old.map((relationship) => (relationship.id === id ? { ...relationship, ...data } : relationship))
      );

      return { previousRelationships };
    },
    onError: (err, variables, context) => {
      if (context?.previousRelationships) {
        queryClient.setQueryData(['relationships', firmId], context.previousRelationships);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships', firmId] });
    },
  });
}

/**
 * React Query hook for deleting a relationship
 * Includes optimistic updates for instant UI feedback
 */
export function useDeleteRelationship() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async (relationshipId: string) => {
      const response = await relationshipsService.delete(relationshipId);
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onMutate: async (relationshipId) => {
      await queryClient.cancelQueries({ queryKey: ['relationships', firmId] });
      const previousRelationships = queryClient.getQueryData<Relationship[]>(['relationships', firmId]);

      queryClient.setQueryData<Relationship[]>(['relationships', firmId], (old = []) =>
        old.filter((relationship) => relationship.id !== relationshipId)
      );

      return { previousRelationships };
    },
    onError: (err, relationshipId, context) => {
      if (context?.previousRelationships) {
        queryClient.setQueryData(['relationships', firmId], context.previousRelationships);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships', firmId] });
    },
  });
}

