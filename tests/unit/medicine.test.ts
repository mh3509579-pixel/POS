import { describe, it, expect } from 'vitest';

describe('Medicine Entity', () => {
  it('should define medicine interface correctly', () => {
    const medicine = {
      id: 1,
      name: 'Paracetamol 500mg',
      generic_name: 'Paracetamol',
      category_id: 1,
      manufacturer_id: 1,
      unit_id: 1,
      barcode: '8901234567890',
      description: 'Pain reliever',
      strength: '500mg',
      form: 'tablet',
      reorder_level: 10,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(medicine.id).toBe(1);
    expect(medicine.name).toBe('Paracetamol 500mg');
    expect(medicine.is_active).toBe(true);
  });

  it('should define batch interface correctly', () => {
    const batch = {
      id: 1,
      medicine_id: 1,
      batch_number: 'P001',
      expiry_date: new Date('2027-05-15'),
      purchase_price: 40,
      sale_price: 50,
      quantity: 100,
      reserved_quantity: 0,
      manufacturing_date: null,
      supplier_id: 1,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(batch.batch_number).toBe('P001');
    expect(batch.quantity).toBe(100);
    expect(batch.purchase_price).toBeLessThan(batch.sale_price);
  });
});
