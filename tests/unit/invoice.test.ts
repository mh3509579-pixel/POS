import { describe, it, expect } from 'vitest';
import { generateInvoiceHTML, InvoiceData } from '../../apps/web/src/utils/invoice';

describe('Invoice Generation', () => {
  const mockInvoiceData: InvoiceData = {
    invoiceNumber: 'INV-2026-000001',
    date: '2026-09-15T10:30:00',
    customer: {
      name: 'Ahmed Khan',
      phone: '0321-1234567',
    },
    cashier: 'Cashier',
    items: [
      {
        name: 'Paracetamol 500mg',
        batch: 'P001',
        quantity: 2,
        unitPrice: 50,
        discount: 0,
        total: 100,
      },
      {
        name: 'Amoxicillin 500mg',
        batch: 'A001',
        quantity: 1,
        unitPrice: 120,
        discount: 10,
        total: 110,
      },
    ],
    subtotal: 210,
    discount: 10,
    tax: 10,
    total: 210,
    paymentMethod: 'cash',
    amountPaid: 250,
    change: 40,
  };

  it('should generate invoice HTML', () => {
    const html = generateInvoiceHTML(mockInvoiceData);
    expect(html).toContain('INV-2026-000001');
    expect(html).toContain('Ahmed Khan');
    expect(html).toContain('Paracetamol 500mg');
    expect(html).toContain('210.00');
  });

  it('should include all required sections', () => {
    const html = generateInvoiceHTML(mockInvoiceData);
    expect(html).toContain('Hussain Son');
    expect(html).toContain('Invoice');
    expect(html).toContain('Customer');
    expect(html).toContain('Cashier');
    expect(html).toContain('Subtotal');
    expect(html).toContain('Total');
  });
});
