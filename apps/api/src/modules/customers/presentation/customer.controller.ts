import { Request, Response, NextFunction } from 'express';
import { CustomerRepository } from '../infrastructure/customer.repository.js';
import { logAudit } from '../../../infrastructure/utils/audit-logger.js';

const customerRepo = new CustomerRepository();

export async function getAllCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string | undefined;
    const type = req.query.type as string | undefined;

    const customers = await customerRepo.findAll(limit, offset, search, type);
    const total = await customerRepo.count(search, type);

    res.json({ status: 'success', data: customers, total });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = await customerRepo.findById(parseInt(req.params.id));
    if (!customer) {
      res.status(404).json({ status: 'error', message: 'Customer not found' });
      return;
    }
    res.json({ status: 'success', data: customer });
  } catch (error) {
    next(error);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ status: 'error', message: 'Customer name is required' });
      return;
    }

    const customer = await customerRepo.create(req.body);
    await logAudit({
      user_id: (req as any).user?.userId,
      action: 'create',
      entity_type: 'customer',
      entity_id: customer.id,
      new_values: req.body,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });
    res.status(201).json({ status: 'success', data: customer });
  } catch (error) {
    next(error);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const existingCustomer = await customerRepo.findById(parseInt(req.params.id));
    const customer = await customerRepo.update(parseInt(req.params.id), req.body);
    if (!customer) {
      res.status(404).json({ status: 'error', message: 'Customer not found' });
      return;
    }
    await logAudit({
      user_id: (req as any).user?.userId,
      action: 'update',
      entity_type: 'customer',
      entity_id: customer.id,
      old_values: existingCustomer,
      new_values: req.body,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });
    res.json({ status: 'success', data: customer });
  } catch (error) {
    next(error);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customerToDelete = await customerRepo.findById(parseInt(req.params.id));
    const success = await customerRepo.delete(parseInt(req.params.id));
    if (!success) {
      res.status(404).json({ status: 'error', message: 'Customer not found' });
      return;
    }
    await logAudit({
      user_id: (req as any).user?.userId,
      action: 'delete',
      entity_type: 'customer',
      entity_id: parseInt(req.params.id),
      old_values: customerToDelete,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
    });
    res.json({ status: 'success', message: 'Customer deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getTopCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const customers = await customerRepo.getTopCustomers(limit);
    res.json({ status: 'success', data: customers });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await customerRepo.getCustomerStats();
    res.json({ status: 'success', data: stats });
  } catch (error) {
    next(error);
  }
}
