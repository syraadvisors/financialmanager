# Optimistic Updates Guide

## Overview

All React Query mutation hooks now include **optimistic updates** for instant UI feedback. This means the UI updates immediately when users create, update, or delete items, without waiting for the API response.

## How It Works

### The Three-Phase Process

1. **onMutate** (Optimistic Update)
   - Cancels any outgoing queries to prevent race conditions
   - Takes a snapshot of the current cache
   - Immediately updates the cache with the new/updated/deleted item
   - Returns context for potential rollback

2. **onError** (Rollback)
   - If the API call fails, automatically rolls back to the previous state
   - Restores the snapshot taken in `onMutate`
   - User sees the original data again

3. **onSettled** (Final Sync)
   - Always runs after success or error
   - Invalidates queries to refetch from server
   - Ensures UI is in sync with server state

## Benefits

✅ **Instant UI Feedback**
- Users see changes immediately
- No waiting for network requests
- Better perceived performance

✅ **Automatic Error Handling**
- If API call fails, UI automatically reverts
- No manual error state management needed
- User sees error toast, but UI stays consistent

✅ **Consistency Guaranteed**
- Final state always matches server
- Background refetch ensures accuracy
- No stale data issues

## Hooks with Optimistic Updates

All mutation hooks now include optimistic updates:

### Clients
- `useCreateClient()` - Adds client immediately
- `useUpdateClient()` - Updates client immediately
- `useDeleteClient()` - Removes client immediately

### Accounts
- `useCreateAccount()` - Adds account immediately
- `useUpdateAccount()` - Updates account immediately (also updates client-specific queries)
- `useDeleteAccount()` - Removes account immediately (also removes from client-specific queries)

### Households
- `useCreateHousehold()` - Adds household immediately
- `useUpdateHousehold()` - Updates household immediately
- `useDeleteHousehold()` - Removes household immediately

### Relationships
- `useCreateRelationship()` - Adds relationship immediately
- `useUpdateRelationship()` - Updates relationship immediately
- `useDeleteRelationship()` - Removes relationship immediately

### Master Accounts
- `useCreateMasterAccount()` - Adds master account immediately
- `useUpdateMasterAccount()` - Updates master account immediately
- `useDeleteMasterAccount()` - Removes master account immediately

## Example: Creating a Client

### Before (Without Optimistic Updates)
```typescript
// User clicks "Save"
// 1. Show loading spinner
// 2. Wait for API response (200-500ms)
// 3. Show success toast
// 4. Refetch clients list
// 5. Update UI with new client
// Total: ~500ms delay
```

### After (With Optimistic Updates)
```typescript
// User clicks "Save"
// 1. Client appears in list IMMEDIATELY (0ms)
// 2. API call happens in background
// 3. If success: Show success toast, finalize data
// 4. If error: Rollback, show error toast
// Total: Instant feedback, ~200ms for confirmation
```

## Error Handling

If an API call fails:

1. **Automatic Rollback**
   - UI reverts to previous state
   - User sees original data
   - No broken state

2. **Error Notification**
   - Error toast appears
   - User knows what went wrong
   - Can retry if needed

3. **Cache Consistency**
   - Cache is invalidated
   - Next query will refetch from server
   - Ensures data accuracy

## Technical Details

### Temporary IDs

When creating items, we use temporary IDs:
```typescript
id: `temp-${Date.now()}`
```

These are replaced with real IDs when the server responds. The `onSettled` hook invalidates queries, causing a refetch with the correct server data.

### Query Cancellation

Before optimistic updates, we cancel any outgoing queries:
```typescript
await queryClient.cancelQueries({ queryKey: ['clients', firmId] });
```

This prevents race conditions where:
- Optimistic update adds item
- Outgoing query overwrites with old data
- Item disappears briefly

### Cache Snapshots

We always save the previous state:
```typescript
const previousClients = queryClient.getQueryData<Client[]>(['clients', firmId]);
```

This allows instant rollback if the mutation fails.

## Testing Optimistic Updates

### Test Success Flow
1. Create/update/delete an item
2. Verify it appears/disappears immediately
3. Wait for API response
4. Verify final state matches server

### Test Error Flow
1. Simulate network error (disable network in DevTools)
2. Create/update/delete an item
3. Verify it appears/disappears immediately
4. Wait for error
5. Verify UI rolls back to original state
6. Verify error toast appears

## Performance Impact

**Positive:**
- ✅ Instant UI feedback (0ms perceived delay)
- ✅ Better user experience
- ✅ No additional network requests

**Neutral:**
- Background refetch still happens (ensures consistency)
- Same number of API calls as before

**Negative:**
- None! Optimistic updates are pure UX improvement

## Best Practices

1. **Always Use onSettled**
   - Ensures final state matches server
   - Handles both success and error cases
   - Prevents stale data

2. **Save Snapshots**
   - Always save previous state in `onMutate`
   - Return context for rollback
   - Handle undefined gracefully

3. **Cancel Queries**
   - Cancel related queries before updating
   - Prevents race conditions
   - Ensures consistent state

4. **Handle Related Queries**
   - Update all affected query keys
   - Example: Updating account also updates client's account list
   - Maintains consistency across views

## Troubleshooting

### Item Appears Then Disappears

**Cause:** Temporary ID conflict or race condition

**Solution:** Check that `onSettled` invalidates queries properly

### Item Doesn't Rollback on Error

**Cause:** Context not saved or error handler missing

**Solution:** Verify `onMutate` returns context and `onError` uses it

### UI Shows Stale Data

**Cause:** `onSettled` not invalidating queries

**Solution:** Ensure `invalidateQueries` is called in `onSettled`

## Future Enhancements

Potential improvements:
- Add loading indicators during optimistic updates
- Show "saving..." state for updates
- Add undo functionality for deletes
- Batch optimistic updates for multiple items

## Summary

Optimistic updates provide:
- ✅ Instant UI feedback
- ✅ Better user experience
- ✅ Automatic error handling
- ✅ Guaranteed consistency

All mutation hooks are now production-ready with optimistic updates!



