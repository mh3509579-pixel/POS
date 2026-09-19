import api from '../services/api.service';

export interface Medicine {
  id: number;
  name: string;
  generic: string;
  category: string;
  category_id: number | null;
  manufacturer: string;
  manufacturer_id: number | null;
  unit: string;
  unit_id: number | null;
  batch: string;
  expiry: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  reorderLevel: number;
  description: string;
}

type Subscriber = (medicines: Medicine[]) => void;

class MedicineStore {
  private medicines: Medicine[] = [];
  private subscribers: Subscriber[] = [];
  private loaded = false;

  async loadMedicines(): Promise<void> {
    if (this.loaded) return;
    await this.fetchMedicines();
  }

  async refresh(): Promise<void> {
    this.loaded = false;
    await this.fetchMedicines();
  }

  private async fetchMedicines(): Promise<void> {
    try {
      const response = await api.get<{ status: string; data: any[] }>('/medicines?limit=500');
      this.medicines = response.data.data.map((m: any) => ({
        id: m.id,
        name: m.name,
        generic: m.generic_name || '',
        category: m.category_name || '',
        category_id: m.category_id ?? null,
        manufacturer: m.manufacturer_name || '',
        manufacturer_id: m.manufacturer_id ?? null,
        unit: m.unit_name || '',
        unit_id: m.unit_id ?? null,
        batch: m.batches?.[0]?.batch_number || '',
        expiry: m.batches?.[0]?.expiry_date || '',
        barcode: m.barcode || '',
        purchasePrice: m.batches?.[0]?.purchase_price || 0,
        salePrice: m.batches?.[0]?.sale_price || 0,
        stock: m.total_stock || 0,
        reorderLevel: m.reorder_level || 0,
        description: m.description || '',
      }));
      this.loaded = true;
    } catch (error) {
      console.warn('API unavailable, loading demo medicines');
      this.medicines = DEMO_MEDICINES;
      this.loaded = true;
    }
  }

  getAll(): Medicine[] {
    return [...this.medicines];
  }

  getById(id: number): Medicine | undefined {
    return this.medicines.find((m) => m.id === id);
  }

  getByBarcode(barcode: string): Medicine | undefined {
    return this.medicines.find((m) => m.barcode === barcode);
  }

  search(query: string): Medicine[] {
    const q = query.toLowerCase();
    return this.medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.generic.toLowerCase().includes(q) ||
        m.batch.toLowerCase().includes(q) ||
        m.barcode.includes(q),
    );
  }

  async add(medicine: Omit<Medicine, 'id'>): Promise<Medicine | null> {
    try {
      const response = await api.post<{ status: string; data: any }>('/medicines', {
        name: medicine.name,
        generic_name: medicine.generic,
        barcode: medicine.barcode,
        description: medicine.description,
        reorder_level: medicine.reorderLevel,
      });
      const newMedicine: Medicine = {
        ...medicine,
        id: response.data.data.id,
      };
      this.medicines.push(newMedicine);
      this.notify();
      return newMedicine;
    } catch (error) {
      console.error('Failed to add medicine:', error);
      return null;
    }
  }

  async update(id: number, updates: Partial<Medicine>): Promise<Medicine | undefined> {
    try {
      await api.put(`/medicines/${id}`, {
        name: updates.name,
        generic_name: updates.generic,
        barcode: updates.barcode,
        description: updates.description,
        reorder_level: updates.reorderLevel,
      });
      const index = this.medicines.findIndex((m) => m.id === id);
      if (index === -1) return undefined;
      this.medicines[index] = { ...this.medicines[index], ...updates };
      this.notify();
      return this.medicines[index];
    } catch (error) {
      console.error('Failed to update medicine:', error);
      return undefined;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await api.delete(`/medicines/${id}`);
      const index = this.medicines.findIndex((m) => m.id === id);
      if (index === -1) return false;
      this.medicines.splice(index, 1);
      this.notify();
      return true;
    } catch (error) {
      console.error('Failed to delete medicine:', error);
      return false;
    }
  }

  async updateStock(id: number, quantityChange: number): Promise<Medicine | undefined> {
    try {
      await api.post(`/medicines/${id}/stock-update`, { quantity_change: quantityChange });
    } catch {
      // Fallback to local update if API unavailable
    }
    const medicine = this.medicines.find((m) => m.id === id);
    if (!medicine) return undefined;
    medicine.stock = Math.max(0, medicine.stock + quantityChange);
    this.notify();
    return medicine;
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notify(): void {
    this.subscribers.forEach((callback) => callback(this.getAll()));
  }
}

export const medicineStore = new MedicineStore();

const DEMO_MEDICINES: Medicine[] = [
  { id: 1, name: 'Panadol', generic: 'Paracetamol', category: 'Analgesic', category_id: null, manufacturer: 'GSK', manufacturer_id: null, unit: 'Tablet', unit_id: null, batch: 'B001', expiry: '2027-12-31', barcode: '8901234567890', purchasePrice: 5, salePrice: 10, stock: 500, reorderLevel: 100, description: 'Pain reliever' },
  { id: 2, name: 'Amoxicillin', generic: 'Amoxicillin', category: 'Antibiotic', category_id: null, manufacturer: 'Sandoz', manufacturer_id: null, unit: 'Capsule', unit_id: null, batch: 'B002', expiry: '2027-06-30', barcode: '8901234567891', purchasePrice: 15, salePrice: 25, stock: 300, reorderLevel: 50, description: 'Antibiotic' },
  { id: 3, name: 'Nexium', generic: 'Esomeprazole', category: 'Antacid', category_id: null, manufacturer: 'AstraZeneca', manufacturer_id: null, unit: 'Tablet', unit_id: null, batch: 'B003', expiry: '2027-09-30', barcode: '8901234567892', purchasePrice: 30, salePrice: 50, stock: 200, reorderLevel: 30, description: 'Acid reflux' },
  { id: 4, name: 'Ventolin', generic: 'Salbutamol', category: 'Respiratory', category_id: null, manufacturer: 'GSK', manufacturer_id: null, unit: 'Inhaler', unit_id: null, batch: 'B004', expiry: '2027-03-31', barcode: '8901234567893', purchasePrice: 150, salePrice: 250, stock: 50, reorderLevel: 10, description: 'Asthma inhaler' },
  { id: 5, name: 'Lipitor', generic: 'Atorvastatin', category: 'Cardiovascular', category_id: null, manufacturer: 'Pfizer', manufacturer_id: null, unit: 'Tablet', unit_id: null, batch: 'B005', expiry: '2027-11-30', barcode: '8901234567894', purchasePrice: 40, salePrice: 70, stock: 150, reorderLevel: 25, description: 'Cholesterol' },
];
