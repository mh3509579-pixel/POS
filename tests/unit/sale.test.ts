import { describe, it, expect } from 'vitest';

interface SaleItem {
  medicine_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
}

function calculateSaleTotal(items: SaleItem[], taxRate: number = 0.05) {
  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const itemDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const taxable = subtotal - itemDiscount;
  const tax = taxable * taxRate;
  const total = taxable + tax;

  return {
    subtotal,
    discount: itemDiscount,
    tax,
    total,
  };
}

describe('Sale Calculations', () => {
  it('should calculate sale total correctly', () => {
    const items: SaleItem[] = [
      { medicine_id: 1, quantity: 2, unit_price: 50, discount: 0 },
      { medicine_id: 2, quantity: 1, unit_price: 120, discount: 10 },
    ];

    const result = calculateSaleTotal(items);

    expect(result.subtotal).toBe(220);
    expect(result.discount).toBe(10);
    expect(result.tax).toBe(10.5);
    expect(result.total).toBe(220.5);
  });

  it('should handle empty cart', () => {
    const items: SaleItem[] = [];
    const result = calculateSaleTotal(items);

    expect(result.subtotal).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(0);
  });

  it('should apply custom tax rate', () => {
    const items: SaleItem[] = [
      { medicine_id: 1, quantity: 1, unit_price: 100, discount: 0 },
    ];

    const result = calculateSaleTotal(items, 0.1);

    expect(result.tax).toBe(10);
    expect(result.total).toBe(110);
  });
});
