import { CreatePurchaseDTO, CreatePurchaseItemDTO } from './purchase.entity.js';
import { ValidationError } from '../../sales/domain/sale.rules.js';
import { round2 } from '../../sales/domain/sale.rules.js';

export { ValidationError };

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

export function validatePurchaseDTO(input: Partial<CreatePurchaseDTO>): CreatePurchaseDTO {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Request body is required');
  }

  const { items, supplier_id } = input;

  const supplierId = toPositiveInt(supplier_id, 'supplier_id');

  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('At least one purchase item is required');
  }

  if (items.length > 500) {
    throw new ValidationError('A purchase cannot contain more than 500 items');
  }

  const validatedItems: CreatePurchaseItemDTO[] = items.map((raw: any, index: number) => {
    const position = `items[${index}]`;

    const medicineId = toPositiveInt(raw?.medicine_id, `${position}.medicine_id`);
    const quantity = toPositiveInt(raw?.quantity, `${position}.quantity`);
    const purchasePrice = toNumber(raw?.unit_price, `${position}.unit_price`);
    const salePrice = toNumber(raw?.sale_price, `${position}.sale_price`);

    if (purchasePrice < 0) {
      throw new ValidationError(`${position}.unit_price cannot be negative`);
    }
    if (salePrice < 0) {
      throw new ValidationError(`${position}.sale_price cannot be negative`);
    }

    // purchase_items.batch_number is NOT NULL in the schema.
    const batchNumber = String(raw?.batch_number ?? '').trim();
    if (!batchNumber) {
      throw new ValidationError(`${position}.batch_number is required`);
    }
    if (batchNumber.length > 100) {
      throw new ValidationError(`${position}.batch_number cannot exceed 100 characters`);
    }

    // purchase_items.expiry_date is NOT NULL and must be a real, non-past date:
    // receiving already-expired stock is never valid (Agent.md section 41).
    const expiryRaw = raw?.expiry_date;
    if (expiryRaw === undefined || expiryRaw === null || expiryRaw === '') {
      throw new ValidationError(`${position}.expiry_date is required`);
    }

    const expiry = new Date(String(expiryRaw).slice(0, 10));
    if (Number.isNaN(expiry.getTime())) {
      throw new ValidationError(`${position}.expiry_date must be a valid date (YYYY-MM-DD)`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiry.getTime() < today.getTime()) {
      throw new ValidationError(`${position}.expiry_date must not be in the past`);
    }

    return {
      medicine_id: medicineId,
      batch_number: batchNumber,
      expiry_date: String(expiryRaw).slice(0, 10),
      quantity,
      unit_price: purchasePrice,
      sale_price: salePrice,
    };
  });

  const subtotal = round2(validatedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0));

  const discount =
    input.discount === undefined || input.discount === null ? 0 : toNumber(input.discount, 'discount');
  if (discount < 0) {
    throw new ValidationError('discount cannot be negative');
  }
  if (discount > subtotal) {
    throw new ValidationError(`discount (${discount}) cannot exceed the subtotal (${subtotal})`);
  }

  const taxRate =
    input.tax_rate === undefined || input.tax_rate === null ? 0 : toNumber(input.tax_rate, 'tax_rate');
  if (taxRate < 0 || taxRate > 1) {
    throw new ValidationError('tax_rate must be between 0 and 1');
  }

  return {
    supplier_id: supplierId,
    items: validatedItems,
    discount,
    tax_rate: taxRate,
    ...(input.invoice_number ? { invoice_number: String(input.invoice_number) } : {}),
    ...(input.notes ? { notes: String(input.notes) } : {}),
  };
}