import { Request, Response, NextFunction } from 'express';
import { SupplierRepository } from '../infrastructure/supplier.repository.js';

const supplierRepo = new SupplierRepository();

export async function getAllSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string | undefined;
    const type = req.query.type as string | undefined;

    const suppliers = await supplierRepo.findAll(limit, offset, search, type);
    const total = await supplierRepo.count(search, type);

    res.json({ status: 'success', data: suppliers, total });
  } catch (error) {
    next(error);
  }
}

export async function getSupplierById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const supplier = await supplierRepo.findById(parseInt(req.params.id));
    if (!supplier) {
      res.status(404).json({ status: 'error', message: 'Supplier not found' });
      return;
    }
    res.json({ status: 'success', data: supplier });
  } catch (error) {
    next(error);
  }
}

export async function createSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ status: 'error', message: 'Supplier name is required' });
      return;
    }

    const supplier = await supplierRepo.create(req.body);
    res.status(201).json({ status: 'success', data: supplier });
  } catch (error) {
    next(error);
  }
}

export async function updateSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const supplier = await supplierRepo.update(parseInt(req.params.id), req.body);
    if (!supplier) {
      res.status(404).json({ status: 'error', message: 'Supplier not found' });
      return;
    }
    res.json({ status: 'success', data: supplier });
  } catch (error) {
    next(error);
  }
}

export async function deleteSupplier(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const success = await supplierRepo.delete(parseInt(req.params.id));
    if (!success) {
      res.status(404).json({ status: 'error', message: 'Supplier not found' });
      return;
    }
    res.json({ status: 'success', message: 'Supplier deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getTopSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const suppliers = await supplierRepo.getTopSuppliers(limit);
    res.json({ status: 'success', data: suppliers });
  } catch (error) {
    next(error);
  }
}

export async function getSupplierStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await supplierRepo.getSupplierStats();
    res.json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
}
