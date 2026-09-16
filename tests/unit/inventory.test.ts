import { describe, it, expect } from 'vitest';

interface Batch {
  id: number;
  quantity: number;
  expiry_date: Date;
}

function getTotalStock(batches: Batch[]): number {
  return batches.reduce((sum, batch) => sum + batch.quantity, 0);
}

function getExpiringBatches(batches: Batch[], days: number): Batch[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  return batches.filter((batch) => {
    const expiry = new Date(batch.expiry_date);
    return expiry <= cutoff && expiry >= new Date();
  });
}

function getExpiredBatches(batches: Batch[]): Batch[] {
  const now = new Date();
  return batches.filter((batch) => new Date(batch.expiry_date) < now);
}

describe('Inventory Calculations', () => {
  const batches: Batch[] = [
    { id: 1, quantity: 100, expiry_date: new Date('2027-05-15') },
    { id: 2, quantity: 50, expiry_date: new Date('2027-10-15') },
    { id: 3, quantity: 0, expiry_date: new Date('2025-01-01') },
  ];

  it('should calculate total stock correctly', () => {
    const total = getTotalStock(batches);
    expect(total).toBe(150);
  });

  it('should find expiring batches within 30 days', () => {
    const allBatches: Batch[] = [
      { id: 1, quantity: 100, expiry_date: new Date('2027-05-15') },
      { id: 2, quantity: 50, expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
    ];
    const expiring = getExpiringBatches(allBatches, 30);
    expect(expiring.length).toBe(1);
    expect(expiring[0].id).toBe(2);
  });

  it('should find expired batches', () => {
    const expired = getExpiredBatches(batches);
    expect(expired.length).toBe(1);
    expect(expired[0].id).toBe(3);
  });

  it('should handle empty batches', () => {
    expect(getTotalStock([])).toBe(0);
    expect(getExpiringBatches([], 30)).toHaveLength(0);
    expect(getExpiredBatches([])).toHaveLength(0);
  });
});
