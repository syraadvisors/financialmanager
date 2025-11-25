# React Query Integration Guide

## Overview

React Query (TanStack Query) has been integrated into the application to provide:
- **Automatic caching** of API responses
- **Background refetching** to keep data fresh
- **Optimistic updates** for better UX
- **Automatic loading and error states**
- **Request deduplication** (multiple components requesting same data = 1 request)

## Setup

React Query is already configured in `src/index.tsx` and `src/lib/queryClient.ts`.

### Configuration

- **Stale Time**: 5 minutes (data is considered fresh for 5 minutes)
- **Cache Time**: 10 minutes (unused data stays in cache for 10 minutes)
- **Retry**: 2 attempts for queries, 1 for mutations
- **DevTools**: Available in development mode (press the React Query icon in bottom corner)

## Available Hooks

### Clients

```typescript
import { useClients, useClient, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useClients';

// Fetch all clients
const { data: clients, isLoading, error } = useClients();

// Fetch single client
const { data: client } = useClient(clientId);

// Create client
const createClient = useCreateClient();
createClient.mutate(clientData, {
  onSuccess: () => {
    // Client created, cache automatically updated
  }
});

// Update client
const updateClient = useUpdateClient();
updateClient.mutate({ id: clientId, data: updatedData });

// Delete client
const deleteClient = useDeleteClient();
deleteClient.mutate(clientId);
```

### Accounts

```typescript
import { useAccounts, useAccountsByClient, useCreateAccount } from '../hooks/useAccounts';

// Fetch all accounts
const { data: accounts } = useAccounts();

// Fetch accounts for a specific client
const { data: clientAccounts } = useAccountsByClient(clientId);
```

## Migration Example

### Before (Old Pattern)

```typescript
const [clients, setClients] = useState<Client[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadClients = async () => {
    setLoading(true);
    const response = await clientsService.getAll();
    if (response.data) {
      setClients(response.data);
    }
    setLoading(false);
  };
  loadClients();
}, []);
```

### After (React Query)

```typescript
const { data: clients = [], isLoading: loading, error } = useClients();
```

**Benefits:**
- ✅ Automatic caching (no redundant API calls)
- ✅ Background refetching
- ✅ Loading and error states handled
- ✅ Automatic cleanup
- ✅ Request deduplication

## Creating New Query Hooks

1. Create a new file in `src/hooks/` (e.g., `useHouseholds.ts`)
2. Follow the pattern from `useClients.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { householdsService } from '../services/api/households.service';
import { useFirm } from '../contexts/FirmContext';

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
```

## Query Keys

Query keys should be hierarchical and include all dependencies:

```typescript
// Good
['clients', firmId]
['client', clientId, firmId]
['accounts', 'client', clientId, firmId]

// Bad (missing dependencies)
['clients']
['client', clientId]
```

## Invalidating Queries

After mutations, invalidate related queries:

```typescript
const queryClient = useQueryClient();

// Invalidate all clients
queryClient.invalidateQueries({ queryKey: ['clients', firmId] });

// Invalidate specific client
queryClient.invalidateQueries({ queryKey: ['client', clientId, firmId] });
```

## Best Practices

1. **Always include firmId in query keys** for multi-tenant data
2. **Use `enabled` option** to prevent queries when dependencies aren't ready
3. **Set appropriate `staleTime`** based on how often data changes
4. **Invalidate queries after mutations** to keep UI in sync
5. **Use optimistic updates** for better UX (see React Query docs)

## DevTools

In development, you can:
- View all queries and their states
- Manually refetch queries
- See cache contents
- Inspect query timings

Press the React Query icon in the bottom-right corner of the browser.

## Next Steps

1. Migrate remaining components to use React Query hooks
2. Add optimistic updates for mutations
3. Configure query prefetching for common navigation paths
4. Add error boundaries for query errors



