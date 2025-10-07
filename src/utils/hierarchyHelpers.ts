import { HierarchyNode } from '../components/RelationshipHierarchy';
import { Client } from '../types/Client';
import { Account } from '../types/Account';
import { Household } from '../types/Household';
import { MasterAccount } from '../types/MasterAccount';

interface Relationship {
  id: string;
  name: string;
  totalAccounts?: number;
  totalAUM?: number;
  status?: string;
}

/**
 * Build hierarchy for a client showing full path from relationship to client
 */
export function buildClientHierarchy(
  client: Client,
  household?: Household,
  masterAccount?: MasterAccount,
  relationship?: Relationship
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

/**
 * Build hierarchy for an account showing full path from relationship to account
 */
export function buildAccountHierarchy(
  account: Account,
  client?: Client,
  household?: Household,
  masterAccount?: MasterAccount,
  relationship?: Relationship
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

  if (client) {
    hierarchy.push({
      id: client.id,
      name: client.fullLegalName,
      type: 'client',
      count: client.numberOfAccounts,
      aum: client.totalAUM,
      status: client.clientStatus,
    });
  }

  hierarchy.push({
    id: account.id,
    name: account.accountName,
    type: 'account',
    aum: account.currentBalance,
    status: account.accountStatus,
  });

  return hierarchy;
}

/**
 * Build hierarchy for a household showing relationship and master account if applicable
 */
export function buildHouseholdHierarchy(
  household: Household,
  masterAccount?: MasterAccount,
  relationship?: Relationship
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

  hierarchy.push({
    id: household.id,
    name: household.householdName,
    type: 'household',
    count: household.numberOfAccounts,
    aum: household.totalAUM,
    status: household.householdStatus,
  });

  return hierarchy;
}

/**
 * Build hierarchy for a master account showing relationship if applicable
 */
export function buildMasterAccountHierarchy(
  masterAccount: MasterAccount,
  relationship?: Relationship
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

  hierarchy.push({
    id: masterAccount.id,
    name: masterAccount.masterAccountName,
    type: 'master_account',
    count: masterAccount.numberOfAccounts,
    aum: masterAccount.totalAUM,
  });

  return hierarchy;
}
