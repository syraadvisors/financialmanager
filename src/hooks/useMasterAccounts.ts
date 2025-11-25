import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterAccountsService } from '../services/api/masterAccounts.service';
import { MasterAccount } from '../types/MasterAccount';
import { useFirm } from '../contexts/FirmContext';

/**
 * React Query hook for fetching all master accounts
 */
export function useMasterAccounts() {
  const { firmId } = useFirm();

  return useQuery({
    queryKey: ['masterAccounts', firmId],
    queryFn: async () => {
      const response = await masterAccountsService.getAll(firmId!);
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
 * React Query hook for creating a master account
 * Includes optimistic updates for instant UI feedback
 */
export function useCreateMasterAccount() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async (data: Partial<MasterAccount>) => {
      const response = await masterAccountsService.create(data, firmId!);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: async (newMasterAccount) => {
      await queryClient.cancelQueries({ queryKey: ['masterAccounts', firmId] });
      const previousMasterAccounts = queryClient.getQueryData<MasterAccount[]>(['masterAccounts', firmId]);
      
      const optimisticMasterAccount: MasterAccount = {
        id: `temp-${Date.now()}`,
        ...newMasterAccount,
      } as MasterAccount;

      queryClient.setQueryData<MasterAccount[]>(['masterAccounts', firmId], (old = []) => [
        ...old,
        optimisticMasterAccount,
      ]);

      return { previousMasterAccounts };
    },
    onError: (err, newMasterAccount, context) => {
      if (context?.previousMasterAccounts) {
        queryClient.setQueryData(['masterAccounts', firmId], context.previousMasterAccounts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['masterAccounts', firmId] });
    },
  });
}

/**
 * React Query hook for updating a master account
 * Includes optimistic updates for instant UI feedback
 */
export function useUpdateMasterAccount() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MasterAccount> }) => {
      const response = await masterAccountsService.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['masterAccounts', firmId] });
      const previousMasterAccounts = queryClient.getQueryData<MasterAccount[]>(['masterAccounts', firmId]);

      queryClient.setQueryData<MasterAccount[]>(['masterAccounts', firmId], (old = []) =>
        old.map((masterAccount) => (masterAccount.id === id ? { ...masterAccount, ...data } : masterAccount))
      );

      return { previousMasterAccounts };
    },
    onError: (err, variables, context) => {
      if (context?.previousMasterAccounts) {
        queryClient.setQueryData(['masterAccounts', firmId], context.previousMasterAccounts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['masterAccounts', firmId] });
    },
  });
}

/**
 * React Query hook for deleting a master account
 * Includes optimistic updates for instant UI feedback
 */
export function useDeleteMasterAccount() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async (masterAccountId: string) => {
      const response = await masterAccountsService.delete(masterAccountId);
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onMutate: async (masterAccountId) => {
      await queryClient.cancelQueries({ queryKey: ['masterAccounts', firmId] });
      const previousMasterAccounts = queryClient.getQueryData<MasterAccount[]>(['masterAccounts', firmId]);

      queryClient.setQueryData<MasterAccount[]>(['masterAccounts', firmId], (old = []) =>
        old.filter((masterAccount) => masterAccount.id !== masterAccountId)
      );

      return { previousMasterAccounts };
    },
    onError: (err, masterAccountId, context) => {
      if (context?.previousMasterAccounts) {
        queryClient.setQueryData(['masterAccounts', firmId], context.previousMasterAccounts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['masterAccounts', firmId] });
    },
  });
}

