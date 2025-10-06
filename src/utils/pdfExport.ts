import { Invoice } from '../types/Invoice';

interface PDFExportOptions {
  title: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'letter' | 'a4';
}

/**
 * Generate a simple PDF-like HTML document for printing/saving
 * This creates a printable HTML page that can be saved as PDF using browser print
 */
export const generatePDFHTML = (content: string, options: PDFExportOptions): string => {
  const { title, orientation = 'portrait', pageSize = 'letter' } = options;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: 0.5in;
    }

    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-after: always;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #000;
      background: white;
    }

    .container {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
      background: white;
    }

    h1 {
      font-size: 24pt;
      margin-bottom: 0.25in;
      color: #1a202c;
    }

    h2 {
      font-size: 16pt;
      margin-top: 0.25in;
      margin-bottom: 0.15in;
      color: #1a202c;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.05in;
    }

    h3 {
      font-size: 13pt;
      margin-top: 0.2in;
      margin-bottom: 0.1in;
      color: #475569;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.15in 0;
    }

    th {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8pt;
      text-align: left;
      font-weight: 600;
      font-size: 10pt;
      color: #475569;
    }

    td {
      border: 1px solid #e2e8f0;
      padding: 8pt;
      font-size: 10pt;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .font-bold {
      font-weight: 600;
    }

    .text-lg {
      font-size: 12pt;
    }

    .mb-2 {
      margin-bottom: 0.1in;
    }

    .mb-4 {
      margin-bottom: 0.2in;
    }

    .mt-4 {
      margin-top: 0.2in;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.3in;
      padding-bottom: 0.2in;
      border-bottom: 3px solid #2196f3;
    }

    .invoice-info {
      background-color: #f8fafc;
      padding: 0.15in;
      border-radius: 4pt;
      margin-bottom: 0.2in;
    }

    .total-row {
      background-color: #eff6ff;
      font-weight: 600;
      font-size: 11pt;
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background-color: #2196f3;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .print-button:hover {
      background-color: #1976d2;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Print / Save as PDF</button>
  <div class="container">
    ${content}
  </div>
</body>
</html>
  `.trim();
};

/**
 * Export report data to PDF
 */
export const exportReportToPDF = (
  reportTitle: string,
  reportData: any,
  dateRange: string
): void => {
  const content = `
    <div class="invoice-header">
      <div>
        <h1>${reportTitle}</h1>
        <p style="color: #64748b; font-size: 11pt;">${dateRange}</p>
      </div>
      <div style="text-align: right;">
        <p style="color: #64748b; font-size: 10pt;">Generated: ${new Date().toLocaleDateString()}</p>
      </div>
    </div>

    ${reportData}
  `;

  const html = generatePDFHTML(content, {
    title: reportTitle,
    orientation: 'portrait',
  });

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');

  if (newWindow) {
    newWindow.onload = () => {
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    };
  }
};

/**
 * Generate invoice PDF
 */
export const generateInvoicePDF = (invoice: Invoice): void => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const lineItemsHTML = invoice.lineItems
    .map(
      (item) => `
    <tr>
      <td>${item.accountNumber}</td>
      <td>${item.accountName}</td>
      <td>${item.feeScheduleCode}</td>
      <td class="text-right">${formatCurrency(item.averageBalance)}</td>
      <td class="text-right">${(item.feeRate * 100).toFixed(2)}%</td>
      <td class="text-right font-bold">${formatCurrency(item.finalFee)}</td>
    </tr>
  `
    )
    .join('');

  const content = `
    <div class="invoice-header">
      <div>
        <h1>${invoice.companyName || 'Your Company Name'}</h1>
        <p style="font-size: 10pt; color: #64748b; line-height: 1.4;">
          ${invoice.companyAddress || ''}<br>
          ${invoice.companyPhone || ''}<br>
          ${invoice.companyEmail || ''}
        </p>
      </div>
      <div style="text-align: right;">
        <h2 style="margin: 0; border: none; color: #2196f3;">INVOICE</h2>
        <p style="font-size: 11pt; margin-top: 0.1in;">
          <strong>Invoice #:</strong> ${invoice.invoiceNumber}<br>
          <strong>Date:</strong> ${formatDate(invoice.invoiceDate)}<br>
          <strong>Due Date:</strong> ${formatDate(invoice.dueDate)}
        </p>
      </div>
    </div>

    <div class="invoice-info">
      <h3 style="margin-top: 0;">Bill To:</h3>
      <p style="font-size: 11pt;">
        <strong>${invoice.clientName}</strong><br>
        ${invoice.householdName ? `Household: ${invoice.householdName}<br>` : ''}
        ${invoice.masterAccountNumber ? `Master Account: ${invoice.masterAccountNumber}` : ''}
      </p>
    </div>

    <div class="invoice-info">
      <h3 style="margin-top: 0;">Billing Period:</h3>
      <p style="font-size: 11pt;">
        <strong>${invoice.billingPeriodName}</strong><br>
        ${formatDate(invoice.periodStartDate)} - ${formatDate(invoice.periodEndDate)}
      </p>
    </div>

    ${invoice.customMessage ? `
    <div style="padding: 0.15in; background-color: #fff7ed; border-left: 4px solid #f59e0b; margin-bottom: 0.2in;">
      <p style="font-size: 10pt; color: #92400e;">${invoice.customMessage}</p>
    </div>
    ` : ''}

    <h2>Fee Details</h2>
    <table>
      <thead>
        <tr>
          <th>Account #</th>
          <th>Account Name</th>
          <th>Fee Schedule</th>
          <th class="text-right">Avg Balance</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Fee Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHTML}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="5" class="text-right">Subtotal:</td>
          <td class="text-right">${formatCurrency(invoice.subtotal)}</td>
        </tr>
        ${invoice.adjustments ? `
        <tr>
          <td colspan="5" class="text-right">Adjustments:</td>
          <td class="text-right">${formatCurrency(invoice.adjustments)}</td>
        </tr>
        ` : ''}
        <tr class="total-row" style="background-color: #dbeafe; font-size: 12pt;">
          <td colspan="5" class="text-right"><strong>Total Due:</strong></td>
          <td class="text-right"><strong>${formatCurrency(invoice.totalDue)}</strong></td>
        </tr>
      </tfoot>
    </table>

    ${invoice.adjustmentNotes ? `
    <div class="mt-4">
      <h3>Adjustment Notes:</h3>
      <p style="font-size: 10pt; color: #475569;">${invoice.adjustmentNotes}</p>
    </div>
    ` : ''}

    ${invoice.notes ? `
    <div class="mt-4">
      <h3>Additional Notes:</h3>
      <p style="font-size: 10pt; color: #475569;">${invoice.notes}</p>
    </div>
    ` : ''}

    <div class="mt-4" style="padding-top: 0.3in; border-top: 1px solid #e2e8f0; text-align: center;">
      <p style="font-size: 9pt; color: #94a3b8;">
        Thank you for your business. Please remit payment by the due date.
      </p>
    </div>
  `;

  const html = generatePDFHTML(content, {
    title: `Invoice ${invoice.invoiceNumber}`,
    orientation: 'portrait',
  });

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');

  if (newWindow) {
    newWindow.onload = () => {
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    };
  }
};

/**
 * Export multiple invoices as a single PDF
 */
export const exportBulkInvoicesPDF = (invoices: Invoice[]): void => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalDue, 0);
  const totalClients = invoices.length;

  const summaryTableHTML = invoices
    .map(
      (invoice) => `
    <tr>
      <td>${invoice.invoiceNumber}</td>
      <td>${invoice.clientName}</td>
      <td>${invoice.lineItems.length}</td>
      <td class="text-right">${formatCurrency(invoice.subtotal)}</td>
      <td class="text-right">${invoice.adjustments ? formatCurrency(invoice.adjustments) : '-'}</td>
      <td class="text-right font-bold">${formatCurrency(invoice.totalDue)}</td>
    </tr>
  `
    )
    .join('');

  const content = `
    <div class="invoice-header">
      <div>
        <h1>Bulk Invoice Summary</h1>
        <p style="color: #64748b; font-size: 11pt;">Generated: ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="text-align: right;">
        <h2 style="margin: 0; border: none; color: #2196f3;">SUMMARY REPORT</h2>
      </div>
    </div>

    <div class="invoice-info">
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.2in;">
        <div>
          <p style="font-size: 10pt; color: #64748b;">Total Invoices</p>
          <p style="font-size: 18pt; font-weight: 600; color: #1a202c;">${totalClients}</p>
        </div>
        <div>
          <p style="font-size: 10pt; color: #64748b;">Total Accounts</p>
          <p style="font-size: 18pt; font-weight: 600; color: #1a202c;">${invoices.reduce((sum, inv) => sum + inv.lineItems.length, 0)}</p>
        </div>
        <div>
          <p style="font-size: 10pt; color: #64748b;">Total Amount</p>
          <p style="font-size: 18pt; font-weight: 600; color: #10b981;">${formatCurrency(totalAmount)}</p>
        </div>
      </div>
    </div>

    <h2>Invoice Details</h2>
    <table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Client Name</th>
          <th class="text-center">Accounts</th>
          <th class="text-right">Subtotal</th>
          <th class="text-right">Adjustments</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${summaryTableHTML}
      </tbody>
      <tfoot>
        <tr class="total-row" style="background-color: #dbeafe; font-size: 12pt;">
          <td colspan="5" class="text-right"><strong>Grand Total:</strong></td>
          <td class="text-right"><strong>${formatCurrency(totalAmount)}</strong></td>
        </tr>
      </tfoot>
    </table>

    <div class="page-break"></div>

    ${invoices.map((invoice, index) => {
      const lineItemsHTML = invoice.lineItems
        .map(
          (item) => `
        <tr>
          <td>${item.accountNumber}</td>
          <td>${item.accountName}</td>
          <td>${item.feeScheduleCode}</td>
          <td class="text-right">${formatCurrency(item.averageBalance)}</td>
          <td class="text-right">${(item.feeRate * 100).toFixed(2)}%</td>
          <td class="text-right font-bold">${formatCurrency(item.finalFee)}</td>
        </tr>
      `
        )
        .join('');

      return `
        ${index > 0 ? '<div class="page-break"></div>' : ''}
        <h2>Invoice #${invoice.invoiceNumber} - ${invoice.clientName}</h2>
        <table>
          <thead>
            <tr>
              <th>Account #</th>
              <th>Account Name</th>
              <th>Fee Schedule</th>
              <th class="text-right">Avg Balance</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Fee Amount</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHTML}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="5" class="text-right">Total:</td>
              <td class="text-right">${formatCurrency(invoice.totalDue)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }).join('')}
  `;

  const html = generatePDFHTML(content, {
    title: 'Bulk Invoice Summary',
    orientation: 'portrait',
  });

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const newWindow = window.open(url, '_blank');

  if (newWindow) {
    newWindow.onload = () => {
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
    };
  }
};
