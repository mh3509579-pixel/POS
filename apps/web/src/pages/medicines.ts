import { medicineStore, Medicine } from '../stores/medicine.store';
import { medicineService } from '../services/medicine.service';

export function renderMedicines(): string {
  return `
    <div class="page-header d-flex justify-content-between align-items-center">
      <div>
        <h4>Medicines</h4>
        <p>Manage your medicine inventory and catalog</p>
      </div>
      <button class="btn btn-brand-green" id="addMedicineBtn">
        <i class="bi bi-plus-lg me-2"></i>Add Medicine
      </button>
    </div>

    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="searchMedicine" placeholder="Search by name, batch, or barcode...">
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="filterCategory">
              <option value="">All Categories</option>
              <option value="tablets">Tablets</option>
              <option value="capsules">Capsules</option>
              <option value="syrups">Syrups</option>
              <option value="injections">Injections</option>
              <option value="ointments">Ointments</option>
              <option value="drops">Drops</option>
              <option value="powder">Powder</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" id="filterStock">
              <option value="">All Stock Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
          <div class="col-md-2">
            <select class="form-select" id="filterExpiry">
              <option value="">All Expiry</option>
              <option value="expired">Expired</option>
              <option value="expiring-30">Expiring in 30 days</option>
              <option value="expiring-60">Expiring in 60 days</option>
              <option value="expiring-90">Expiring in 90 days</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="mb-0">Medicine List</h6>
        <span class="text-muted" id="medicineCount">0 medicines</span>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Category</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th>Stock</th>
                <th>Purchase Price</th>
                <th>Sale Price</th>
                <th>Status</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody id="medicinesTableBody">
            </tbody>
          </table>
        </div>
      </div>
      <div class="card-footer">
        <nav aria-label="Medicine pagination">
          <ul class="pagination justify-content-center mb-0" id="pagination">
          </ul>
        </nav>
      </div>
    </div>

    <!-- Add/Edit Medicine Modal -->
    <div class="modal" id="medicineModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="medicineModalTitle">Add New Medicine</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="medicineForm">
              <input type="hidden" id="medicineId">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Medicine Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="medicineName" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Generic Name</label>
                  <input type="text" class="form-control" id="genericName">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Category <span class="text-danger">*</span></label>
                  <select class="form-select" id="medicineCategory" required>
                    <option value="">Select Category</option>
                    <option value="tablets">Tablets</option>
                    <option value="capsules">Capsules</option>
                    <option value="syrups">Syrups</option>
                    <option value="injections">Injections</option>
                    <option value="ointments">Ointments</option>
                    <option value="drops">Drops</option>
                    <option value="powder">Powder</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Manufacturer</label>
                  <select class="form-select" id="medicineManufacturer">
                    <option value="">Select Manufacturer</option>
                    <option value="sgp">SGP Pharmaceuticals</option>
                    <option value="gsk">GlaxoSmithKline</option>
                    <option value="pfizer">Pfizer</option>
                    <option value="bayer">Bayer</option>
                    <option value="sun">Sun Pharma</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Unit <span class="text-danger">*</span></label>
                  <select class="form-select" id="medicineUnit" required>
                    <option value="">Select Unit</option>
                    <option value="tablets">Tablets</option>
                    <option value="capsules">Capsules</option>
                    <option value="ml">ML</option>
                    <option value="grams">Grams</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Batch Number <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="batchNumber" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Expiry Date <span class="text-danger">*</span></label>
                  <input type="date" class="form-control" id="expiryDate" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Barcode</label>
                  <input type="text" class="form-control" id="barcode">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Purchase Price <span class="text-danger">*</span></label>
                  <input type="number" class="form-control" id="purchasePrice" step="0.01" min="0" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Sale Price <span class="text-danger">*</span></label>
                  <input type="number" class="form-control" id="salePrice" step="0.01" min="0" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Initial Stock <span class="text-danger">*</span></label>
                  <input type="number" class="form-control" id="initialStock" min="0" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Reorder Level</label>
                  <input type="number" class="form-control" id="reorderLevel" min="0" value="10">
                </div>
                <div class="col-12">
                  <label class="form-label">Description</label>
                  <textarea class="form-control" id="medicineDescription" rows="2"></textarea>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-brand-green" id="saveMedicineBtn">Save Medicine</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initMedicines(): () => void {
  let currentPage = 1;
  const itemsPerPage = 10;
  let filteredMedicines: Medicine[] = medicineStore.getAll();

  // Try loading from API
  medicineService.getAll({ limit: 100 }).then(({ data }) => {
    if (data && data.length > 0) {
      const mapped: Medicine[] = data.map((m) => ({
        id: m.id,
        name: m.name,
        generic: m.generic_name || '',
        category: m.category_name?.toLowerCase() || 'tablets',
        batch: m.batches?.[0]?.batch_number || '',
        expiry: m.batches?.[0]?.expiry_date || '',
        stock: m.total_stock,
        purchasePrice: m.batches?.[0]?.purchase_price || 0,
        salePrice: m.batches?.[0]?.sale_price || 0,
        barcode: m.barcode || '',
        manufacturer: m.manufacturer_name || '',
        unit: m.unit_name || 'tab',
        reorderLevel: m.reorder_level,
        description: m.description || '',
      }));
      filteredMedicines = mapped;
      renderTable();
    }
  }).catch(() => {
    // Fallback to local store (already initialized)
  });

  function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      tablets: 'bi-tablet',
      capsules: 'bi-capsule',
      syrups: 'bi-droplet-half',
      injections: 'bi-syringe',
      ointments: 'bi-tube',
      drops: 'bi-droplet',
      powder: 'bi-box',
    };
    return icons[category] || 'bi-pill';
  }

  function getStockStatus(stock: number, reorderLevel: number): { class: string; text: string } {
    if (stock === 0) return { class: 'badge-danger', text: 'Out of Stock' };
    if (stock <= reorderLevel) return { class: 'badge-warning', text: 'Low Stock' };
    return { class: 'badge-success', text: 'In Stock' };
  }

  function getExpiryStatus(expiry: string): { class: string; text: string } {
    const today = new Date();
    const expiryDate = new Date(expiry);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { class: 'badge-danger', text: 'Expired' };
    if (daysUntilExpiry <= 30) return { class: 'badge-danger', text: `${daysUntilExpiry}d` };
    if (daysUntilExpiry <= 60) return { class: 'badge-warning', text: `${daysUntilExpiry}d` };
    if (daysUntilExpiry <= 90) return { class: 'badge-warning', text: `${daysUntilExpiry}d` };
    return { class: 'badge-success', text: expiry };
  }

  function renderTable(): void {
    const tbody = document.getElementById('medicinesTableBody');
    const countEl = document.getElementById('medicineCount');
    if (!tbody) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageMedicines = filteredMedicines.slice(start, end);

    if (countEl) {
      countEl.textContent = `${filteredMedicines.length} medicine${filteredMedicines.length !== 1 ? 's' : ''}`;
    }

    if (pageMedicines.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-5">
            <div class="text-muted">
              <i class="bi bi-capsule fs-1 d-block mb-2"></i>
              <h6>No medicines found</h6>
              <p class="mb-0">Try adjusting your search or filter criteria</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pageMedicines
      .map((med) => {
        const stockStatus = getStockStatus(med.stock, med.reorderLevel);
        const expiryStatus = getExpiryStatus(med.expiry);
        return `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="product-icon" style="width:36px;height:36px;min-width:36px;">
                <i class="bi ${getCategoryIcon(med.category)}" style="font-size:14px;"></i>
              </div>
              <div>
                <div class="fw-semibold">${med.name}</div>
                <small class="text-muted">${med.generic}</small>
              </div>
            </div>
          </td>
          <td><span class="text-capitalize">${med.category}</span></td>
          <td><code>${med.batch}</code></td>
          <td><span class="badge-status ${expiryStatus.class}">${expiryStatus.text}</span></td>
          <td>
            <span class="fw-semibold">${med.stock}</span>
            <small class="text-muted">${med.unit}</small>
          </td>
          <td>₨ ${med.purchasePrice.toFixed(2)}</td>
          <td>₨ ${med.salePrice.toFixed(2)}</td>
          <td><span class="badge-status ${stockStatus.class}">${stockStatus.text}</span></td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary view-btn" data-id="${med.id}" title="View">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-outline-secondary edit-btn" data-id="${med.id}" title="Edit">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-outline-danger delete-btn" data-id="${med.id}" title="Delete">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
      })
      .join('');

    renderPagination();
    attachTableEvents();
  }

  function renderPagination(): void {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage);
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let html = `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <li class="page-item ${currentPage === i ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    html += `
      <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
      </li>
    `;

    pagination.innerHTML = html;

    pagination.querySelectorAll('.page-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(link.getAttribute('data-page') || '1');
        if (page >= 1 && page <= totalPages) {
          currentPage = page;
          renderTable();
        }
      });
    });
  }

  function filterMedicines(): void {
    const search = (document.getElementById('searchMedicine') as HTMLInputElement)?.value.toLowerCase() || '';
    const category = (document.getElementById('filterCategory') as HTMLSelectElement)?.value || '';
    const stock = (document.getElementById('filterStock') as HTMLSelectElement)?.value || '';
    const expiry = (document.getElementById('filterExpiry') as HTMLSelectElement)?.value || '';

    const allMedicines = medicineStore.getAll();

    filteredMedicines = allMedicines.filter((med) => {
      const matchSearch =
        !search ||
        med.name.toLowerCase().includes(search) ||
        med.generic.toLowerCase().includes(search) ||
        med.batch.toLowerCase().includes(search) ||
        med.barcode.includes(search);

      const matchCategory = !category || med.category === category;

      let matchStock = true;
      if (stock === 'in-stock') matchStock = med.stock > med.reorderLevel;
      else if (stock === 'low-stock') matchStock = med.stock > 0 && med.stock <= med.reorderLevel;
      else if (stock === 'out-of-stock') matchStock = med.stock === 0;

      let matchExpiry = true;
      if (expiry) {
        const today = new Date();
        const expiryDate = new Date(med.expiry);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (expiry === 'expired') matchExpiry = daysUntilExpiry < 0;
        else if (expiry === 'expiring-30') matchExpiry = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
        else if (expiry === 'expiring-60') matchExpiry = daysUntilExpiry >= 0 && daysUntilExpiry <= 60;
        else if (expiry === 'expiring-90') matchExpiry = daysUntilExpiry >= 0 && daysUntilExpiry <= 90;
      }

      return matchSearch && matchCategory && matchStock && matchExpiry;
    });

    currentPage = 1;
    renderTable();
  }

  function attachTableEvents(): void {
    document.querySelectorAll('.view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id') || '0');
        const med = medicineStore.getById(id);
        if (med) {
          alert(
            `Medicine: ${med.name}\nGeneric: ${med.generic}\nCategory: ${med.category}\nBatch: ${med.batch}\nStock: ${med.stock} ${med.unit}\nExpiry: ${med.expiry}`,
          );
        }
      });
    });

    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id') || '0');
        const med = medicineStore.getById(id);
        if (med) {
          openModal(med);
        }
      });
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id') || '0');
        if (confirm('Are you sure you want to delete this medicine?')) {
          medicineStore.delete(id);
          filterMedicines();
        }
      });
    });
  }

  function openModal(med?: Medicine): void {
    const modal = document.getElementById('medicineModal');
    const title = document.getElementById('medicineModalTitle');
    if (!modal) return;

    if (med) {
      if (title) title.textContent = 'Edit Medicine';
      (document.getElementById('medicineId') as HTMLInputElement).value = String(med.id);
      (document.getElementById('medicineName') as HTMLInputElement).value = med.name;
      (document.getElementById('genericName') as HTMLInputElement).value = med.generic;
      (document.getElementById('medicineCategory') as HTMLSelectElement).value = med.category;
      (document.getElementById('medicineUnit') as HTMLSelectElement).value = med.unit;
      (document.getElementById('batchNumber') as HTMLInputElement).value = med.batch;
      (document.getElementById('expiryDate') as HTMLInputElement).value = med.expiry;
      (document.getElementById('barcode') as HTMLInputElement).value = med.barcode;
      (document.getElementById('purchasePrice') as HTMLInputElement).value = String(med.purchasePrice);
      (document.getElementById('salePrice') as HTMLInputElement).value = String(med.salePrice);
      (document.getElementById('initialStock') as HTMLInputElement).value = String(med.stock);
      (document.getElementById('reorderLevel') as HTMLInputElement).value = String(med.reorderLevel);
      (document.getElementById('medicineDescription') as HTMLTextAreaElement).value = med.description;
    } else {
      if (title) title.textContent = 'Add New Medicine';
      (document.getElementById('medicineForm') as HTMLFormElement)?.reset();
      (document.getElementById('medicineId') as HTMLInputElement).value = '';
    }

    modal.classList.add('show');
  }

  function closeModal(): void {
    const modal = document.getElementById('medicineModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  function saveMedicine(): void {
    const form = document.getElementById('medicineForm') as HTMLFormElement;
    if (!form?.checkValidity()) {
      form?.reportValidity();
      return;
    }

    const id = (document.getElementById('medicineId') as HTMLInputElement).value;
    const medicineData = {
      name: (document.getElementById('medicineName') as HTMLInputElement).value,
      generic: (document.getElementById('genericName') as HTMLInputElement).value,
      category: (document.getElementById('medicineCategory') as HTMLSelectElement).value,
      manufacturer: (document.getElementById('medicineManufacturer') as HTMLSelectElement).value,
      unit: (document.getElementById('medicineUnit') as HTMLSelectElement).value,
      batch: (document.getElementById('batchNumber') as HTMLInputElement).value,
      expiry: (document.getElementById('expiryDate') as HTMLInputElement).value,
      barcode: (document.getElementById('barcode') as HTMLInputElement).value,
      purchasePrice: parseFloat((document.getElementById('purchasePrice') as HTMLInputElement).value),
      salePrice: parseFloat((document.getElementById('salePrice') as HTMLInputElement).value),
      stock: parseInt((document.getElementById('initialStock') as HTMLInputElement).value),
      reorderLevel: parseInt((document.getElementById('reorderLevel') as HTMLInputElement).value),
      description: (document.getElementById('medicineDescription') as HTMLTextAreaElement).value,
    };

    if (id) {
      medicineStore.update(parseInt(id), medicineData);
    } else {
      medicineStore.add(medicineData);
    }

    closeModal();
    filterMedicines();
  }

  // Event listeners
  document.getElementById('searchMedicine')?.addEventListener('input', filterMedicines);
  document.getElementById('filterCategory')?.addEventListener('change', filterMedicines);
  document.getElementById('filterStock')?.addEventListener('change', filterMedicines);
  document.getElementById('filterExpiry')?.addEventListener('change', filterMedicines);

  document.getElementById('addMedicineBtn')?.addEventListener('click', () => openModal());
  document.getElementById('saveMedicineBtn')?.addEventListener('click', saveMedicine);

  document.querySelector('#medicineModal .btn-close')?.addEventListener('click', closeModal);
  document.querySelector('#medicineModal [data-bs-dismiss="modal"]')?.addEventListener('click', closeModal);

  document.getElementById('medicineModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Subscribe to store changes
  const unsubscribe = medicineStore.subscribe(() => {
    filterMedicines();
  });

  // Initial render
  filterMedicines();

  // Return cleanup function
  return () => {
    unsubscribe();
  };
}
