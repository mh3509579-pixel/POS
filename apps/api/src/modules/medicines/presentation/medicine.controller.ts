import { Request, Response, NextFunction } from 'express';
import { MedicineRepository } from '../infrastructure/medicine.repository.js';
import { logAudit } from '../../../infrastructure/utils/audit-logger.js';

const medicineRepo = new MedicineRepository();

export async function getAllMedicines(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string | undefined;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id as string) : undefined;

    const medicines = await medicineRepo.findAll(limit, offset, search, categoryId);
    const total = await medicineRepo.count(search, categoryId);

    res.json({ status: 'success', data: medicines, total });
  } catch (error) {
    next(error);
  }
}

export async function getMedicineById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const medicine = await medicineRepo.findById(parseInt(req.params.id));
    if (!medicine) {
      res.status(404).json({ status: 'error', message: 'Medicine not found' });
      return;
    }
    res.json({ status: 'success', data: medicine });
  } catch (error) {
    next(error);
  }
}

export async function getMedicineByBarcode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const medicine = await medicineRepo.findByBarcode(req.params.barcode);
    if (!medicine) {
      res.status(404).json({ status: 'error', message: 'Medicine not found' });
      return;
    }
    res.json({ status: 'success', data: medicine });
  } catch (error) {
    next(error);
  }
}

export async function createMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ status: 'error', message: 'Medicine name is required' });
      return;
    }

    let medicine;
    try {
      medicine = await medicineRepo.create(req.body);
    } catch (dbError: any) {
      console.error('[Create Medicine DB Error]', dbError.message, dbError.code);
      if (dbError.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ status: 'error', message: 'A medicine with this barcode already exists' });
      } else {
        res.status(500).json({ status: 'error', message: `Database error: ${dbError.message}` });
      }
      return;
    }

    try {
      await logAudit({
        user_id: (req as any).user?.userId,
        action: 'create',
        entity_type: 'medicine',
        entity_id: medicine.id,
        new_values: { name: req.body.name },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      });
    } catch { }

    res.status(201).json({ status: 'success', data: medicine });
  } catch (error) {
    console.error('[Create Medicine Error]', error);
    next(error);
  }
}

export async function updateMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existingMedicine = await medicineRepo.findById(parseInt(req.params.id));
    const medicine = await medicineRepo.update(parseInt(req.params.id), req.body);
    if (!medicine) {
      res.status(404).json({ status: 'error', message: 'Medicine not found' });
      return;
    }
    await logAudit({
      user_id: (req as any).user?.userId,
      action: 'update',
      entity_type: 'medicine',
      entity_id: medicine.id,
      old_values: existingMedicine,
      new_values: req.body,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });
    res.json({ status: 'success', data: medicine });
  } catch (error) {
    next(error);
  }
}

export async function deleteMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const medicineToDelete = await medicineRepo.findById(parseInt(req.params.id));
    const success = await medicineRepo.delete(parseInt(req.params.id));
    if (!success) {
      res.status(404).json({ status: 'error', message: 'Medicine not found' });
      return;
    }
    await logAudit({
      user_id: (req as any).user?.userId,
      action: 'delete',
      entity_type: 'medicine',
      entity_id: parseInt(req.params.id),
      old_values: medicineToDelete,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });
    res.json({ status: 'success', message: 'Medicine deleted' });
  } catch (error) {
    next(error);
  }
}

// Batch endpoints
export async function getMedicineBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const batches = await medicineRepo.findBatchesByMedicine(parseInt(req.params.id));
    res.json({ status: 'success', data: batches });
  } catch (error) {
    next(error);
  }
}

export async function createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { batch_number, expiry_date, purchase_price, sale_price, quantity } = req.body;

    if (!batch_number || !expiry_date || purchase_price === undefined || sale_price === undefined || quantity === undefined) {
      res.status(400).json({ status: 'error', message: 'Missing required batch fields' });
      return;
    }

    const batch = await medicineRepo.createBatch(parseInt(req.params.id), req.body);
    res.status(201).json({ status: 'success', data: batch });
  } catch (error) {
    next(error);
  }
}

export async function updateBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const batch = await medicineRepo.updateBatch(parseInt(req.params.batchId), req.body);
    if (!batch) {
      res.status(404).json({ status: 'error', message: 'Batch not found' });
      return;
    }
    res.json({ status: 'success', data: batch });
  } catch (error) {
    next(error);
  }
}

// Stock queries
export async function getExpiringBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const days = parseInt(req.query.days as string) || 90;
    const batches = await medicineRepo.getExpiringBatches(days);
    res.json({ status: 'success', data: batches });
  } catch (error) {
    next(error);
  }
}

export async function getLowStockMedicines(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const medicines = await medicineRepo.getLowStockMedicines();
    res.json({ status: 'success', data: medicines });
  } catch (error) {
    next(error);
  }
}

// Lookups
export async function getAllCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await medicineRepo.getAllCategories();
    res.json({ status: 'success', data: categories });
  } catch (error) {
    next(error);
  }
}

export async function getAllManufacturers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const manufacturers = await medicineRepo.getAllManufacturers();
    res.json({ status: 'success', data: manufacturers });
  } catch (error) {
    next(error);
  }
}

export async function getAllUnits(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const units = await medicineRepo.getAllUnits();
    res.json({ status: 'success', data: units });
  } catch (error) {
    next(error);
  }
}

export async function searchForPOS(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const term = req.query.q as string;
    if (!term) {
      res.json({ status: 'success', data: [] });
      return;
    }
    const medicines = await medicineRepo.searchForPOS(term);
    res.json({ status: 'success', data: medicines });
  } catch (error) {
    next(error);
  }
}

export async function updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const medicineId = parseInt(req.params.id);
    const { quantity_change } = req.body;

    if (quantity_change === undefined || !Number.isInteger(quantity_change)) {
      res.status(400).json({ status: 'error', message: 'quantity_change must be an integer' });
      return;
    }

    const medicine = await medicineRepo.findById(medicineId);
    if (!medicine) {
      res.status(404).json({ status: 'error', message: 'Medicine not found' });
      return;
    }

    const newStock = (medicine.total_stock || 0) + quantity_change;
    if (newStock < 0) {
      res.status(400).json({ status: 'error', message: 'Insufficient stock' });
      return;
    }

    await medicineRepo.updateStock(medicineId, quantity_change);
    const updated = await medicineRepo.findById(medicineId);
    res.json({ status: 'success', data: updated });
  } catch (error) {
    next(error);
  }
}
