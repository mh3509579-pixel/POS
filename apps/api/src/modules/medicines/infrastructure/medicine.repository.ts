import {
  Medicine, MedicineWithDetails, CreateMedicineDTO, UpdateMedicineDTO,
  MedicineBatch, CreateBatchDTO, UpdateBatchDTO,
  MedicineCategory, Manufacturer, MedicineUnit,
} from '../domain/medicine.entity.js';
import { query, queryOne, execute } from '../../../infrastructure/database/connection.js';

export class MedicineRepository {
  // ===================== MEDICINES =====================
  async findById(id: number): Promise<MedicineWithDetails | null> {
    const medicine = await queryOne<Medicine>('SELECT * FROM medicines WHERE id = ?', [id]);
    if (!medicine) return null;

    return this.enrichMedicine(medicine);
  }

  async findByBarcode(barcode: string): Promise<MedicineWithDetails | null> {
    const medicine = await queryOne<Medicine>('SELECT * FROM medicines WHERE barcode = ?', [barcode]);
    if (!medicine) return null;

    return this.enrichMedicine(medicine);
  }

  async findAll(limit: number = 100, offset: number = 0, search?: string, categoryId?: number): Promise<MedicineWithDetails[]> {
    let sql = 'SELECT * FROM medicines WHERE is_active = TRUE';
    const params: any[] = [];

    if (search) {
      sql += ' AND (name LIKE ? OR generic_name LIKE ? OR barcode LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }

    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const medicines = await query<Medicine[]>(sql, params);
    const enriched: MedicineWithDetails[] = [];

    for (const med of medicines) {
      enriched.push(await this.enrichMedicine(med));
    }

    return enriched;
  }

  async count(search?: string, categoryId?: number): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM medicines WHERE is_active = TRUE';
    const params: any[] = [];

    if (search) {
      sql += ' AND (name LIKE ? OR generic_name LIKE ? OR barcode LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (categoryId) {
      sql += ' AND category_id = ?';
      params.push(categoryId);
    }

    const result = await queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  async create(data: CreateMedicineDTO): Promise<MedicineWithDetails> {
    const result = await execute(
      `INSERT INTO medicines (name, generic_name, category_id, manufacturer_id, unit_id, barcode, description, strength, form, reorder_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name, data.generic_name || null, data.category_id || null,
        data.manufacturer_id || null, data.unit_id || null, data.barcode || null,
        data.description || null, data.strength || null, data.form || null,
        data.reorder_level || 0,
      ]
    );

    return this.findById(result.insertId) as Promise<MedicineWithDetails>;
  }

  async update(id: number, data: UpdateMedicineDTO): Promise<MedicineWithDetails | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.generic_name !== undefined) { fields.push('generic_name = ?'); values.push(data.generic_name); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); values.push(data.category_id); }
    if (data.manufacturer_id !== undefined) { fields.push('manufacturer_id = ?'); values.push(data.manufacturer_id); }
    if (data.unit_id !== undefined) { fields.push('unit_id = ?'); values.push(data.unit_id); }
    if (data.barcode !== undefined) { fields.push('barcode = ?'); values.push(data.barcode); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.strength !== undefined) { fields.push('strength = ?'); values.push(data.strength); }
    if (data.form !== undefined) { fields.push('form = ?'); values.push(data.form); }
    if (data.reorder_level !== undefined) { fields.push('reorder_level = ?'); values.push(data.reorder_level); }
    if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await execute(`UPDATE medicines SET ${fields.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await execute('UPDATE medicines SET is_active = FALSE WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  // ===================== BATCHES =====================
  async findBatchById(id: number): Promise<MedicineBatch | null> {
    return queryOne<MedicineBatch>('SELECT * FROM medicine_batches WHERE id = ?', [id]);
  }

  async findBatchesByMedicine(medicineId: number): Promise<MedicineBatch[]> {
    return query<MedicineBatch[]>(
      'SELECT * FROM medicine_batches WHERE medicine_id = ? AND is_active = TRUE ORDER BY expiry_date ASC',
      [medicineId]
    );
  }

  async findBatchByNumber(medicineId: number, batchNumber: string): Promise<MedicineBatch | null> {
    return queryOne<MedicineBatch>(
      'SELECT * FROM medicine_batches WHERE medicine_id = ? AND batch_number = ?',
      [medicineId, batchNumber]
    );
  }

  async createBatch(medicineId: number, data: CreateBatchDTO): Promise<MedicineBatch> {
    const result = await execute(
      `INSERT INTO medicine_batches (medicine_id, batch_number, expiry_date, purchase_price, sale_price, quantity, manufacturing_date, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medicineId, data.batch_number, data.expiry_date,
        data.purchase_price, data.sale_price, data.quantity,
        data.manufacturing_date || null, data.supplier_id || null,
      ]
    );

    return this.findBatchById(result.insertId) as Promise<MedicineBatch>;
  }

  async updateBatch(id: number, data: UpdateBatchDTO): Promise<MedicineBatch | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.expiry_date !== undefined) { fields.push('expiry_date = ?'); values.push(data.expiry_date); }
    if (data.purchase_price !== undefined) { fields.push('purchase_price = ?'); values.push(data.purchase_price); }
    if (data.sale_price !== undefined) { fields.push('sale_price = ?'); values.push(data.sale_price); }
    if (data.quantity !== undefined) { fields.push('quantity = ?'); values.push(data.quantity); }

    if (fields.length === 0) return this.findBatchById(id);

    values.push(id);
    await execute(`UPDATE medicine_batches SET ${fields.join(', ')} WHERE id = ?`, values);

    return this.findBatchById(id);
  }

  async reduceBatchStock(batchId: number, quantity: number): Promise<boolean> {
    const result = await execute(
      'UPDATE medicine_batches SET quantity = quantity - ? WHERE id = ? AND quantity >= ?',
      [quantity, batchId, quantity]
    );
    return result.affectedRows > 0;
  }

  async increaseBatchStock(batchId: number, quantity: number): Promise<boolean> {
    const result = await execute(
      'UPDATE medicine_batches SET quantity = quantity + ? WHERE id = ?',
      [quantity, batchId]
    );
    return result.affectedRows > 0;
  }

  async getExpiringBatches(days: number = 90): Promise<(MedicineBatch & { medicine_name: string })[]> {
    return query<(MedicineBatch & { medicine_name: string })[]>(
      `SELECT mb.*, m.name as medicine_name
       FROM medicine_batches mb
       INNER JOIN medicines m ON mb.medicine_id = m.id
       WHERE mb.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
         AND mb.expiry_date >= CURDATE()
         AND mb.is_active = TRUE
         AND mb.quantity > 0
       ORDER BY mb.expiry_date ASC`,
      [days]
    );
  }

  async getLowStockMedicines(): Promise<MedicineWithDetails[]> {
    const medicines = await query<Medicine[]>(
      `SELECT m.* FROM medicines m
       INNER JOIN (
         SELECT medicine_id, SUM(quantity) as total_stock
         FROM medicine_batches
         WHERE is_active = TRUE
         GROUP BY medicine_id
       ) mb ON m.id = mb.medicine_id
       WHERE mb.total_stock <= m.reorder_level
         AND m.is_active = TRUE
       ORDER BY mb.total_stock ASC`
    );

    const enriched: MedicineWithDetails[] = [];
    for (const med of medicines) {
      enriched.push(await this.enrichMedicine(med));
    }
    return enriched;
  }

  // ===================== HELPERS =====================
  private async enrichMedicine(medicine: Medicine): Promise<MedicineWithDetails> {
    const category = medicine.category_id
      ? await queryOne<MedicineCategory>('SELECT name FROM medicine_categories WHERE id = ?', [medicine.category_id])
      : null;

    const manufacturer = medicine.manufacturer_id
      ? await queryOne<Manufacturer>('SELECT name FROM manufacturers WHERE id = ?', [medicine.manufacturer_id])
      : null;

    const unit = medicine.unit_id
      ? await queryOne<MedicineUnit>('SELECT name FROM medicine_units WHERE id = ?', [medicine.unit_id])
      : null;

    const batches = await this.findBatchesByMedicine(medicine.id);
    const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);

    return {
      ...medicine,
      category_name: category?.name || null,
      manufacturer_name: manufacturer?.name || null,
      unit_name: unit?.name || null,
      total_stock: totalStock,
      batches,
    };
  }

  // ===================== LOOKUPS =====================
  async getAllCategories(): Promise<MedicineCategory[]> {
    return query<MedicineCategory[]>('SELECT * FROM medicine_categories WHERE is_active = TRUE ORDER BY name');
  }

  async getAllManufacturers(): Promise<Manufacturer[]> {
    return query<Manufacturer[]>('SELECT * FROM manufacturers WHERE is_active = TRUE ORDER BY name');
  }

  async getAllUnits(): Promise<MedicineUnit[]> {
    return query<MedicineUnit[]>('SELECT * FROM medicine_units ORDER BY name');
  }

  async searchForPOS(term: string): Promise<MedicineWithDetails[]> {
    const medicines = await query<Medicine[]>(
      `SELECT * FROM medicines
       WHERE is_active = TRUE AND (name LIKE ? OR generic_name LIKE ? OR barcode LIKE ?)
       ORDER BY name ASC LIMIT 20`,
      [`%${term}%`, `%${term}%`, `%${term}%`]
    );

    const enriched: MedicineWithDetails[] = [];
    for (const med of medicines) {
      enriched.push(await this.enrichMedicine(med));
    }
    return enriched;
  }
}
