export enum InvoiceStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled'
}

export interface InvoiceLineItem {
  id: string;
  accountNumber: string;
  accountName: string;
  feeScheduleCode: string;
  feeScheduleName: string;
  beginningBalance: number;
  endingBalance: number;
  averageBalance: number;
  feeRate: number;
  calculatedFee: number;
  minimumFee?: number;
  finalFee: number;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  status: InvoiceStatus;

  // Client Information
  clientId: string;
  clientName: string;
  householdId?: string;
  householdName?: string;
  masterAccountId?: string;
  masterAccountNumber?: string;

  // Billing Period
  billingPeriodId: string;
  billingPeriodName: string;
  periodStartDate: Date;
  periodEndDate: Date;

  // Line Items
  lineItems: InvoiceLineItem[];

  // Totals
  subtotal: number;
  adjustments?: number;
  adjustmentNotes?: string;
  totalDue: number;

  // Payment Information
  paidAmount?: number;
  paidDate?: Date;
  paymentMethod?: string;

  // Additional Information
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  sentDate?: Date;

  // Customization
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  logoUrl?: string;
  customMessage?: string;
}

export interface InvoiceGenerationOptions {
  billingPeriodId: string;
  clientIds?: string[]; // If empty, generate for all clients
  invoiceDate: Date;
  dueDate: Date;
  includeZeroFees: boolean;
  groupByHousehold: boolean;
  customMessage?: string;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logoUrl?: string;
  };
}

export interface BulkInvoiceResult {
  totalGenerated: number;
  successCount: number;
  failureCount: number;
  invoices: Invoice[];
  errors?: Array<{
    clientId: string;
    clientName: string;
    error: string;
  }>;
}
