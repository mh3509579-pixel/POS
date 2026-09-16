import { Request, Response, NextFunction } from 'express';
import { MedicineRepository } from '../infrastructure/medicine.repository.js';

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

    const medicine = await medicineRepo.create(req.body);
    res.status(201).json({ status: 'success', data: medicine });
  } catch (error) {
    next(error);
  }
}

export async function updateMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const medicine = await medicineRepo.update(parseInt(req.params.id), req.body);
    if (!medicine) {
      res.status(404).json({ status: 'error', message: 'Medicine not found' });
      return;
    }
    res.json({ status: 'success', data: medicine });
  } catch (error) {
    next(error);
  }
}

export async function deleteMedicine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const success = await medicineRepo.delete(parseInt(req.params.id));
    if (!success) {
      res.status(404).json({ status: 'error', message: 'Medicine not found' });
      return;
    }
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
