import { Request, Response, NextFunction } from 'express';
import { SupplierRepository } from '../infrastructure/supplier.repository.js';
import { parsePagination } from '../../../infrastructure/utils/pagination.js';

const supplierRepo = new SupplierRepository();

export async function getAllSuppliers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { limit, offset } = parsePagination(req.query.limit, req.query.offset);
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
    const { limit } = parsePagination(req.query.limit, undefined, { limit: 10 });
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
