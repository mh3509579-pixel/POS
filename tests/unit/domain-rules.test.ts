import { describe, it, expect } from 'vitest';
import {
  validateSaleDTO,
  calculateSaleTotal,
  calculatePaymentStatus,
  round2,
  ValidationError,
} from '../../apps/api/src/modules/sales/domain/sale.rules';
import { validatePurchaseDTO } from '../../apps/api/src/modules/purchases/domain/purchase.rules';

const futureDate = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const saleItem = (overrides: Record<string, unknown> = {}) => ({
  medicine_id: 1,
  quantity: 2,
  unit_price: 100,
  ...overrides,
});

describe('validateSaleDTO', () => {
  it('rejects a payload with no items', () => {
    expect(() => validateSaleDTO({ items: [], payment_method: 'cash' } as any)).toThrow(ValidationError);
  });

  it('rejects a missing body', () => {
    expect(() => validateSaleDTO(undefined as any)).toThrow(ValidationError);
  });

  it('rejects an unknown payment method', () => {
    expect(() =>
      validateSaleDTO({ items: [saleItem()], payment_method: 'barter' } as any)
    ).toThrow(/payment_method/);
  });

  // The core money bug: negative quantities previously produced a negative
  // line total, so a "sale" could pay out the shop.
  it('rejects a negative quantity', () => {
    expect(() =>
      validateSaleDTO({
        items: [saleItem({ quantity: -5 })],
        payment_method: 'cash',
        amount_paid: 0,
      } as any)
    ).toThrow(/greater than zero/);
  });

  it('rejects a fractional quantity', () => {
    expect(() =>
      validateSaleDTO({
        items: [saleItem({ quantity: 1.5 })],
        payment_method: 'cash',
        amount_paid: 1000,
      } as any)
    ).toThrow(/whole number/);
  });

  it('rejects a negative unit price', () => {
    expect(() =>
      validateSaleDTO({
        items: [saleItem({ unit_price: -10 })],
        payment_method: 'cash',
        amount_paid: 1000,
      } as any)
    ).toThrow(/cannot be negative/);
  });

  it('rejects a negative tax rate', () => {
    expect(() =>
      validateSaleDTO({
        items: [saleItem()],
        payment_method: 'cash',
        tax_rate: -0.1,
        amount_paid: 1000,
      } as any)
    ).toThrow(/tax_rate/);
  });

  it('rejects a tax rate above 1 (100%)', () => {
    expect(() =>
      validateSaleDTO({
        items: [saleItem()],
        payment_method: 'cash',
        tax_rate: 1.5,
        amount_paid: 1000,
      } as any)
    ).toThrow(/tax_rate/);
  });

  it('rejects a discount larger than the subtotal', () => {
    expect(() =>
      validateSaleDTO({
        items: [saleItem()],
        payment_method: 'cash',
        discount: 500,
        amount_paid: 1000,
      } as any)
    ).toThrow(/cannot exceed the subtotal/);
  });

  it('rejects an underpaid cash sale', () => {
    expect(() =>
      validateSaleDTO({
        items: [saleItem()],
        payment_method: 'cash',
        tax_rate: 0,
        amount_paid: 10,
      } as any)
    ).toThrow(/less than the total/);
  });

  // Credit sales are the legitimate case where amount_paid < total.
  it('accepts a credit sale with no immediate payment', () => {
    const result = validateSaleDTO({
      items: [saleItem()],
      payment_method: 'credit',
      tax_rate: 0,
      amount_paid: 0,
    } as any);

    expect(result.payment_method).toBe('credit');
  });

  it('accepts DECIMAL strings coming from MySQL', () => {
    const result = validateSaleDTO({
      items: [{ medicine_id: '1', quantity: '2', unit_price: '100.50' }],
      payment_method: 'cash',
      tax_rate: '0',
      amount_paid: '201',
    } as any);

    expect(result.items[0].unit_price).toBe(100.5);
    expect(result.items[0].quantity).toBe(2);
  });

  it('caps absurd item counts', () => {
    const items = Array.from({ length: 501 }, () => saleItem());
    expect(() =>
      validateSaleDTO({ items, payment_method: 'cash', amount_paid: 1e9 } as any)
    ).toThrow(/more than 500 items/);
  });

  it('defaults tax_rate to 0.05 and rounds amount_paid', () => {
    const result = validateSaleDTO({
      items: [saleItem()],
      payment_method: 'cash',
      amount_paid: 210.005,
    } as any);

    expect(result.tax_rate).toBe(0.05);
    expect(result.amount_paid).toBe(210.01);
  });
});

describe('validatePurchaseDTO', () => {
  const purchaseItem = (overrides: Record<string, unknown> = {}) => ({
    medicine_id: 1,
    quantity: 10,
    unit_price: 50,
    sale_price: 80,
    batch_number: 'B-1',
    expiry_date: futureDate(180),
    ...overrides,
  });

  it('rejects a negative purchase quantity', () => {
    expect(() =>
      validatePurchaseDTO({
        supplier_id: 1,
        items: [purchaseItem({ quantity: -10 })],
      } as any)
    ).toThrow(/greater than zero/);
  });

  it('rejects a negative purchase price', () => {
    expect(() =>
      validatePurchaseDTO({
        supplier_id: 1,
        items: [purchaseItem({ unit_price: -1 })],
      } as any)
    ).toThrow(/cannot be negative/);
  });

  // Receiving already-expired stock is never valid.
  it('rejects an expiry date in the past', () => {
    expect(() =>
      validatePurchaseDTO({
        supplier_id: 1,
        items: [purchaseItem({ expiry_date: futureDate(-30) })],
      } as any)
    ).toThrow(/must not be in the past/);
  });

  it('rejects a missing expiry date', () => {
    expect(() =>
      validatePurchaseDTO({
        supplier_id: 1,
        items: [purchaseItem({ expiry_date: undefined })],
      } as any)
    ).toThrow(/expiry_date is required/);
  });

  // purchase_items.batch_number is NOT NULL in the schema.
  it('rejects a missing batch number', () => {
    expect(() =>
      validatePurchaseDTO({
        supplier_id: 1,
        items: [purchaseItem({ batch_number: '' })],
      } as any)
    ).toThrow(/batch_number is required/);
  });

  it('rejects an invalid supplier id', () => {
    expect(() =>
      validatePurchaseDTO({ supplier_id: 0, items: [purchaseItem()] } as any)
    ).toThrow(/supplier_id/);
  });

  it('rejects an over-large discount', () => {
    expect(() =>
      validatePurchaseDTO({
        supplier_id: 1,
        items: [purchaseItem()],
        discount: 99999,
      } as any)
    ).toThrow(/cannot exceed the subtotal/);
  });

  it('accepts a well-formed purchase and defaults tax_rate to 0', () => {
    const result = validatePurchaseDTO({ supplier_id: 1, items: [purchaseItem()] } as any);

    expect(result.tax_rate).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.items[0].batch_number).toBe('B-1');
  });
});

describe('sale total arithmetic', () => {
  it('subtracts the discount before applying tax', () => {
    // 200 - 20 = 180 taxable, +5% = 9 tax, total 189
    expect(calculateSaleTotal(200, 20, 0.05)).toBe(189);
  });

  it('handles a zero tax rate', () => {
    expect(calculateSaleTotal(100, 10, 0)).toBe(90);
  });

  it('rounds to 2dp without floating point drift', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(calculateSaleTotal(0.07, 0, 0.1)).toBe(0.08);
  });

  it('classifies payment status', () => {
    expect(calculatePaymentStatus(100, 100)).toBe('paid');
    expect(calculatePaymentStatus(150, 100)).toBe('paid');
    expect(calculatePaymentStatus(40, 100)).toBe('partial');
    expect(calculatePaymentStatus(0, 100)).toBe('unpaid');
  });
});