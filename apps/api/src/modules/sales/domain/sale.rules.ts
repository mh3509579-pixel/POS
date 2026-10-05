import { CreateSaleDTO, CreateSaleItemDTO } from './sale.entity.js';

export class ValidationError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends Error {
  readonly statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export const VALID_PAYMENT_METHODS = ['cash', 'card', 'credit'] as const;
export type PaymentMethod = (typeof VALID_PAYMENT_METHODS)[number];

export const MAX_TAX_RATE = 1;

function toNumber(value: unknown, field: string): number {
  const n = typeof value === 'string' ? Number(value.trim()) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    throw new ValidationError(`${field} must be a valid number`);
  }
  return n;
}

function toPositiveInt(value: unknown, field: string): number {
  const n = toNumber(value, field);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError(`${field} must be a whole number greater than zero`);
  }
  return n;
}

/**
 * Validates an incoming sale payload. Every business invariant that must never
 * be violated (Agent.md section 41) is enforced here, server-side, before any
 * database write happens.
 */
export function validateSaleDTO(input: Partial<CreateSaleDTO>): CreateSaleDTO {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Request body is required');
  }

  const { items, payment_method, customer_id } = input;

  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('At least one sale item is required');
  }

  if (items.length > 500) {
    throw new ValidationError('A sale cannot contain more than 500 items');
  }

  if (!payment_method || !VALID_PAYMENT_METHODS.includes(payment_method as PaymentMethod)) {
    throw new ValidationError(
      `payment_method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`
    );
  }

  if (customer_id !== undefined && customer_id !== null) {
    const id = toPositiveInt(customer_id, 'customer_id');
    if (!Number.isSafeInteger(id)) {
      throw new ValidationError('customer_id must be a valid identifier');
    }
  }

  const validatedItems: CreateSaleItemDTO[] = items.map((raw: any, index: number) => {
    const position = `items[${index}]`;
    if (!raw || typeof raw !== 'object') {
      throw new ValidationError(`${position} must be an object`);
    }

    const medicineId = toPositiveInt(raw.medicine_id, `${position}.medicine_id`);
    const quantity = toPositiveInt(raw.quantity, `${position}.quantity`);
    const unitPrice = toNumber(raw.unit_price, `${position}.unit_price`);

    if (unitPrice < 0) {
      throw new ValidationError(`${position}.unit_price cannot be negative`);
    }

    const lineMax = unitPrice * quantity;
    const discount = raw.discount === undefined || raw.discount === null ? 0 : toNumber(raw.discount, `${position}.discount`);

    if (discount < 0) {
      throw new ValidationError(`${position}.discount cannot be negative`);
    }
    if (discount > lineMax) {
      throw new ValidationError(
        `${position}.discount (${discount}) cannot exceed the line total (${round2(lineMax)})`
      );
    }

    const batchNumber =
      raw.batch_number === undefined || raw.batch_number === null || raw.batch_number === ''
        ? undefined
        : String(raw.batch_number).trim();

    return {
      medicine_id: medicineId,
      quantity,
      unit_price: unitPrice,
      discount,
      ...(batchNumber ? { batch_number: batchNumber } : {}),
    } as CreateSaleItemDTO;
  });

  const subtotal = round2(validatedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0));

  const discount = input.discount === undefined || input.discount === null ? 0 : toNumber(input.discount, 'discount');
  if (discount < 0) {
    throw new ValidationError('discount cannot be negative');
  }
  if (discount > subtotal) {
    throw new ValidationError(`discount (${discount}) cannot exceed the subtotal (${subtotal})`);
  }

  const taxRate = input.tax_rate === undefined || input.tax_rate === null ? 0.05 : toNumber(input.tax_rate, 'tax_rate');
  if (taxRate < 0 || taxRate > MAX_TAX_RATE) {
    throw new ValidationError(`tax_rate must be between 0 and ${MAX_TAX_RATE}`);
  }

  const amountPaid =
    input.amount_paid === undefined || input.amount_paid === null ? 0 : toNumber(input.amount_paid, 'amount_paid');
  if (amountPaid < 0) {
    throw new ValidationError('amount_paid cannot be negative');
  }

  const total = calculateSaleTotal(subtotal, discount, taxRate);

  if (payment_method !== 'credit' && amountPaid < total) {
    throw new ValidationError(
      `amount_paid (${round2(amountPaid)}) is less than the total (${total}) for a ${payment_method} sale`
    );
  }

  return {
    customer_id: (customer_id as number | null | undefined) ?? null,
    items: validatedItems,
    discount,
    tax_rate: taxRate,
    payment_method: payment_method as PaymentMethod,
    amount_paid: round2(amountPaid),
    ...(input.notes ? { notes: String(input.notes) } : {}),
  };
}

/** Rounds to 2 decimal places, avoiding binary floating point drift. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateSaleTotal(subtotal: number, discount: number, taxRate: number): number {
  const taxable = round2(subtotal - discount);
  const tax = round2(taxable * taxRate);
  return round2(taxable + tax);
}

export function calculatePaymentStatus(amountPaid: number, total: number): 'paid' | 'partial' | 'unpaid' {
  if (round2(amountPaid) >= round2(total)) return 'paid';
  if (round2(amountPaid) > 0) return 'partial';
  return 'unpaid';
}