# Data Relationship Hierarchy Implementation Guide

This guide explains how to implement and display data relationships and hierarchies across all pages in the FeeMGR application.

## Overview

The hierarchy system visualizes the relationships between:
- **Relationships** (top level) - Family or business groupings
- **Master Accounts** - Billing aggregation level
- **Households** - Living arrangement groupings
- **Clients** - Individual or entity clients
- **Accounts** - Individual investment accounts

## Components

### 1. RelationshipHierarchy Component

Displays the full hierarchy path from relationship down to the current entity.

**Location:** `src/components/RelationshipHierarchy.tsx`

**Usage:**

```typescript
import RelationshipHierarchy, { HierarchyNode } from './RelationshipHierarchy';

const hierarchy: HierarchyNode[] = [
  {
    id: 'rel-1',
    name: 'Smith Family Relationship',
    type: 'relationship',
    count: 12,
    aum: 15000000,
    status: 'Active',
  },
  {
    id: 'ma-1',
    name: 'Master Account 1001',
    type: 'master_account',
    count: 8,
    aum: 10000000,
  },
  {
    id: 'hh-1',
    name: 'Smith Household',
    type: 'household',
    count: 5,
    aum: 7500000,
  },
  {
    id: 'client-1',
    name: 'John Smith',
    type: 'client',
    count: 3,
    aum: 2500000,
  },
];

<RelationshipHierarchy
  hierarchy={hierarchy}
  onNavigate={(id, type) => handleNavigation(id, type)}
  showLinks={true}
/>
```

**Props:**
- `hierarchy: HierarchyNode[]` - Array of hierarchy nodes from top to bottom
- `onNavigate?: (nodeId: string, nodeType: string) => void` - Navigation handler
- `compact?: boolean` - Show compact breadcrumb style (default: false)
- `showLinks?: boolean` - Show clickable links (default: true)

**Display Modes:**

1. **Full Mode** (default) - Shows vertical hierarchy with icons and details
2. **Compact Mode** - Shows horizontal breadcrumb style

```typescript
<RelationshipHierarchy hierarchy={hierarchy} compact={true} />
```

### 2. RelationshipCard Component

Displays a card with related entities (accounts, households, clients, etc.)

**Location:** `src/components/RelationshipCard.tsx`

**Usage:**

```typescript
import RelationshipCard from './RelationshipCard';

const relatedAccounts = [
  {
    id: 'acc-1',
    name: 'Individual Brokerage',
    type: 'account',
    details: 'Account #1234',
    aum: 1500000,
    status: 'Active',
  },
  // ... more accounts
];

<RelationshipCard
  title="Accounts"
  entities={relatedAccounts}
  onViewEntity={(id, type) => handleViewEntity(id, type)}
  maxDisplay={5}
  showViewAll={true}
/>
```

**Props:**
- `title: string` - Card title
- `entities: RelatedEntity[]` - Array of related entities
- `onViewEntity?: (entityId: string, entityType: string) => void` - Click handler
- `showViewAll?: boolean` - Show "View All" button (default: true)
- `onViewAll?: () => void` - View all handler
- `maxDisplay?: number` - Maximum entities to display (default: 5)

### 3. ClientDetailModal Component

Example modal showing complete client details with hierarchy and relationships.

**Location:** `src/components/ClientDetailModal.tsx`

**Usage:**

```typescript
import ClientDetailModal from './ClientDetailModal';

<ClientDetailModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  client={selectedClient}
  onEdit={(client) => handleEdit(client)}
/>
```

## Implementation by Page

### Master Accounts Page

**Add to account rows:**
```typescript
// Show compact hierarchy in table
<RelationshipHierarchy
  hierarchy={[
    { id: account.relationshipId, name: account.relationshipName, type: 'relationship' },
    { id: account.id, name: account.masterAccountName, type: 'master_account' },
  ]}
  compact={true}
/>
```

**In detail view:**
```typescript
<RelationshipCard
  title="Associated Accounts"
  entities={account.assignedAccountIds.map(id => ({
    id,
    name: getAccountName(id),
    type: 'account',
    aum: getAccountAUM(id),
  }))}
/>
```

### Clients Page

**Table View - Add hierarchy column:**
```typescript
<td>
  <RelationshipHierarchy
    hierarchy={getClientHierarchy(client)}
    compact={true}
    showLinks={false}
  />
</td>
```

**Detail View:**
```typescript
<ClientDetailModal client={selectedClient} />
// This component already includes full hierarchy and relationships
```

### Accounts Page

**Show parent hierarchy:**
```typescript
const hierarchy = [
  { id: account.relationshipId, name: account.relationshipName, type: 'relationship' },
  { id: account.masterAccountId, name: account.masterAccountName, type: 'master_account' },
  { id: account.householdId, name: account.householdName, type: 'household' },
  { id: account.clientId, name: account.clientName, type: 'client' },
  { id: account.id, name: account.accountName, type: 'account' },
];

<RelationshipHierarchy hierarchy={hierarchy} />
```

### Households Page

**Show household structure:**
```typescript
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
  <RelationshipCard
    title="Household Members"
    entities={household.memberAccountIds.map(id => ({
      id,
      name: getAccountName(id),
      type: 'account',
      aum: getAccountAUM(id),
    }))}
  />

  <RelationshipCard
    title="Associated Clients"
    entities={household.associatedClientIds.map(id => ({
      id,
      name: getClientName(id),
      type: 'client',
    }))}
  />
</div>
```

### Relationships Page

**Show complete relationship structure:**
```typescript
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
  <RelationshipCard
    title="Master Accounts"
    entities={relationship.masterAccounts}
  />

  <RelationshipCard
    title="Households"
    entities={relationship.households}
  />

  <RelationshipCard
    title="Clients"
    entities={relationship.clients}
  />
</div>
```

### Fee Reports Page

**In report details:**
```typescript
// When drilling down to client fees
<RelationshipHierarchy
  hierarchy={getClientHierarchy(client)}
  compact={true}
/>

// Show account breakdowns
<RelationshipCard
  title="Fee Breakdown by Account"
  entities={clientAccounts.map(account => ({
    id: account.id,
    name: account.name,
    type: 'account',
    aum: account.aum,
    details: `Fee: ${formatCurrency(account.fee)}`,
  }))}
/>
```

## Data Structure Helper Functions

Create these helper functions to build hierarchy data:

```typescript
// src/utils/hierarchyHelpers.ts

import { HierarchyNode } from '../components/RelationshipHierarchy';
import { Client } from '../types/Client';
import { Account } from '../types/Account';
import { Household } from '../types/Household';

export function buildClientHierarchy(
  client: Client,
  household?: Household,
  masterAccount?: any,
  relationship?: any
): HierarchyNode[] {
  const hierarchy: HierarchyNode[] = [];

  if (relationship) {
    hierarchy.push({
      id: relationship.id,
      name: relationship.name,
      type: 'relationship',
      count: relationship.totalAccounts,
      aum: relationship.totalAUM,
      status: relationship.status,
    });
  }

  if (masterAccount) {
    hierarchy.push({
      id: masterAccount.id,
      name: masterAccount.masterAccountName,
      type: 'master_account',
      count: masterAccount.numberOfAccounts,
      aum: masterAccount.totalAUM,
    });
  }

  if (household) {
    hierarchy.push({
      id: household.id,
      name: household.householdName,
      type: 'household',
      count: household.numberOfAccounts,
      aum: household.totalAUM,
      status: household.householdStatus,
    });
  }

  hierarchy.push({
    id: client.id,
    name: client.fullLegalName,
    type: 'client',
    count: client.numberOfAccounts,
    aum: client.totalAUM,
    status: client.clientStatus,
  });

  return hierarchy;
}

export function buildAccountHierarchy(
  account: Account,
  client: Client,
  household?: Household,
  masterAccount?: any,
  relationship?: any
): HierarchyNode[] {
  const hierarchy = buildClientHierarchy(client, household, masterAccount, relationship);

  hierarchy.push({
    id: account.id,
    name: account.accountName,
    type: 'account',
    aum: account.currentBalance,
    status: account.accountStatus,
  });

  return hierarchy;
}
```

## Best Practices

1. **Always show hierarchy context** - Users should always know where they are in the data structure
2. **Make relationships clickable** - Allow users to navigate between related entities
3. **Show compact hierarchy in tables** - Use compact mode for table rows
4. **Show full hierarchy in detail views** - Use full mode in modals and detail pages
5. **Include AUM and counts** - Help users understand the scope of each level
6. **Maintain consistency** - Use the same color coding and icons across all pages

## Styling Guidelines

### Colors by Type
- **Relationship**: Purple (#8b5cf6)
- **Master Account**: Sky Blue (#0ea5e9)
- **Household**: Green (#10b981)
- **Client**: Amber (#f59e0b)
- **Account**: Blue (#2196f3)

### Icons
- **Relationship**: Building2
- **Master Account**: Briefcase
- **Household**: Home
- **Client**: User
- **Account**: Users

## Future Enhancements

1. **Tree View**: Add collapsible tree view for complex hierarchies
2. **Drag & Drop**: Allow reorganizing relationships via drag and drop
3. **Visual Graph**: Add network graph visualization
4. **Bulk Operations**: Select multiple entities for bulk actions
5. **Comparison View**: Compare metrics across sibling entities
