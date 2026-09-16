export interface Medicine {
  id: number;
  name: string;
  generic: string;
  category: string;
  manufacturer: string;
  unit: string;
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

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.medicines = [
      {
        id: 1,
        name: 'Paracetamol 500mg',
        generic: 'Paracetamol',
        category: 'tablets',
        manufacturer: 'SGP Pharmaceuticals',
        unit: 'tablets',
        batch: 'P001',
        expiry: '2027-05-15',
        barcode: '8901234567890',
        purchasePrice: 40,
        salePrice: 50,
        stock: 150,
        reorderLevel: 10,
        description: 'Pain reliever and fever reducer',
      },
      {
        id: 2,
        name: 'Amoxicillin 500mg',
        generic: 'Amoxicillin',
        category: 'capsules',
        manufacturer: 'GlaxoSmithKline',
        unit: 'capsules',
        batch: 'A001',
        expiry: '2026-12-20',
        barcode: '8901234567891',
        purchasePrice: 100,
        salePrice: 120,
        stock: 80,
        reorderLevel: 15,
        description: 'Antibiotic for bacterial infections',
      },
      {
        id: 3,
        name: 'Cetirizine 10mg',
        generic: 'Cetirizine',
        category: 'tablets',
        manufacturer: 'SGP Pharmaceuticals',
        unit: 'tablets',
        batch: 'C001',
        expiry: '2027-08-10',
        barcode: '8901234567892',
        purchasePrice: 25,
        salePrice: 35,
        stock: 200,
        reorderLevel: 20,
        description: 'Antihistamine for allergies',
      },
      {
        id: 4,
        name: 'Panadol Extra',
        generic: 'Paracetamol + Caffeine',
        category: 'tablets',
        manufacturer: 'GlaxoSmithKline',
        unit: 'tablets',
        batch: 'PE01',
        expiry: '2027-03-25',
        barcode: '8901234567893',
        purchasePrice: 35,
        salePrice: 45,
        stock: 120,
        reorderLevel: 10,
        description: 'Extra strength pain reliever',
      },
      {
        id: 5,
        name: 'Brufen 400mg',
        generic: 'Ibuprofen',
        category: 'tablets',
        manufacturer: 'SGP Pharmaceuticals',
        unit: 'tablets',
        batch: 'B001',
        expiry: '2027-06-30',
        barcode: '8901234567894',
        purchasePrice: 45,
        salePrice: 55,
        stock: 90,
        reorderLevel: 10,
        description: 'Anti-inflammatory pain reliever',
      },
      {
        id: 6,
        name: 'Augmentin 625mg',
        generic: 'Amoxicillin + Clavulanate',
        category: 'tablets',
        manufacturer: 'GlaxoSmithKline',
        unit: 'tablets',
        batch: 'AU01',
        expiry: '2026-11-15',
        barcode: '8901234567895',
        purchasePrice: 250,
        salePrice: 280,
        stock: 45,
        reorderLevel: 8,
        description: 'Antibiotic for severe infections',
      },
      {
        id: 7,
        name: 'Nexium 40mg',
        generic: 'Esomeprazole',
        category: 'capsules',
        manufacturer: 'AstraZeneca',
        unit: 'capsules',
        batch: 'N001',
        expiry: '2027-09-20',
        barcode: '8901234567896',
        purchasePrice: 400,
        salePrice: 450,
        stock: 30,
        reorderLevel: 5,
        description: 'Proton pump inhibitor for acid reflux',
      },
      {
        id: 8,
        name: 'Glucophage 500mg',
        generic: 'Metformin',
        category: 'tablets',
        manufacturer: 'Merck',
        unit: 'tablets',
        batch: 'G001',
        expiry: '2027-07-15',
        barcode: '8901234567897',
        purchasePrice: 70,
        salePrice: 85,
        stock: 100,
        reorderLevel: 15,
        description: 'Diabetes medication',
      },
      {
        id: 9,
        name: 'Losartan 50mg',
        generic: 'Losartan',
        category: 'tablets',
        manufacturer: 'MSD',
        unit: 'tablets',
        batch: 'L001',
        expiry: '2027-04-10',
        barcode: '8901234567898',
        purchasePrice: 80,
        salePrice: 95,
        stock: 75,
        reorderLevel: 10,
        description: 'Blood pressure medication',
      },
      {
        id: 10,
        name: 'Atorvastatin 20mg',
        generic: 'Atorvastatin',
        category: 'tablets',
        manufacturer: 'Pfizer',
        unit: 'tablets',
        batch: 'AT01',
        expiry: '2027-10-25',
        barcode: '8901234567899',
        purchasePrice: 95,
        salePrice: 110,
        stock: 60,
        reorderLevel: 10,
        description: 'Cholesterol-lowering medication',
      },
      {
        id: 11,
        name: 'Azithromycin 500mg',
        generic: 'Azithromycin',
        category: 'tablets',
        manufacturer: 'Pfizer',
        unit: 'tablets',
        batch: 'AZ01',
        expiry: '2027-02-28',
        barcode: '8901234567900',
        purchasePrice: 160,
        salePrice: 180,
        stock: 55,
        reorderLevel: 8,
        description: 'Antibiotic for respiratory infections',
      },
      {
        id: 12,
        name: 'Metformin 850mg',
        generic: 'Metformin',
        category: 'tablets',
        manufacturer: 'Merck',
        unit: 'tablets',
        batch: 'M001',
        expiry: '2027-11-30',
        barcode: '8901234567901',
        purchasePrice: 55,
        salePrice: 65,
        stock: 110,
        reorderLevel: 15,
        description: 'Diabetes medication',
      },
      {
        id: 13,
        name: 'Omeprazole 20mg',
        generic: 'Omeprazole',
        category: 'capsules',
        manufacturer: 'AstraZeneca',
        unit: 'capsules',
        batch: 'O001',
        expiry: '2027-08-05',
        barcode: '8901234567902',
        purchasePrice: 65,
        salePrice: 75,
        stock: 85,
        reorderLevel: 10,
        description: 'Proton pump inhibitor',
      },
      {
        id: 14,
        name: 'Amlodipine 5mg',
        generic: 'Amlodipine',
        category: 'tablets',
        manufacturer: 'Pfizer',
        unit: 'tablets',
        batch: 'AM01',
        expiry: '2027-12-15',
        barcode: '8901234567903',
        purchasePrice: 40,
        salePrice: 50,
        stock: 95,
        reorderLevel: 10,
        description: 'Blood pressure medication',
      },
      {
        id: 15,
        name: 'Cough Syrup',
        generic: 'Dextromethorphan',
        category: 'syrups',
        manufacturer: 'SGP Pharmaceuticals',
        unit: 'ml',
        batch: 'CS01',
        expiry: '2026-10-20',
        barcode: '8901234567904',
        purchasePrice: 100,
        salePrice: 120,
        stock: 40,
        reorderLevel: 5,
        description: 'Cough suppressant syrup',
      },
      {
        id: 16,
        name: 'Mixtures Syrup',
        generic: 'Multi-ingredient',
        category: 'syrups',
        manufacturer: 'SGP Pharmaceuticals',
        unit: 'ml',
        batch: 'MS01',
        expiry: '2026-09-15',
        barcode: '8901234567905',
        purchasePrice: 75,
        salePrice: 90,
        stock: 35,
        reorderLevel: 5,
        description: 'Digestive mixture syrup',
      },
      {
        id: 17,
        name: 'Voltaren Gel',
        generic: 'Diclofenac',
        category: 'ointments',
        manufacturer: 'Novartis',
        unit: 'grams',
        batch: 'V001',
        expiry: '2027-06-10',
        barcode: '8901234567906',
        purchasePrice: 200,
        salePrice: 220,
        stock: 25,
        reorderLevel: 5,
        description: 'Anti-inflammatory gel',
      },
      {
        id: 18,
        name: 'Betnovate Cream',
        generic: 'Betamethasone',
        category: 'ointments',
        manufacturer: 'GlaxoSmithKline',
        unit: 'grams',
        batch: 'BV01',
        expiry: '2027-04-20',
        barcode: '8901234567907',
        purchasePrice: 70,
        salePrice: 85,
        stock: 50,
        reorderLevel: 8,
        description: 'Corticosteroid cream',
      },
      {
        id: 19,
        name: 'Deriphyllin Retard',
        generic: 'Theophylline',
        category: 'tablets',
        manufacturer: 'SGP Pharmaceuticals',
        unit: 'tablets',
        batch: 'DR01',
        expiry: '2027-05-25',
        barcode: '8901234567908',
        purchasePrice: 55,
        salePrice: 65,
        stock: 70,
        reorderLevel: 10,
        description: 'Bronchodilator for asthma',
      },
      {
        id: 20,
        name: 'Voltaren Injection',
        generic: 'Diclofenac',
        category: 'injections',
        manufacturer: 'Novartis',
        unit: 'ml',
        batch: 'VI01',
        expiry: '2027-01-30',
        barcode: '8901234567909',
        purchasePrice: 85,
        salePrice: 95,
        stock: 30,
        reorderLevel: 5,
        description: 'Injectable anti-inflammatory',
      },
    ];
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

  add(medicine: Omit<Medicine, 'id'>): Medicine {
    const newId = Math.max(...this.medicines.map((m) => m.id), 0) + 1;
    const newMedicine: Medicine = { ...medicine, id: newId };
    this.medicines.push(newMedicine);
    this.notify();
    return newMedicine;
  }

  update(id: number, updates: Partial<Medicine>): Medicine | undefined {
    const index = this.medicines.findIndex((m) => m.id === id);
    if (index === -1) return undefined;
    this.medicines[index] = { ...this.medicines[index], ...updates };
    this.notify();
    return this.medicines[index];
  }

  delete(id: number): boolean {
    const index = this.medicines.findIndex((m) => m.id === id);
    if (index === -1) return false;
    this.medicines.splice(index, 1);
    this.notify();
    return true;
  }

  updateStock(id: number, quantityChange: number): Medicine | undefined {
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
