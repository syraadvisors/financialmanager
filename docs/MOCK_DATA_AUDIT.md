# Mock Data Audit Report

## Summary

Found **4 locations** with mock/test data that should be replaced with database queries.

## Issues Found

### 1. ⚠️ **BillingDashboardPage.tsx** - Mock Clients & Quarter Data
**Location**: `src/pages/BillingDashboardPage.tsx`
**Status**: ⚠️ **NOT IN ROUTES** - May not be used in production
**Mock Data**:
- `mockClients` array (5 hardcoded clients)
- `currentQuarter` object with hardcoded stats

**Action**: 
- Check if this page is actually used
- If used, replace with real API calls to:
  - `billingPeriodsService.getAll()` for quarter data
  - `feeCalculationsService` for client billing data
  - `clientsService.getAll()` for client list

---

### 2. 🔴 **EnhancedClientDetailModal.tsx** - Mock Fee History & Related Data
**Location**: `src/components/EnhancedClientDetailModal.tsx`
**Status**: 🔴 **IN PRODUCTION** - Used in ClientDetailModal
**Mock Data**:
- `mockFeeHistory` array (4 hardcoded fee history records)
- `relatedAccounts` array (3 hardcoded accounts)
- `relatedHouseholds` array (1 hardcoded household)
- Mock hierarchy data

**Action**: **REQUIRED** - Replace with real API calls:
- `feeCalculationsService.getHistory(clientId)` for fee history
- `accountsService.getByClientId(clientId)` for related accounts
- `householdsService` for related households
- Real hierarchy data from relationships

---

### 3. 🔴 **FeeReportsPage.tsx** - Mock Invoice Generation
**Location**: `src/components/FeeReportsPage.tsx`
**Status**: 🔴 **IN PRODUCTION** - Used in routes (`/app/fee-reports`)
**Mock Data**:
- `handleInvoiceGeneration()` generates mock invoices with hardcoded data

**Action**: **REQUIRED** - Replace with real invoice generation:
- Use `feeCalculationsService` to get actual fee calculations
- Generate invoices from `fee_calculations` table data
- Use real client/account data from database

---

### 4. ⚪ **FeeCalculationDemo.tsx** - Sample Data
**Location**: `src/components/FeeCalculationDemo.tsx`
**Status**: ⚪ **DEMO COMPONENT** - Not in routes, likely for testing/demo
**Mock Data**:
- `sampleBalanceData` array
- `samplePositionsData` array

**Action**: **OPTIONAL** - This appears to be a demo/test component. Consider:
- Removing if not needed
- Or clearly marking as demo-only
- Or replacing with real data if used in production

---

## Test Files (OK to Keep)

These files contain mock data but are test files, which is expected:
- `src/contexts/AuthContext.test.tsx` - Test mocks
- `src/services/api/users.service.test.ts` - Test mocks
- `src/utils/searchBenchmark.ts` - Benchmark test data (OK)
- `src/utils/feeCalculationTests.ts` - Test data (OK)

---

## Services Available for Replacement

### Fee History
- ✅ `feeCalculationsService.getHistory(clientId?, accountId?)` - Get fee calculation history

### Billing Data
- ✅ `billingPeriodsService.getAll(firmId)` - Get billing periods
- ✅ `billingPeriodsService.getActive(firmId)` - Get active periods

### Client/Account Data
- ✅ `clientsService.getAll()` - Get all clients
- ✅ `accountsService.getByClientId(clientId)` - Get client accounts
- ✅ `householdsService.getAll(firmId)` - Get households
- ✅ `relationshipsService.getAll(firmId)` - Get relationships

### Fee Calculations
- ✅ `feeCalculationsService.calculate(request)` - Calculate fees
- ✅ `feeCalculationsService.getHistory()` - Get calculation history

---

## Priority Actions

### High Priority (Production Code)
1. **EnhancedClientDetailModal.tsx** - Replace mock fee history and related data
2. **FeeReportsPage.tsx** - Replace mock invoice generation

### Medium Priority (Check Usage)
3. **BillingDashboardPage.tsx** - Check if used, replace if needed

### Low Priority (Demo/Test)
4. **FeeCalculationDemo.tsx** - Review if needed, mark as demo or remove

---

## Implementation Plan

### Step 1: EnhancedClientDetailModal
- Replace `mockFeeHistory` with `feeCalculationsService.getHistory(client.id)`
- Replace `relatedAccounts` with `accountsService.getByClientId(client.id)`
- Replace `relatedHouseholds` with real household queries
- Replace mock hierarchy with real relationship data

### Step 2: FeeReportsPage
- Replace mock invoice generation with real fee calculations
- Use `feeCalculationsService` to get actual calculations
- Generate invoices from real `fee_calculations` table data
- Use real client/account data

### Step 3: BillingDashboardPage
- Check if page is actually used in routes
- If used, replace mock data with real API calls
- If not used, consider removing or clearly marking as WIP

---

## Notes

- All main data pages (Clients, Accounts, Households, Relationships) already use real database data ✅
- Test files with mocks are OK ✅
- Benchmark/test utilities with sample data are OK ✅
- Only production components need fixing



