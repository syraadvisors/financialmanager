export interface MasterAccount {
  id: string;
  masterAccountNumber: string;
  masterAccountName: string;
  office?: string;
  description?: string;
  assignedAccountIds: string[]; // Accounts assigned to this master account
  totalAUM?: number;
  numberOfAccounts?: number;
  isActive: boolean;
  createdDate: string;
  lastModifiedDate: string;
}
