export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customer: {
    name: string;
    phone?: string;
    address?: string;
  };
  cashier: string;
  items: {
    name: string;
    batch: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const itemsHTML = data.items
    .map(
      (item) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.batch}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">₨ ${item.unitPrice.toFixed(2)}</td>
      <td class="text-right">₨ ${item.discount.toFixed(2)}</td>
      <td class="text-right">₨ ${item.total.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #333; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 15px; margin-bottom: 20px; }
    .header h1 { color: #1a365d; font-size: 24px; margin-bottom: 5px; }
    .header h2 { color: #2d6a4f; font-size: 14px; font-weight: normal; }
    .header p { color: #666; font-size: 11px; margin-top: 5px; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .invoice-info div { flex: 1; }
    .invoice-info .label { font-weight: bold; color: #1a365d; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #1a365d; color: white; padding: 8px; text-align: left; font-size: 11px; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals { float: right; width: 250px; }
    .totals .row { display: flex; justify-content: space-between; padding: 5px 0; }
    .totals .row.total { border-top: 2px solid #1a365d; font-weight: bold; font-size: 14px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #666; font-size: 10px; }
    .payment-info { background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 15px; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>Hussain Son's Pharmacy</h1>
      <h2>POS & Management System</h2>
      <p>Pharmacy Address, City, Pakistan | Phone: +92-XXX-XXXXXXX</p>
    </div>

    <div class="invoice-info">
      <div>
        <p><span class="label">Invoice #:</span> ${data.invoiceNumber}</p>
        <p><span class="label">Date:</span> ${new Date(data.date).toLocaleDateString('en-PK')}</p>
      </div>
      <div>
        <p><span class="label">Customer:</span> ${data.customer.name}</p>
        ${data.customer.phone ? `<p><span class="label">Phone:</span> ${data.customer.phone}</p>` : ''}
      </div>
      <div>
        <p><span class="label">Cashier:</span> ${data.cashier}</p>
        <p><span class="label">Payment:</span> ${data.paymentMethod.toUpperCase()}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Batch</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Price</th>
          <th class="text-right">Discount</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <div class="totals">
      <div class="row">
        <span>Subtotal:</span>
        <span>₨ ${data.subtotal.toFixed(2)}</span>
      </div>
      <div class="row">
        <span>Discount:</span>
        <span>- ₨ ${data.discount.toFixed(2)}</span>
      </div>
      <div class="row">
        <span>Tax (5%):</span>
        <span>₨ ${data.tax.toFixed(2)}</span>
      </div>
      <div class="row total">
        <span>Total:</span>
        <span>₨ ${data.total.toFixed(2)}</span>
      </div>
    </div>

    <div class="payment-info">
      <p><span class="label">Amount Paid:</span> ₨ ${data.amountPaid.toFixed(2)}</p>
      <p><span class="label">Change:</span> ₨ ${data.change.toFixed(2)}</p>
    </div>

    <div class="footer">
      <p>Thank you for your purchase!</p>
      <p>Hussain Son's Pharmacy - Your Health, Our Priority</p>
      <p>This is a computer-generated invoice.</p>
    </div>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #1a365d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
      Print Invoice
    </button>
    <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
      Close
    </button>
  </div>
</body>
</html>
  `;
}

export function printInvoice(data: InvoiceData): void {
  const invoiceHTML = generateInvoiceHTML(data);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  }
}

export function generateThermalReceipt(data: InvoiceData): string {
  const items = data.items
    .map(
      (item) => `${item.name}
${item.quantity} x ₨${item.unitPrice.toFixed(2)}  ₨${item.total.toFixed(2)}`
    )
    .join('\n');

  return `
================================
    HUSSAIN SON'S PHARMACY
================================
Invoice: ${data.invoiceNumber}
Date: ${new Date(data.date).toLocaleDateString('en-PK')}
Cashier: ${data.cashier}
--------------------------------
${items}
--------------------------------
Subtotal:     ₨ ${data.subtotal.toFixed(2)}
Discount:    -₨ ${data.discount.toFixed(2)}
Tax:          ₨ ${data.tax.toFixed(2)}
TOTAL:        ₨ ${data.total.toFixed(2)}
--------------------------------
Payment: ${data.paymentMethod.toUpperCase()}
Paid:    ₨ ${data.amountPaid.toFixed(2)}
Change:  ₨ ${data.change.toFixed(2)}
================================
    Thank you for your purchase!
================================
  `;
}
