# API Response Types Migration Guide

This guide explains how to use the new standardized API response types with HTTP status codes and improved error handling.

## Table of Contents

1. [Overview](#overview)
2. [New Type System](#new-type-system)
3. [Migration Examples](#migration-examples)
4. [Error Handling](#error-handling)
5. [Toast Notifications](#toast-notifications)
6. [Best Practices](#best-practices)

## Overview

### What Changed?

**Before (Legacy):**
```typescript
interface ApiResponse<T> {
  data?: T | null;
  error?: string | null;
  message?: string;
}
```

**After (New):**
```typescript
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  statusCode: HttpStatusCode;
  message?: string;
  meta?: PaginationMeta;
  timestamp?: string;
}

interface ApiErrorResponse {
  success: false;
  error: ApiError;
  statusCode: HttpStatusCode;
  timestamp?: string;
}
```

### Benefits

1. **Type Safety**: Success and error states are distinct types
2. **Status Codes**: HTTP status codes for better error categorization
3. **Error Details**: Structured error information with codes and validation details
4. **Consistency**: Standardized error shapes across the application
5. **Better DX**: Type guards and helper functions for easier usage

## New Type System

### Core Types

```typescript
import {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiError,
  ApiErrorCode,
  HttpStatusCode,
  isSuccessResponse,
  isErrorResponse,
  createSuccessResponse,
  createErrorResponse,
} from '../types/api';
```

### HTTP Status Codes

```typescript
enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  // ... and more
}
```

### Error Codes

```typescript
enum ApiErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  // ... and more
}
```

## Migration Examples

### Example 1: Basic Service Function

**Before (Legacy):**
```typescript
// services/api/users.service.ts
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

async function getUser(id: string): Promise<ApiResponse<User>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
```

**After (New - Option 1: Using wrapServiceCall):**
```typescript
import { wrapServiceCall } from '../../utils/apiErrorHandler';
import { ApiResponse } from '../../types/api';

async function getUser(id: string): Promise<ApiResponse<User>> {
  return wrapServiceCall(
    async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    'User',
    id
  );
}
```

**After (New - Option 2: Using safeServiceCall):**
```typescript
import { safeServiceCall } from '../../utils/apiErrorHandler';
import { ApiResponse } from '../../types/api';

async function getUser(id: string): Promise<ApiResponse<User>> {
  return safeServiceCall(
    () => supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single(),
    {
      resourceType: 'User',
      resourceId: id,
    }
  );
}
```

**After (New - Option 3: Manual Error Handling):**
```typescript
import {
  createSuccessResponse,
  handleSupabaseError,
  ApiResponse
} from '../../utils/apiErrorHandler';

async function getUser(id: string): Promise<ApiResponse<User>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return handleSupabaseError(error, 'Failed to fetch user');
    }

    return createSuccessResponse(data);
  } catch (error) {
    return handleServiceError(error, {
      resourceType: 'User',
      resourceId: id,
    });
  }
}
```

### Example 2: Create Operation with Validation

**Before (Legacy):**
```typescript
async function createUser(userData: UserData): Promise<ApiResponse<User>> {
  try {
    // Validation
    if (!userData.email) {
      return { data: null, error: 'Email is required' };
    }

    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
```

**After (New):**
```typescript
import {
  wrapServiceCall,
  validateRequiredFields,
  createValidationErrorResponse,
  HttpStatusCode,
} from '../../utils/apiErrorHandler';
import { ApiResponse } from '../../types/api';

async function createUser(userData: UserData): Promise<ApiResponse<User>> {
  // Validation
  const validationErrors = validateRequiredFields(userData, ['email', 'name']);
  if (validationErrors.length > 0) {
    return createValidationErrorResponse(validationErrors);
  }

  return wrapServiceCall(
    async () => {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    'User',
    undefined,
    {
      successMessage: 'User created successfully',
      successStatusCode: HttpStatusCode.CREATED,
    }
  );
}
```

### Example 3: Authentication Check

**Before (Legacy):**
```typescript
async function getUserProfile(): Promise<ApiResponse<UserProfile>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
}
```

**After (New):**
```typescript
import {
  getUserId,
  safeServiceCall,
  ApiResponse
} from '../../utils/apiErrorHandler';

async function getUserProfile(): Promise<ApiResponse<UserProfile>> {
  // Check authentication
  const authResult = await getUserId(supabase.auth);
  if ('success' in authResult && !authResult.success) {
    return authResult; // Return auth error
  }
  const { userId } = authResult;

  // Fetch profile
  return safeServiceCall(
    () => supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    {
      resourceType: 'UserProfile',
      resourceId: userId,
    }
  );
}
```

### Example 4: Component Usage

**Before (Legacy):**
```typescript
import { showApiResponseToast } from '../utils/toast';

const handleSave = async () => {
  const response = await usersService.updateProfile(profileData);

  if (response.error) {
    showError(response.error);
  } else {
    showSuccess('Profile updated successfully');
  }
};
```

**After (New):**
```typescript
import { showApiResponseToastV2, showSmartErrorToast } from '../utils/toast';
import { isSuccessResponse } from '../types/api';

const handleSave = async () => {
  const response = await usersService.updateProfile(profileData);

  // Option 1: Simple toast
  showApiResponseToastV2(response, 'Profile updated successfully');

  // Option 2: Smart error handling
  if (isSuccessResponse(response)) {
    showSuccess('Profile updated successfully');
    // Use response.data which is type-safe
    console.log(response.data);
  } else {
    showSmartErrorToast(response);
    // Access error details
    console.log(response.error.code, response.error.statusCode);
  }
};
```

## Error Handling

### Specialized Error Handlers

```typescript
import {
  handleAuthError,
  handleNotFoundError,
  handleValidationError,
  handlePermissionError,
  handleNetworkError,
  handleSupabaseError,
} from '../utils/apiErrorHandler';

// Authentication error
if (!user) {
  return handleAuthError('Please log in to continue');
}

// Not found error
if (!resource) {
  return handleNotFoundError('User', userId);
}

// Validation error
const errors = validateRequiredFields(data, ['email', 'name']);
if (errors.length > 0) {
  return handleValidationError('Invalid input', errors);
}

// Permission error
if (!hasPermission) {
  return handlePermissionError('edit this resource');
}

// Supabase error
const { data, error } = await supabase.from('users').select('*');
if (error) {
  return handleSupabaseError(error, 'Failed to fetch users');
}
```

### Generic Error Handler

```typescript
import { handleServiceError } from '../utils/apiErrorHandler';

try {
  // ... operation
} catch (error) {
  return handleServiceError(error, {
    defaultMessage: 'Operation failed',
    resourceType: 'User',
    resourceId: userId,
  });
}
```

## Toast Notifications

### New Toast Functions

```typescript
import {
  showApiResponseToastV2,
  showSmartErrorToast,
  showValidationErrorToast,
  showDetailedErrorToast,
} from '../utils/toast';

// 1. Simple API response toast
showApiResponseToastV2(response, 'Operation successful');

// 2. Smart error toast (auto-detects error type)
if (isErrorResponse(response)) {
  showSmartErrorToast(response);
}

// 3. Validation error toast (shows field errors)
if (response.error.code === ApiErrorCode.VALIDATION_ERROR) {
  showValidationErrorToast(response);
}

// 4. Detailed error toast (for debugging)
showDetailedErrorToast(response, true);
```

### Type-Safe Toast Usage

```typescript
import { isSuccessResponse, isErrorResponse } from '../types/api';

const response = await service.doSomething();

if (isSuccessResponse(response)) {
  // response.data is type-safe here
  console.log(response.data);
  showSuccess(response.message || 'Success!');
} else if (isErrorResponse(response)) {
  // response.error is available here
  console.error(response.error.code, response.error.message);
  showSmartErrorToast(response);
}
```

## Best Practices

### 1. Use Helper Functions

✅ **Good:**
```typescript
return wrapServiceCall(
  async () => {
    const { data, error } = await supabase.from('users').select();
    if (error) throw error;
    return data;
  },
  'User'
);
```

❌ **Avoid:**
```typescript
try {
  const { data, error } = await supabase.from('users').select();
  if (error) {
    return { data: null, error: error.message };
  }
  return { data, error: null };
} catch (err) {
  return { data: null, error: 'Unknown error' };
}
```

### 2. Validate Input Early

✅ **Good:**
```typescript
const errors = validateRequiredFields(data, ['email', 'name']);
if (errors.length > 0) {
  return createValidationErrorResponse(errors);
}
```

❌ **Avoid:**
```typescript
if (!data.email) {
  return { data: null, error: 'Email is required' };
}
if (!data.name) {
  return { data: null, error: 'Name is required' };
}
```

### 3. Use Type Guards

✅ **Good:**
```typescript
if (isSuccessResponse(response)) {
  // TypeScript knows response.data exists
  console.log(response.data.id);
} else {
  // TypeScript knows response.error exists
  console.log(response.error.code);
}
```

❌ **Avoid:**
```typescript
if (response.data) {
  console.log(response.data.id);
} else if (response.error) {
  console.log(response.error);
}
```

### 4. Provide Context in Errors

✅ **Good:**
```typescript
return handleServiceError(error, {
  defaultMessage: 'Failed to update user profile',
  resourceType: 'UserProfile',
  resourceId: userId,
});
```

❌ **Avoid:**
```typescript
return { data: null, error: 'Error occurred' };
```

### 5. Use Smart Error Toasts

✅ **Good:**
```typescript
showSmartErrorToast(response); // Auto-detects error type
```

❌ **Avoid:**
```typescript
showError(response.error.message); // Loses error context
```

## Backward Compatibility

The new system maintains backward compatibility with legacy responses:

```typescript
import { convertLegacyResponse } from '../types/api';

// Convert legacy response to new format
const legacyResponse = { data: user, error: null };
const newResponse = convertLegacyResponse(legacyResponse);

// Now you can use new features
if (isSuccessResponse(newResponse)) {
  console.log(newResponse.statusCode); // 200
}
```

## Migration Checklist

- [ ] Import new types from `../types/api`
- [ ] Import error handlers from `../utils/apiErrorHandler`
- [ ] Replace manual try-catch with `wrapServiceCall` or `safeServiceCall`
- [ ] Add validation using `validateRequiredFields`
- [ ] Use specialized error handlers (`handleAuthError`, `handleNotFoundError`, etc.)
- [ ] Update toast notifications to use `showApiResponseToastV2` or `showSmartErrorToast`
- [ ] Add type guards (`isSuccessResponse`, `isErrorResponse`) in components
- [ ] Include HTTP status codes for success responses
- [ ] Add error codes to error responses
- [ ] Test error scenarios (network errors, validation errors, auth errors)

## Common Patterns

### Pattern 1: CRUD Operations

```typescript
// Create
async create(data: T): Promise<ApiResponse<T>> {
  const errors = validateRequiredFields(data, requiredFields);
  if (errors.length > 0) return createValidationErrorResponse(errors);

  return wrapServiceCall(
    async () => {
      const { data, error } = await supabase.from('table').insert(data).single();
      if (error) throw error;
      return data;
    },
    'Resource',
    undefined,
    { successStatusCode: HttpStatusCode.CREATED }
  );
}

// Read
async getById(id: string): Promise<ApiResponse<T>> {
  return safeServiceCall(
    () => supabase.from('table').select('*').eq('id', id).single(),
    { resourceType: 'Resource', resourceId: id }
  );
}

// Update
async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
  return wrapServiceCall(
    async () => {
      const { data, error } = await supabase
        .from('table')
        .update(data)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    'Resource',
    id
  );
}

// Delete
async delete(id: string): Promise<ApiResponse<void>> {
  return wrapServiceCall(
    async () => {
      const { error } = await supabase.from('table').delete().eq('id', id);
      if (error) throw error;
    },
    'Resource',
    id,
    { successStatusCode: HttpStatusCode.NO_CONTENT }
  );
}
```

### Pattern 2: Authentication Guard

```typescript
async function protectedOperation(): Promise<ApiResponse<T>> {
  const authResult = await getUserId(supabase.auth);
  if ('success' in authResult && !authResult.success) {
    return authResult;
  }

  // Continue with authenticated operation
  const { userId } = authResult;
  // ...
}
```

### Pattern 3: Paginated Results

```typescript
import { createSuccessResponse, HttpStatusCode } from '../types/api';

async function getUsers(page: number = 1, pageSize: number = 20): Promise<ApiResponse<User[]>> {
  return wrapServiceCall(async () => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .range(start, end);

    if (error) throw error;

    const totalPages = Math.ceil((count || 0) / pageSize);

    return createSuccessResponse(data, {
      meta: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  }, 'User');
}
```

## Summary

The new API response types provide:

1. **Better Type Safety**: Distinct success and error types
2. **HTTP Status Codes**: For proper error categorization
3. **Structured Errors**: With codes, details, and validation info
4. **Helper Functions**: For common error scenarios
5. **Smart Toasts**: Automatic error type detection
6. **Backward Compatibility**: Can work alongside legacy code

Migrate services gradually, starting with new features and high-traffic endpoints.
