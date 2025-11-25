import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { householdsService } from '../services/api/households.service';
import { Household } from '../types/Household';
import { useFirm } from '../contexts/FirmContext';

/**
 * React Query hook for fetching all households
 */
export function useHouseholds() {
  const { firmId } = useFirm();

  return useQuery({
    queryKey: ['households', firmId],
    queryFn: async () => {
      const response = await householdsService.getAll(firmId!);
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
 * React Query hook for creating a household
 * Includes optimistic updates for instant UI feedback
 */
export function useCreateHousehold() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async (data: Partial<Household>) => {
      const dataWithFirmId = { ...data, firmId: firmId || data.firmId };
      const response = await householdsService.create(dataWithFirmId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: async (newHousehold) => {
      await queryClient.cancelQueries({ queryKey: ['households', firmId] });
      const previousHouseholds = queryClient.getQueryData<Household[]>(['households', firmId]);
      
      const optimisticHousehold: Household = {
        id: `temp-${Date.now()}`,
        ...newHousehold,
      } as Household;

      queryClient.setQueryData<Household[]>(['households', firmId], (old = []) => [
        ...old,
        optimisticHousehold,
      ]);

      return { previousHouseholds };
    },
    onError: (err, newHousehold, context) => {
      if (context?.previousHouseholds) {
        queryClient.setQueryData(['households', firmId], context.previousHouseholds);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['households', firmId] });
    },
  });
}

/**
 * React Query hook for updating a household
 * Includes optimistic updates for instant UI feedback
 */
export function useUpdateHousehold() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Household> }) => {
      const response = await householdsService.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['households', firmId] });
      const previousHouseholds = queryClient.getQueryData<Household[]>(['households', firmId]);

      queryClient.setQueryData<Household[]>(['households', firmId], (old = []) =>
        old.map((household) => (household.id === id ? { ...household, ...data } : household))
      );

      return { previousHouseholds };
    },
    onError: (err, variables, context) => {
      if (context?.previousHouseholds) {
        queryClient.setQueryData(['households', firmId], context.previousHouseholds);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['households', firmId] });
    },
  });
}

/**
 * React Query hook for deleting a household
 * Includes optimistic updates for instant UI feedback
 */
export function useDeleteHousehold() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async (householdId: string) => {
      const response = await householdsService.delete(householdId);
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onMutate: async (householdId) => {
      await queryClient.cancelQueries({ queryKey: ['households', firmId] });
      const previousHouseholds = queryClient.getQueryData<Household[]>(['households', firmId]);

      queryClient.setQueryData<Household[]>(['households', firmId], (old = []) =>
        old.filter((household) => household.id !== householdId)
      );

      return { previousHouseholds };
    },
    onError: (err, householdId, context) => {
      if (context?.previousHouseholds) {
        queryClient.setQueryData(['households', firmId], context.previousHouseholds);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['households', firmId] });
    },
  });
}

