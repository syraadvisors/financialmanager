# Mock Data Removal Plan

## Summary

Found **4 locations** with mock/test data. **2 are in production** and need immediate fixes.

## Priority Fixes Required

### 1. 🔴 **EnhancedClientDetailModal.tsx** (PRODUCTION)
**File**: `src/components/EnhancedClientDetailModal.tsx`
**Mock Data**:
- `mockFeeHistory` - 4 hardcoded fee history records
- `relatedAccounts` - 3 hardcoded accounts
- `relatedHouseholds` - 1 hardcoded household
- Mock hierarchy data

**Fix**: Replace with:
- `feeCalculationsService.getHistory(client.id)` for fee history
- `accountsService.getByClientId(client.id)` for accounts
- Real household queries
- Real hierarchy data

---

### 2. 🔴 **FeeReportsPage.tsx** (PRODUCTION)
**File**: `src/components/FeeReportsPage.tsx`
**Mock Data**: `handleInvoiceGeneration()` creates mock invoices

**Fix**: Replace with real invoice generation from `fee_calculations` table

---

### 3. ⚠️ **BillingDashboardPage.tsx** (NOT IN ROUTES)
**File**: `src/pages/BillingDashboardPage.tsx`
**Status**: Not found in App.tsx routes - may be unused
**Mock Data**: `mockClients` and `currentQuarter`

**Action**: Check if used, replace if needed, or remove

---

### 4. ⚪ **FeeCalculationDemo.tsx** (DEMO)
**File**: `src/components/FeeCalculationDemo.tsx`
**Status**: Demo component, not in routes
**Action**: Mark as demo or remove

---

## Implementation Notes

- All main data pages already use real database ✅
- Test files with mocks are OK ✅
- Only production components need fixing



