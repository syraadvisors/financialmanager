import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsService } from '../services/api/accounts.service';
import { Account } from '../types/Account';
import { useFirm } from '../contexts/FirmContext';

/**
 * React Query hook for fetching all accounts
 */
export function useAccounts() {
  const { firmId } = useFirm();

  return useQuery({
    queryKey: ['accounts', firmId],
    queryFn: async () => {
      const response = await accountsService.getAll(firmId!);
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
 * React Query hook for fetching accounts by client ID
 */
export function useAccountsByClient(clientId: string | null) {
  const { firmId } = useFirm();

  return useQuery({
    queryKey: ['accounts', 'client', clientId, firmId],
    queryFn: async () => {
      if (!clientId) return [];
      const response = await accountsService.getByClientId(clientId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data || [];
    },
    enabled: !!clientId && !!firmId,
  });
}

/**
 * React Query hook for creating an account
 * Includes optimistic updates for instant UI feedback
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async (accountData: Partial<Account>) => {
      // Ensure firmId is included in account data
      const dataWithFirmId = { ...accountData, firmId: firmId || accountData.firmId };
      const response = await accountsService.create(dataWithFirmId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: async (newAccount) => {
      await queryClient.cancelQueries({ queryKey: ['accounts', firmId] });
      const previousAccounts = queryClient.getQueryData<Account[]>(['accounts', firmId]);
      
      const optimisticAccount: Account = {
        id: `temp-${Date.now()}`,
        ...newAccount,
      } as Account;

      queryClient.setQueryData<Account[]>(['accounts', firmId], (old = []) => [
        ...old,
        optimisticAccount,
      ]);

      return { previousAccounts };
    },
    onError: (err, newAccount, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts', firmId], context.previousAccounts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', firmId] });
    },
  });
}

/**
 * React Query hook for updating an account
 * Includes optimistic updates for instant UI feedback
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Account> }) => {
      const response = await accountsService.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['accounts', firmId] });
      if (data.clientId) {
        await queryClient.cancelQueries({ queryKey: ['accounts', 'client', data.clientId, firmId] });
      }

      const previousAccounts = queryClient.getQueryData<Account[]>(['accounts', firmId]);
      const previousClientAccounts = data.clientId
        ? queryClient.getQueryData<Account[]>(['accounts', 'client', data.clientId, firmId])
        : undefined;

      queryClient.setQueryData<Account[]>(['accounts', firmId], (old = []) =>
        old.map((account) => (account.id === id ? { ...account, ...data } : account))
      );

      if (data.clientId && previousClientAccounts) {
        queryClient.setQueryData<Account[]>(['accounts', 'client', data.clientId, firmId], (old = []) =>
          old.map((account) => (account.id === id ? { ...account, ...data } : account))
        );
      }

      return { previousAccounts, previousClientAccounts };
    },
    onError: (err, variables, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts', firmId], context.previousAccounts);
      }
      if (context?.previousClientAccounts && variables.data.clientId) {
        queryClient.setQueryData(['accounts', 'client', variables.data.clientId, firmId], context.previousClientAccounts);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', firmId] });
      if (variables.data.clientId) {
        queryClient.invalidateQueries({ queryKey: ['accounts', 'client', variables.data.clientId, firmId] });
      }
    },
  });
}

/**
 * React Query hook for deleting an account
 * Includes optimistic updates for instant UI feedback
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { firmId } = useFirm();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const response = await accountsService.delete(accountId);
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onMutate: async (accountId) => {
      await queryClient.cancelQueries({ queryKey: ['accounts', firmId] });
      
      const previousAccounts = queryClient.getQueryData<Account[]>(['accounts', firmId]);
      const accountToDelete = previousAccounts?.find((a) => a.id === accountId);
      
      queryClient.setQueryData<Account[]>(['accounts', firmId], (old = []) =>
        old.filter((account) => account.id !== accountId)
      );

      // Also remove from client-specific queries if applicable
      if (accountToDelete?.clientId) {
        await queryClient.cancelQueries({ queryKey: ['accounts', 'client', accountToDelete.clientId, firmId] });
        const previousClientAccounts = queryClient.getQueryData<Account[]>(['accounts', 'client', accountToDelete.clientId, firmId]);
        queryClient.setQueryData<Account[]>(['accounts', 'client', accountToDelete.clientId, firmId], (old = []) =>
          old.filter((account) => account.id !== accountId)
        );
        return { previousAccounts, previousClientAccounts, clientId: accountToDelete.clientId };
      }

      return { previousAccounts };
    },
    onError: (err, accountId, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts', firmId], context.previousAccounts);
      }
      if (context?.previousClientAccounts && context?.clientId) {
        queryClient.setQueryData(['accounts', 'client', context.clientId, firmId], context.previousClientAccounts);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', firmId] });
    },
  });
}

